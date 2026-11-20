<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

#[Group(
    name: '02. Pelanggan (Self-Service QR Meja)',
    description: 'Endpoint pemesanan mandiri oleh pelanggan via QR code meja (cek meja, order menu, lacak status).',
    weight: 2
)]
class QrOrderController extends Controller
{
    /**
     * Scan & Verifikasi Token QR Meja serta Ambil Menu Aktif
     */
    public function verifyTable(string $token): JsonResponse
    {
        $table = DiningTable::where('qr_token', $token)
            ->orWhere('table_number', strtoupper($token))
            ->first();

        if (!$table) {
            $table = DiningTable::firstOrCreate(
                ['table_number' => strtoupper($token)],
                [
                    'qr_token' => Str::uuid()->toString(),
                    'capacity' => 4,
                    'status' => 'AVAILABLE',
                ]
            );
        }

        $menu = Product::with(['category', 'modifierGroups.modifiers', 'recipes.rawMaterial'])
            ->where('is_active', true)
            ->where('is_daily_available', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'table' => $table,
                'menu' => $menu,
            ],
        ]);
    }

    /**
     * Kirim Pesanan Mandiri QR Meja (Self-Service Pelanggan)
     */
    public function placeOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'customer_name' => 'required|string|max:100',
            'payment_method' => 'required|string|in:QRIS,CASH,E_WALLET',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'items.*.modifiers' => 'nullable|array',
            'items.*.modifiers.*.modifier_id' => 'required|exists:modifiers,id',
            'items.*.modifiers.*.modifier_name' => 'required|string',
            'items.*.modifiers.*.additional_price' => 'required|numeric|min:0',
        ]);

        $table = DiningTable::where('qr_token', $validated['qr_token'])
            ->orWhere('table_number', strtoupper($validated['qr_token']))
            ->first();

        if (!$table) {
            $table = DiningTable::firstOrCreate(
                ['table_number' => strtoupper($validated['qr_token'])],
                [
                    'qr_token' => Str::uuid()->toString(),
                    'capacity' => 4,
                    'status' => 'AVAILABLE',
                ]
            );
        }

        return DB::transaction(function () use ($validated, $table) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $itemInput) {
                $product = Product::with('recipes.rawMaterial')->findOrFail($itemInput['product_id']);

                if (!$product->is_active || !$product->is_daily_available) {
                    abort(400, "Menu {$product->name} sedang tidak tersedia hari ini.");
                }

                $itemSubtotal = $product->base_price * $itemInput['qty'];
                $modSubtotal = 0;

                if (!empty($itemInput['modifiers'])) {
                    foreach ($itemInput['modifiers'] as $mod) {
                        $modSubtotal += ($mod['additional_price'] * $itemInput['qty']);
                    }
                }

                $lineTotal = $itemSubtotal + $modSubtotal;
                $subtotal += $lineTotal;

                // Calculate COGS
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

            // Calculation (PB1 Tax 10%, Service Charge 5%) — consistent with POS
            $discount = 0; // QR orders have no discount
            $taxableSubtotal = max(0, $subtotal - $discount);
            $taxAmount = round($taxableSubtotal * 0.10, 2);
            $serviceCharge = round($taxableSubtotal * 0.05, 2);
            $grandTotal = $taxableSubtotal + $taxAmount + $serviceCharge;

            $order = Order::create([
                'order_number' => 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'dining_table_id' => $table->id,
                'cashier_shift_id' => null,
                'order_source' => 'QR_TABLE',
                'order_type' => 'DINE_IN',
                'customer_name' => $validated['customer_name'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'service_charge' => $serviceCharge,
                'discount_amount' => 0,
                'grand_total' => $grandTotal,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'UNPAID', // QRIS starts UNPAID until customer scans or cashier confirms
                'order_status' => 'PENDING',
            ]);

            // Save items & modifiers + Stock Movement Out
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

                // Deduct Raw Material Stock based on Recipes
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
                        'notes' => "Sale via QR Table Order #{$order->order_number}",
                    ]);
                }
            }

            // Update Table Status
            $table->update(['status' => 'OCCUPIED']);

            // Auto-Journaling if already paid via QRIS
            if ($order->payment_status === 'PAID') {
                app(\App\Services\AccountingService::class)->recordOrderSale($order);
            }

            \App\Services\AuditService::log(
                'QR_ORDER_CREATED',
                'Order',
                $order->id,
                "Pesanan mandiri QR Meja #{$order->order_number} ({$order->customer_name}) Meja {$table->table_number} - Rp " . number_format($order->grand_total, 0, ',', '.')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan berhasil dibuat.',
                'data' => $order->load(['items.modifiers', 'diningTable']),
            ], 201);
        });
    }

    /**
     * Lacak Status Pesanan Berdasarkan Nomor Order
     */
    public function checkStatus(string $orderNumber): JsonResponse
    {
        $order = Order::with(['items.product', 'items.modifiers', 'diningTable'])
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $order,
        ]);
    }
}

