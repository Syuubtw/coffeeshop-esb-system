<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CashierShift;
use App\Models\Order;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Services\AccountingService;
use App\Services\AuditService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group(
    name: '09. Manajer (Audit Opname, Void & Anti-Fraud)',
    description: 'Pengawasan manajerial: audit stock opname fisik vs sistem, rekonsiliasi kas laci kasir, audit pembatalan pesanan (void), dan log aktivitas.',
    weight: 9
)]
class AuditController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Daftar Log Aktivitas & Jejak Audit Sistem
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc')->orderBy('id', 'desc');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('description', 'ilike', "%{$s}%")
                  ->orWhere('user_name', 'ilike', "%{$s}%")
                  ->orWhere('entity_type', 'ilike', "%{$s}%");
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        $logs = $query->paginate(25);

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }

    /**
     * Daftar Riwayat Pemeriksaan Stock Opname Gudang
     */
    public function getStockOpnames(Request $request): JsonResponse
    {
        $opnames = StockOpname::with(['auditor', 'approver', 'items.rawMaterial'])
            ->orderBy('opname_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $opnames,
        ]);
    }

    /**
     * Input Hasil Audit Stock Opname (Fisik vs Sistem)
     */
    public function storeStockOpname(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'opname_date' => 'required|date',
            'notes' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.physical_stock' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string|max:255',
        ]);

        $opname = DB::transaction(function () use ($validated) {
            $opnameNumber = 'SO-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

            $totalVarianceQty = 0;
            $totalVarianceCost = 0;

            $opname = StockOpname::create([
                'opname_number' => $opnameNumber,
                'opname_date' => $validated['opname_date'],
                'audited_by' => auth()->id() ?: 1,
                'status' => 'PENDING_APPROVAL',
                'notes' => $validated['notes'] ?? 'Pemeriksaan Stok Berkala',
            ]);

            foreach ($validated['items'] as $it) {
                $raw = RawMaterial::findOrFail($it['raw_material_id']);
                $systemStock = (float) $raw->current_stock;
                $physicalStock = (float) $it['physical_stock'];
                $varianceQty = $physicalStock - $systemStock;
                $unitCost = (float) $raw->avg_cost_per_unit;
                $varianceCost = round($varianceQty * $unitCost, 2);

                $totalVarianceQty += $varianceQty;
                $totalVarianceCost += $varianceCost;

                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'raw_material_id' => $raw->id,
                    'system_stock' => $systemStock,
                    'physical_stock' => $physicalStock,
                    'variance_qty' => $varianceQty,
                    'unit_cost' => $unitCost,
                    'variance_cost' => $varianceCost,
                    'reason' => $it['reason'] ?? ($varianceQty < 0 ? 'Selisih Timbangan / Kebocoran' : 'Stok Fisik Pas'),
                ]);
            }

            $opname->update([
                'total_variance_qty' => $totalVarianceQty,
                'total_variance_cost' => $totalVarianceCost,
            ]);

            AuditService::log(
                'OPNAME_SUBMITTED',
                'StockOpname',
                $opname->id,
                "Pengajuan Audit Stock Opname {$opnameNumber} (Total Selisih Rp {$totalVarianceCost})"
            );

            return $opname;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Stock Opname {$opname->opname_number} berhasil direkam dan menunggu persetujuan.",
            'data' => $opname->load('items.rawMaterial'),
        ]);
    }

    /**
     * Persetujuan Stock Opname & Penyesuaian Saldo Bahan Baku
     */
    public function approveStockOpname(Request $request, int $id): JsonResponse
    {
        $opname = StockOpname::with('items.rawMaterial')->findOrFail($id);

        if ($opname->status === 'APPROVED') {
            return response()->json(['status' => 'error', 'message' => 'Stock opname sudah disetujui sebelumnya.'], 400);
        }

        DB::transaction(function () use ($opname) {
            $opname->update([
                'status' => 'APPROVED',
                'approved_by' => auth()->id() ?: 1,
            ]);

            // Adjust inventory stock and log movement
            foreach ($opname->items as $item) {
                $material = $item->rawMaterial;
                $diff = (float) $item->variance_qty;

                if (abs($diff) > 0.001) {
                    $material->update(['current_stock' => $item->physical_stock]);

                    StockMovement::create([
                        'raw_material_id' => $material->id,
                        'type' => $diff < 0 ? 'OUT_ADJUSTMENT' : 'IN_ADJUSTMENT',
                        'qty' => abs($diff),
                        'unit_cost' => $item->unit_cost,
                        'reference_type' => StockOpname::class,
                        'reference_id' => $opname->id,
                        'notes' => "Penyesuaian Pemeriksaan Stok #{$opname->opname_number} ({$item->reason})",
                    ]);
                }
            }

            // Auto-Journaling Variance Adjustment
            $this->accountingService->recordStockOpnameVariance($opname);

            AuditService::log(
                'OPNAME_APPROVED',
                'StockOpname',
                $opname->id,
                "Persetujuan Stock Opname {$opname->opname_number} & Penyesuaian Saldo Bahan Baku"
            );
        });

        return response()->json([
            'status' => 'success',
            'message' => "Stock Opname {$opname->opname_number} berhasil disetujui dan stok gudang telah diperbarui.",
            'data' => $opname->fresh(['items.rawMaterial', 'approver']),
        ]);
    }

    /**
     * Audit Rekonsiliasi Kas Fisik Laci Kasir per Shift
     */
    public function getCashDrawerReconciliation(Request $request): JsonResponse
    {
        $shifts = CashierShift::with(['cashier', 'orders'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($s) {
                $cashOrdersTotal = $s->orders
                    ->where('payment_method', 'CASH')
                    ->where('payment_status', 'PAID')
                    ->sum('grand_total');

                $expectedEndingCash = (float) $s->start_cash + (float) $cashOrdersTotal;
                $actualEndingCash = $s->end_cash !== null ? (float) $s->end_cash : null;
                $difference = $actualEndingCash !== null ? ($actualEndingCash - $expectedEndingCash) : 0;

                return [
                    'id' => $s->id,
                    'cashier_name' => $s->cashier->name ?? 'Kasir Frontline',
                    'opened_at' => $s->opened_at,
                    'closed_at' => $s->closed_at,
                    'status' => $s->status,
                    'start_cash' => (float) $s->start_cash,
                    'cash_sales_total' => (float) $cashOrdersTotal,
                    'expected_ending_cash' => $expectedEndingCash,
                    'actual_ending_cash' => $actualEndingCash,
                    'difference' => $difference,
                    'difference_status' => $difference === 0.0 ? 'BALANCED' : ($difference > 0 ? 'OVER' : 'SHORT'),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $shifts,
        ]);
    }

    /**
     * Audit Anti-Fraud: Pembatalan Pesanan (Void) & Diskon
     */
    public function getVoidAudit(Request $request): JsonResponse
    {
        $voidOrders = Order::with(['items.product', 'diningTable'])
            ->whereIn('order_status', ['CANCELLED', 'VOID'])
            ->orWhere(function ($q) {
                $q->where('discount_amount', '>', 0);
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $voidOrders,
        ]);
    }
}
