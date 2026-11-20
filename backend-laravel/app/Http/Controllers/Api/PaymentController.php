<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;

#[Group(
    name: '03. Pembayaran & Gateway (Midtrans)',
    description: 'Integrasi payment gateway Midtrans Snap token, webhook callback, dan simulator pembayaran sukses.',
    weight: 3
)]
class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = (bool) config('services.midtrans.is_production', false);
        Config::$isSanitized = (bool) config('services.midtrans.is_sanitized', true);
        Config::$is3ds = (bool) config('services.midtrans.is_3ds', true);
    }

    /**
     * Buat Token Midtrans Snap untuk Pesanan Meja
     */
    public function createSnapToken(Request $request, int $orderId): JsonResponse
    {
        $order = Order::with(['items.product', 'diningTable'])->findOrFail($orderId);

        $serverKey = config('services.midtrans.server_key');

        // Check if server key is default placeholder or real Midtrans Sandbox key
        $isDemoKey = empty($serverKey) || str_contains($serverKey, 'DEMO_SANDBOX_KEY');

        if ($isDemoKey) {
            // Instant Mock Sandbox Token for local learning without needing real Midtrans registration
            return response()->json([
                'status' => 'success',
                'mode' => 'sandbox_simulator',
                'message' => 'Token simulator Midtrans Sandbox berhasil dibuat (100% Gratis Tanpa Bayar).',
                'data' => [
                    'snap_token' => 'mock-snap-' . md5($order->order_number . time()),
                    'redirect_url' => 'https://simulator.sandbox.midtrans.com/qris/index',
                    'order' => $order,
                    'client_key' => config('services.midtrans.client_key'),
                ],
            ]);
        }

        try {
            $itemDetails = [];
            foreach ($order->items as $item) {
                $itemDetails[] = [
                    'id' => (string) $item->product_id,
                    'price' => (int) round($item->unit_price),
                    'quantity' => (int) $item->qty,
                    'name' => substr($item->product->name ?? 'Menu', 0, 50),
                ];
            }

            // Tax & Service items
            if ($order->tax_amount > 0) {
                $itemDetails[] = [
                    'id' => 'TAX-PB1',
                    'price' => (int) round($order->tax_amount),
                    'quantity' => 1,
                    'name' => 'PB1 Resto (10%)',
                ];
            }

            if ($order->service_charge > 0) {
                $itemDetails[] = [
                    'id' => 'SERVICE-CHARGE',
                    'price' => (int) round($order->service_charge),
                    'quantity' => 1,
                    'name' => 'Service Charge (5%)',
                ];
            }

            $params = [
                'transaction_details' => [
                    'order_id' => $order->order_number,
                    'gross_amount' => (int) round($order->grand_total),
                ],
                'customer_details' => [
                    'first_name' => $order->customer_name ?? 'Pelanggan',
                    'email' => 'customer@coffeeshop.test',
                ],
                'item_details' => $itemDetails,
                'callbacks' => [
                    'finish' => url('/order/status/' . $order->order_number),
                ],
            ];

            $snapToken = Snap::getSnapToken($params);

            return response()->json([
                'status' => 'success',
                'mode' => 'midtrans_sandbox_live',
                'message' => 'Snap Token Midtrans Sandbox resmi berhasil didapat.',
                'data' => [
                    'snap_token' => $snapToken,
                    'order' => $order,
                    'client_key' => config('services.midtrans.client_key'),
                ],
            ]);
        } catch (\Throwable $e) {
            // Graceful fallback to simulator if network or key issue
            Log::warning('Midtrans Snap Error: ' . $e->getMessage());

            return response()->json([
                'status' => 'success',
                'mode' => 'sandbox_simulator',
                'message' => 'Menggunakan simulator Midtrans gratis: ' . $e->getMessage(),
                'data' => [
                    'snap_token' => 'mock-snap-' . md5($order->order_number),
                    'order' => $order,
                    'client_key' => config('services.midtrans.client_key'),
                ],
            ]);
        }
    }

    /**
     * Handler Webhook Callback Notifikasi Pembayaran Midtrans
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Midtrans Webhook Received:', $payload);

        $orderNumber = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;

        if (!$orderNumber) {
            return response()->json(['status' => 'error', 'message' => 'Missing order_id'], 400);
        }

        $order = Order::where('order_number', $orderNumber)->first();
        if (!$order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        DB::transaction(function () use ($order, $transactionStatus, $fraudStatus) {
            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $order->update(['payment_status' => 'PAID', 'order_status' => 'CONFIRMED']);
                }
            } elseif ($transactionStatus === 'settlement') {
                $order->update(['payment_status' => 'PAID', 'order_status' => 'CONFIRMED']);
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                $order->update(['payment_status' => 'FAILED', 'order_status' => 'CANCELLED']);

                // Restore Raw Material Stock if cancelled
                $order->load('items.product.recipes');
                foreach ($order->items as $it) {
                    if ($it->product && $it->product->recipes) {
                        foreach ($it->product->recipes as $rcp) {
                            $qtyRestore = $rcp->qty_needed * $it->qty;
                            RawMaterial::where('id', $rcp->raw_material_id)->increment('current_stock', $qtyRestore);

                            StockMovement::create([
                                'raw_material_id' => $rcp->raw_material_id,
                                'type' => 'IN_ADJUSTMENT',
                                'qty' => $qtyRestore,
                                'unit_cost' => 0,
                                'reference_type' => Order::class,
                                'reference_id' => $order->id,
                                'notes' => "Restored stock from cancelled Midtrans order #{$order->order_number}",
                            ]);
                        }
                    }
                }
            } elseif ($transactionStatus === 'pending') {
                $order->update(['payment_status' => 'UNPAID']);
            }
        });

        return response()->json(['status' => 'success', 'message' => 'Webhook processed']);
    }

    /**
     * Simulasi Pembayaran Sukses Sandbox Midtrans (Lunas Otomatis)
     */
    public function simulatePaymentSuccess(Request $request, int $orderId): JsonResponse
    {
        $order = Order::with(['items.product', 'diningTable'])->findOrFail($orderId);

        $order->update([
            'payment_status' => 'PAID',
            'order_status' => 'CONFIRMED',
            'payment_method' => 'MIDTRANS_QRIS',
        ]);

        // Auto-Journaling for Midtrans Payment
        app(\App\Services\AccountingService::class)->recordOrderSale($order);

        \App\Services\AuditService::log(
            'MIDTRANS_PAID',
            'Order',
            $order->id,
            "Pembayaran Midtrans QRIS berhasil lunas untuk order #{$order->order_number} (Rp {$order->grand_total})"
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Simulasi pembayaran Midtrans Sandbox BERHASIL (Lunas).',
            'data' => $order,
        ]);
    }
}

