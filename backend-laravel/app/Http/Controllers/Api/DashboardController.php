<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RawMaterial;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group(
    name: '12. Owner (Statistik Omset & Metrik)',
    description: 'Business Intelligence & dashboard eksekutif: omset kotor/bersih, HPP aktual, total pesanan, AOV, dan grafik performa bulanan.',
    weight: 12
)]
class DashboardController extends Controller
{
    /**
     * Statistik Ringkasan Eksekutif & Business Intelligence
     */
    public function stats(Request $request): JsonResponse
    {
        $today = Carbon::today();
        
        $selectedYear = (int) $request->input('year', Carbon::now()->year);
        $selectedMonth = (int) $request->input('month', Carbon::now()->month);
        $monthStart = Carbon::createFromDate($selectedYear, $selectedMonth, 1)->startOfMonth();
        $monthEnd = Carbon::createFromDate($selectedYear, $selectedMonth, 1)->endOfMonth();

        // 1. Today's Performance & AOV
        $todayOrders = Order::whereDate('created_at', $today)->where('payment_status', 'PAID')->get();
        $todayGrossSales = (float) $todayOrders->sum('grand_total');
        $todayOrderCount = $todayOrders->count();
        $todayAov = $todayOrderCount > 0 ? round($todayGrossSales / $todayOrderCount) : 0;

        // 2. Selected Month Performance & AOV
        $monthOrders = Order::whereBetween('created_at', [$monthStart, $monthEnd])->where('payment_status', 'PAID')->get();
        $monthGrossSales = (float) $monthOrders->sum('grand_total');
        $monthOrderCount = $monthOrders->count();
        $monthAov = $monthOrderCount > 0 ? round($monthGrossSales / $monthOrderCount) : 0;

        // Total Items / Cups Sold
        $totalCupsSold = (int) OrderItem::whereHas('order', function ($q) use ($monthStart, $monthEnd) {
            $q->whereBetween('created_at', [$monthStart, $monthEnd])->where('payment_status', 'PAID');
        })->sum('qty');

        // COGS estimation for the month
        $monthCogs = (float) OrderItem::whereHas('order', function ($q) use ($monthStart, $monthEnd) {
            $q->whereBetween('created_at', [$monthStart, $monthEnd])->where('payment_status', 'PAID');
        })->sum(DB::raw('qty * unit_cogs'));

        $monthEstimatedGrossProfit = $monthGrossSales - $monthCogs;

        // 3. Top 5 Best Selling Items (with Margin & Cash Cow Profit)
        $topProductsRaw = OrderItem::select(
                'product_id',
                DB::raw('SUM(qty) as total_qty'),
                DB::raw('SUM(subtotal) as total_revenue'),
                DB::raw('SUM(qty * unit_cogs) as total_cogs')
            )
            ->whereHas('order', function ($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('created_at', [$monthStart, $monthEnd])->where('payment_status', 'PAID');
            })
            ->with('product:id,name,sku,base_price')
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $topProducts = $topProductsRaw->map(function ($item) {
            $revenue = (float) $item->total_revenue;
            $cogs = (float) $item->total_cogs;
            $profit = $revenue - $cogs;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 1) : 0;

            return [
                'product_id' => $item->product_id,
                'name' => $item->product->name ?? 'Menu',
                'sku' => $item->product->sku ?? '-',
                'base_price' => (float) ($item->product->base_price ?? 0),
                'total_qty' => (int) $item->total_qty,
                'total_revenue' => $revenue,
                'total_cogs' => $cogs,
                'gross_profit' => $profit,
                'margin_percent' => $margin,
            ];
        });

        // 4. Peak Hours Analysis (Hourly Bracket from Month Orders)
        $hourCounts = [];
        for ($h = 7; $h <= 22; $h++) {
            $hourCounts[$h] = ['hour' => $h, 'order_count' => 0, 'sales' => 0];
        }

        foreach ($monthOrders as $ord) {
            $orderHour = Carbon::parse($ord->created_at)->hour;
            if (isset($hourCounts[$orderHour])) {
                $hourCounts[$orderHour]['order_count']++;
                $hourCounts[$orderHour]['sales'] += (float) $ord->grand_total;
            }
        }

        $maxHourOrders = !empty($hourCounts) ? max(array_column($hourCounts, 'order_count')) : 1;
        $peakHours = array_values(array_map(function ($slot) use ($maxHourOrders) {
            $h = $slot['hour'];
            $label = sprintf('%02d:00 - %02d:00', $h, $h + 1);
            $intensity = $maxHourOrders > 0 ? round(($slot['order_count'] / $maxHourOrders) * 100) : 0;
            return [
                'hour' => $h,
                'label' => $label,
                'order_count' => $slot['order_count'],
                'sales' => $slot['sales'],
                'intensity_percent' => $intensity,
                'is_peak' => $intensity >= 70,
            ];
        }, $hourCounts));

