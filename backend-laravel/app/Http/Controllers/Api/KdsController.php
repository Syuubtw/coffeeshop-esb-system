<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group(
    name: '05. Barista (KDS Kitchen Display System)',
    description: 'Sistem antrean layar dapur/barista realtime (Auto-FIFO), update status racik/saji, dan ketersediaan menu harian.',
    weight: 5
)]
class KdsController extends Controller
{
    /**
     * Daftar Antrean Pesanan Dapur Barista (Auto-FIFO Hari Ini)
     * Pesanan dari hari sebelumnya yang belum terselesaikan akan otomatis ditandai selesai (Auto-Clear).
     */
    public function queue(): JsonResponse
    {
        $today = Carbon::today();

        // 1. Auto-complete uncompleted orders from previous days so today's kitchen starts fresh
        $staleOrders = Order::whereDate('created_at', '<', $today)
            ->whereIn('order_status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'])
            ->get();

        foreach ($staleOrders as $stale) {
            $stale->update(['order_status' => 'COMPLETED']);
            if ($stale->dining_table_id) {
                DiningTable::where('id', $stale->dining_table_id)->update(['status' => 'AVAILABLE']);
            }
        }

        // 2. Fetch today's active orders
        $orders = Order::with(['items.product', 'items.modifiers', 'diningTable'])
            ->whereDate('created_at', '>=', $today)
            ->whereIn('order_status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    /**
     * Perbarui Status Racik Pesanan (Mulai Racik / Siap Saji)
     */
    public function updateStatus(Request $request, int $orderId): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => 'required|string|in:CONFIRMED,PREPARING,READY,SERVED,COMPLETED,CANCELLED',
        ]);

        $order = Order::findOrFail($orderId);
        $order->update(['order_status' => $validated['order_status']]);

        // Release dining table when order completed or cancelled
        if (in_array($validated['order_status'], ['COMPLETED', 'CANCELLED']) && $order->dining_table_id) {
            DiningTable::where('id', $order->dining_table_id)->update(['status' => 'AVAILABLE']);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Status pesanan diubah menjadi {$validated['order_status']}",
            'data' => $order,
        ]);
    }

    /**
     * Toggle Status Menu Habis Darurat Barista (Sold-Out / 86)
     */
    public function toggleProductDaily(Request $request, int $productId): JsonResponse
    {
        $validated = $request->validate([
            'is_daily_available' => 'required|boolean',
        ]);

        $product = Product::findOrFail($productId);
        $product->update(['is_daily_available' => $validated['is_daily_available']]);

        return response()->json([
            'status' => 'success',
            'message' => "Menu {$product->name} status ketersediaan diubah.",
            'data' => $product,
        ]);
    }
}

