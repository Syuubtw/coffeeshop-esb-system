<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use App\Services\AccountingService;
use App\Services\AuditService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

#[Group(
    name: '04. Kasir (POS & Kas Laci)',
    description: 'Operasional kasir: buka/tutup shift laci kasir, transaksi kasir langsung, daftar pesanan, dan pelunasan bayar.',
    weight: 4
)]
class PosController extends Controller
{
    /**
     * Buka Shift Kasir Baru (Input Modal Awal Kas Laci)
     */
    public function openShift(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'starting_cash' => 'required|numeric|min:0',
        ]);

        $activeShift = CashierShift::where('user_id', $request->user()->id)
            ->whereNull('closed_at')
            ->first();

        if ($activeShift) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda masih memiliki shift kasir yang aktif.',
                'data' => $activeShift,
            ], 400);
        }

        $shift = CashierShift::create([
            'user_id' => $request->user()->id,
            'opened_at' => now(),
            'starting_cash' => $validated['starting_cash'],
            'expected_ending_cash' => $validated['starting_cash'],
        ]);

        AuditService::log(
            'SHIFT_OPEN',
            'CashierShift',
            $shift->id,
            "Kasir {$request->user()->name} membuka shift kasir dengan modal Rp " . number_format($validated['starting_cash'], 0, ',', '.')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Shift kasir berhasil dibuka.',
            'data' => $shift,
        ], 201);
    }

    /**
     * Tutup Shift Kasir & Rekonsiliasi Kas Fisik Laci
     */
    public function closeShift(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actual_ending_cash' => 'required|numeric|min:0',
        ]);

        $shift = CashierShift::where('user_id', $request->user()->id)
            ->whereNull('closed_at')
            ->first();

        if (!$shift) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada shift kasir yang aktif.',
            ], 404);
        }

        // Calculate total cash sales in this shift
        $cashSales = Order::where('cashier_shift_id', $shift->id)
            ->where('payment_method', 'CASH')
            ->where('payment_status', 'PAID')
            ->sum('grand_total');

        $expectedEnding = $shift->starting_cash + $cashSales;

        $shift->update([
            'closed_at' => now(),
            'expected_ending_cash' => $expectedEnding,
            'actual_ending_cash' => $validated['actual_ending_cash'],
        ]);

        $difference = $validated['actual_ending_cash'] - $expectedEnding;

        AuditService::log(
            'SHIFT_CLOSED',
            'CashierShift',
            $shift->id,
            "Kasir {$request->user()->name} menutup shift. Kas Fisik Rp " . number_format($validated['actual_ending_cash'], 0, ',', '.') . 
            ", Seharusnya Rp " . number_format($expectedEnding, 0, ',', '.') . 
            ", Selisih: Rp " . number_format($difference, 0, ',', '.')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Shift kasir berhasil ditutup.',
            'data' => [
                'shift' => $shift,
                'difference' => $difference,
            ],
        ]);
    }

    /**
     * Buat Transaksi Pesanan Kasir (Dine-in / Takeaway)
     */
    public function storeOrder(Request $request): JsonResponse
    {
        $shift = CashierShift::where('user_id', $request->user()->id)
            ->whereNull('closed_at')
            ->first();

        if (!$shift) {
            return response()->json([
                'status' => 'error',
                'message' => 'Buka shift kasir terlebih dahulu sebelum membuat pesanan.',
            ], 400);
        }

        $validated = $request->validate([
            'dining_table_id' => 'nullable|exists:dining_tables,id',
            'order_type' => 'required|string|in:DINE_IN,TAKEAWAY',
            'customer_name' => 'nullable|string|max:100',
            'payment_method' => 'required|string|in:CASH,QRIS,CARD,E_WALLET',
            'discount_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'items.*.modifiers' => 'nullable|array',
            'items.*.modifiers.*.modifier_id' => 'required|exists:modifiers,id',
            'items.*.modifiers.*.modifier_name' => 'required|string',
            'items.*.modifiers.*.additional_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $shift) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $itemInput) {
                $product = Product::with('recipes.rawMaterial')->findOrFail($itemInput['product_id']);

                $lineTotal = $product->base_price * $itemInput['qty'];
                if (!empty($itemInput['modifiers'])) {
                    foreach ($itemInput['modifiers'] as $mod) {
                        $lineTotal += ($mod['additional_price'] * $itemInput['qty']);
                    }
                }
                $subtotal += $lineTotal;

                $unitCogs = 0;
                foreach ($product->recipes as $recipe) {
                    $unitCogs += ($recipe->qty_needed * ($recipe->rawMaterial->avg_cost_per_unit ?? 0));
                }

                $itemsData[] = [
                    'product' => $product,
                    'qty' => $itemInput['qty'],
                    'unit_price' => $product->base_price,
                    'unit_cogs' => $unitCogs,
                    'subtotal' => $lineTotal,
                    'notes' => $itemInput['notes'] ?? null,
                    'modifiers' => $itemInput['modifiers'] ?? [],
                ];
            }

            $discount = $validated['discount_amount'] ?? 0;
            $taxableSubtotal = max(0, $subtotal - $discount);
            $taxAmount = round($taxableSubtotal * 0.10, 2);
            $serviceCharge = round($taxableSubtotal * 0.05, 2);
            $grandTotal = $taxableSubtotal + $taxAmount + $serviceCharge;

            $order = Order::create([
                'order_number' => 'POS-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'dining_table_id' => $validated['dining_table_id'] ?? null,
                'cashier_shift_id' => $shift->id,
                'order_source' => 'POS',
                'order_type' => $validated['order_type'],
                'customer_name' => $validated['customer_name'] ?? 'Walk-in Guest',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'service_charge' => $serviceCharge,
                'discount_amount' => $discount,
                'grand_total' => $grandTotal,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'PAID',
                'order_status' => 'CONFIRMED',
            ]);

            foreach ($itemsData as $row) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $row['product']->id,
                    'qty' => $row['qty'],
                    'unit_price' => $row['unit_price'],
                    'unit_cogs' => $row['unit_cogs'],
                    'subtotal' => $row['subtotal'],
                    'notes' => $row['notes'],
                ]);

                foreach ($row['modifiers'] as $modRow) {
                    OrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'modifier_id' => $modRow['modifier_id'],
                        'modifier_name' => $modRow['modifier_name'],
                        'additional_price' => $modRow['additional_price'],
                    ]);
                }

                // Inventory auto deduction
                foreach ($row['product']->recipes as $recipe) {
                    $qtyDeducted = $recipe->qty_needed * $row['qty'];
                    RawMaterial::where('id', $recipe->raw_material_id)->decrement('current_stock', $qtyDeducted);

                    StockMovement::create([
                        'raw_material_id' => $recipe->raw_material_id,
                        'type' => 'OUT_SALE',
                        'qty' => $qtyDeducted,
                        'unit_cost' => $recipe->rawMaterial->avg_cost_per_unit ?? 0,
                        'reference_type' => Order::class,
                        'reference_id' => $order->id,
                        'notes' => "Sale via POS Order #{$order->order_number}",
                    ]);
                }
            }

            if (!empty($validated['dining_table_id'])) {
                DiningTable::where('id', $validated['dining_table_id'])->update(['status' => 'OCCUPIED']);
            }

            // Auto-Journaling for POS sale
            app(AccountingService::class)->recordOrderSale($order);

            AuditService::log(
                'ORDER_PAID',
                'Order',
                $order->id,
                "Pesanan kasir #{$order->order_number} lunas ({$order->payment_method}) Rp " . number_format($order->grand_total, 0, ',', '.')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan POS berhasil diproses.',
                'data' => $order->load(['items.modifiers', 'diningTable']),
            ], 201);
        });
    }

    /**
     * Daftar Riwayat Transaksi Pesanan Kasir
     */
    public function recentOrders(Request $request): JsonResponse
    {
        $query = Order::with(['items.product', 'items.modifiers', 'diningTable'])
            ->latest();

        if ($request->filled('month') && $request->filled('year')) {
            $monthStart = \Carbon\Carbon::create((int) $request->year, (int) $request->month, 1)->startOfMonth();
            $monthEnd = \Carbon\Carbon::create((int) $request->year, (int) $request->month, 1)->endOfMonth();
            $query->whereBetween('created_at', [$monthStart, $monthEnd]);
        }

        $orders = $query->paginate(50);

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    /**
     * Konfirmasi Pelunasan Pembayaran Kasir (Cash / QRIS)
     */
    public function confirmPayment(Request $request, int $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);
        
        $paymentMethod = $request->input('payment_method', $order->payment_method ?? 'CASH');
        
        $order->update([
            'payment_status' => 'PAID',
            'order_status' => $order->order_status === 'PENDING' ? 'CONFIRMED' : $order->order_status,
            'payment_method' => $paymentMethod,
        ]);

        // Auto-Journaling on cashier confirmation
        app(AccountingService::class)->recordOrderSale($order);

        AuditService::log(
            'PAYMENT_CONFIRMED',
            'Order',
            $order->id,
            "Kasir mengonfirmasi pembayaran lunas order meja #{$order->order_number} ({$paymentMethod}) Rp " . number_format($order->grand_total, 0, ',', '.')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pembayaran pesanan kasir berhasil dikonfirmasi.',
            'data' => $order->load(['items.product', 'items.modifiers', 'diningTable']),
        ]);
    }

    /**
     * Perbarui Status Alur Pesanan (Selesai / Batal)
     */
    public function updateOrderStatus(Request $request, int $orderId): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => 'required|string|in:CONFIRMED,PREPARING,READY,SERVED,COMPLETED,CANCELLED',
        ]);

        $order = Order::findOrFail($orderId);
        $order->update(['order_status' => $validated['order_status']]);

        if (in_array($validated['order_status'], ['COMPLETED', 'CANCELLED']) && $order->dining_table_id) {
            DiningTable::where('id', $order->dining_table_id)->update(['status' => 'AVAILABLE']);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Status pesanan berhasil diubah menjadi {$validated['order_status']}",
            'data' => $order->load(['items.product', 'items.modifiers', 'diningTable']),
        ]);
    }
}