        // 5. Distribusi Metode Pembayaran (Hanya QRIS & Uang Tunai) & Cara Pemesanan
        $paymentDistribution = [
            'QRIS' => ['label' => 'Pembayaran QRIS', 'count' => 0, 'amount' => 0, 'percent' => 0],
            'CASH' => ['label' => 'Uang Tunai (Cash)', 'count' => 0, 'amount' => 0, 'percent' => 0],
        ];

        $channelDistribution = [
            'POS' => ['label' => 'Kasir Outlet Langsung', 'count' => 0, 'amount' => 0, 'percent' => 0],
            'QR_TABLE' => ['label' => 'Pesan Mandiri Scan QR Meja', 'count' => 0, 'amount' => 0, 'percent' => 0],
        ];

        $orderTypeDistribution = [
            'DINE_IN' => ['label' => 'Minum di Tempat (Nongkrong)', 'count' => 0, 'amount' => 0, 'percent' => 0],
            'TAKEAWAY' => ['label' => 'Bungkus Bawa Pulang', 'count' => 0, 'amount' => 0, 'percent' => 0],
        ];

        foreach ($monthOrders as $ord) {
            $m = strtoupper($ord->payment_method ?? 'CASH');
            if ($m !== 'QRIS') {
                $m = 'CASH';
            }
            $paymentDistribution[$m]['count']++;
            $paymentDistribution[$m]['amount'] += (float) $ord->grand_total;

            $s = strtoupper($ord->order_source ?? 'POS');
            if (isset($channelDistribution[$s])) {
                $channelDistribution[$s]['count']++;
                $channelDistribution[$s]['amount'] += (float) $ord->grand_total;
            }

            $t = strtoupper($ord->order_type ?? 'DINE_IN');
            if (isset($orderTypeDistribution[$t])) {
                $orderTypeDistribution[$t]['count']++;
                $orderTypeDistribution[$t]['amount'] += (float) $ord->grand_total;
            }
        }

        if ($monthGrossSales > 0) {
            foreach ($paymentDistribution as $k => $v) {
                $paymentDistribution[$k]['percent'] = round(($v['amount'] / $monthGrossSales) * 100, 1);
            }
            foreach ($channelDistribution as $k => $v) {
                $channelDistribution[$k]['percent'] = round(($v['amount'] / $monthGrossSales) * 100, 1);
            }
            foreach ($orderTypeDistribution as $k => $v) {
                $orderTypeDistribution[$k]['percent'] = round(($v['amount'] / $monthGrossSales) * 100, 1);
            }
        }

        // 6. 7-Day Weekly Sales Trend (Senin - Minggu)
        $dayNames = [
            1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis',
            5 => 'Jumat', 6 => 'Sabtu', 0 => 'Minggu', 7 => 'Minggu'
        ];

        $weeklyTrend = [];
        $baseDate = ($selectedYear === Carbon::now()->year && $selectedMonth === Carbon::now()->month) 
            ? Carbon::today() 
            : (clone $monthEnd);

        for ($i = 6; $i >= 0; $i--) {
            $d = (clone $baseDate)->subDays($i);
            $dateStr = $d->toDateString();
            $dayOfWeek = (int) $d->dayOfWeekIso;

            $daysOrders = $monthOrders->filter(function ($ord) use ($dateStr) {
                return Carbon::parse($ord->created_at)->toDateString() === $dateStr;
            });

            $sales = (float) $daysOrders->sum('grand_total');
            $count = $daysOrders->count();

            $weeklyTrend[] = [
                'date' => $dateStr,
                'date_formatted' => $d->translatedFormat('d M'),
                'day_name' => $dayNames[$dayOfWeek] ?? $d->format('D'),
                'sales' => $sales,
                'order_count' => $count,
                'is_weekend' => in_array($dayOfWeek, [6, 7]),
            ];
        }

        // Low Stock Count
        $lowStockMaterials = RawMaterial::whereRaw('current_stock <= min_stock_alert')->get();

        // Table Status Count
        $tables = DiningTable::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'selected_period' => [
                    'year' => $selectedYear,
                    'month' => $selectedMonth,
                    'label' => $monthStart->translatedFormat('F Y'),
                ],
                'today' => [
                    'gross_sales' => $todayGrossSales,
                    'order_count' => $todayOrderCount,
                    'aov' => $todayAov,
                ],
                'month_to_date' => [
                    'gross_sales' => $monthGrossSales,
                    'order_count' => $monthOrderCount,
                    'aov' => $monthAov,
                    'total_cups_sold' => $totalCupsSold,
                    'estimated_cogs' => $monthCogs,
                    'estimated_gross_profit' => $monthEstimatedGrossProfit,
                ],
                'top_products' => $topProducts,
                'peak_hours' => $peakHours,
                'distribution' => [
                    'payments' => $paymentDistribution,
                    'channels' => $channelDistribution,
                    'types' => $orderTypeDistribution,
                    'payments_list' => array_values($paymentDistribution),
                    'channels_list' => array_values($channelDistribution),
                    'types_list' => array_values($orderTypeDistribution),
                ],
                'weekly_trend' => $weeklyTrend,
                'low_stock_alerts' => $lowStockMaterials,
                'tables_summary' => $tables,
            ],
        ]);
    }
}


