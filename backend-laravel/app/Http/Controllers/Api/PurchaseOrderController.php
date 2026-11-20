<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Services\AuditService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group(
    name: '07. Gudang (Pengadaan Bahan / PO)',
    description: 'Pengadaan bahan baku ke supplier: master supplier, pengajuan PO, approval manajer, dan penerimaan fisik barang.',
    weight: 7
)]
class PurchaseOrderController extends Controller
{
    /**
     * Daftar Seluruh Supplier Rekanan Bahan Baku
     */
    public function getSuppliers(): JsonResponse
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $suppliers,
        ]);
    }

    /**
     * Daftar Riwayat Pengajuan Purchase Order (PO)
     */
    public function getOrders(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with(['supplier', 'requester', 'approver', 'items.rawMaterial'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        $orders = $query->get();

        $stats = [
            'total' => PurchaseOrder::count(),
            'pending' => PurchaseOrder::where('status', 'PENDING_APPROVAL')->count(),
            'approved' => PurchaseOrder::where('status', 'APPROVED')->count(),
            'received' => PurchaseOrder::where('status', 'RECEIVED')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'orders' => $orders,
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Buat Pengajuan Purchase Order (PO) Baru ke Supplier
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'supplier_name' => 'nullable|string',
            'expected_delivery_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.qty_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
        ], [
            'supplier_id.required' => 'Vendor / Supplier wajib dipilih.',
            'supplier_id.exists' => 'Vendor yang dipilih tidak valid di sistem.',
            'expected_delivery_date.required' => 'Estimasi tanggal kirim wajib diisi.',
            'expected_delivery_date.date' => 'Format estimasi tanggal kirim tidak valid.',
            'expected_delivery_date.after_or_equal' => 'Estimasi tanggal kirim tidak boleh tanggal yang sudah lewat.',
            'items.required' => 'Minimal 1 bahan baku wajib dipesan dalam PO.',
            'items.min' => 'Minimal 1 bahan baku wajib dipesan dalam PO.',
            'items.*.qty_ordered.min' => 'Jumlah pesanan bahan minimal 0.01.',
        ]);

        $po = DB::transaction(function () use ($validated) {
            $supplier = null;
            if (!empty($validated['supplier_id'])) {
                $supplier = Supplier::find($validated['supplier_id']);
            }

            $dateStr = date('Ymd');
            $countToday = PurchaseOrder::whereDate('created_at', today())->count() + 1;
            $poNumber = sprintf('PO-%s-%03d', $dateStr, $countToday);

            $totalAmount = 0;
            foreach ($validated['items'] as $it) {
                $raw = RawMaterial::find($it['raw_material_id']);
                $unitCost = isset($it['unit_cost']) && $it['unit_cost'] > 0
                    ? (float) $it['unit_cost']
                    : (float) $raw->avg_cost_per_unit;
                $totalAmount += ((float) $it['qty_ordered'] * $unitCost);
            }

            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $supplier ? $supplier->id : null,
                'supplier_name' => $supplier ? $supplier->name : ($validated['supplier_name'] ?? 'Supplier Terdaftar'),
                'requested_by' => auth()->id() ?: 1,
                'status' => 'PENDING_APPROVAL',
                'total_amount' => $totalAmount,
                'order_date' => today(),
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? today()->addDays($supplier ? $supplier->lead_time_days : 2),
                'notes' => $validated['notes'] ?? 'Pengadaan bahan baku operasional',
            ]);

            foreach ($validated['items'] as $it) {
                $raw = RawMaterial::find($it['raw_material_id']);
                $unitCost = isset($it['unit_cost']) && $it['unit_cost'] > 0
                    ? (float) $it['unit_cost']
                    : (float) $raw->avg_cost_per_unit;
                $qty = (float) $it['qty_ordered'];

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'raw_material_id' => $raw->id,
                    'qty_ordered' => $qty,
                    'unit_cost' => $unitCost,
                    'subtotal' => $qty * $unitCost,
                ]);
            }

            AuditService::log(
                'PO_CREATED',
                'PurchaseOrder',
                $purchaseOrder->id,
                "Pengajuan Purchase Order {$poNumber} senilai Rp " . number_format($totalAmount, 0, ',', '.')
            );

            return $purchaseOrder;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Purchase Order {$po->po_number} berhasil dibuat dan diajukan ke Store Manager.",
            'data' => $po->load(['supplier', 'requester', 'items.rawMaterial']),
        ], 201);
    }

    /**
     * Persetujuan Purchase Order (PO) oleh Store Manager
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::findOrFail($id);

        if ($po->status !== 'PENDING_APPROVAL') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya PO berstatus PENDING_APPROVAL yang dapat disetujui.',
            ], 400);
        }

        $po->update([
            'status' => 'APPROVED',
            'approved_by' => auth()->id() ?: 1,
        ]);

        AuditService::log(
            'PO_APPROVED',
            'PurchaseOrder',
            $po->id,
            "Persetujuan Purchase Order {$po->po_number} oleh Store Manager"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Purchase Order {$po->po_number} berhasil disetujui! Admin gudang dapat mengonfirmasi penerimaan barang saat tiba.",
            'data' => $po->fresh(['supplier', 'requester', 'approver', 'items.rawMaterial']),
        ]);
    }

    /**
     * Penolakan Purchase Order (PO) oleh Store Manager
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::findOrFail($id);

        if ($po->status !== 'PENDING_APPROVAL') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya PO berstatus PENDING_APPROVAL yang dapat ditolak.',
            ], 400);
        }

        $po->update([
            'status' => 'REJECTED',
            'approved_by' => auth()->id() ?: 1,
            'notes' => $po->notes . ' [Ditolak oleh Manager: ' . ($request->input('reason', 'Tidak disetujui') . ']'),
        ]);

        AuditService::log(
            'PO_REJECTED',
            'PurchaseOrder',
            $po->id,
            "Penolakan Purchase Order {$po->po_number}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Purchase Order {$po->po_number} telah ditolak.",
            'data' => $po->fresh(['supplier', 'requester', 'approver', 'items.rawMaterial']),
        ]);
    }

    /**
     * Konfirmasi Penerimaan Fisik Barang PO di Gudang
     */
    public function receive(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::with('items.rawMaterial')->findOrFail($id);

        if ($po->status !== 'APPROVED') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya PO yang sudah disetujui (APPROVED) yang dapat dikonfirmasi penerimaan barangnya.',
            ], 400);
        }

        DB::transaction(function () use ($po) {
            $po->update([
                'status' => 'RECEIVED',
                'received_at' => now(),
            ]);

            foreach ($po->items as $item) {
                $material = $item->rawMaterial;
                $currentStock = (float) $material->current_stock;
                $incomingQty = (float) $item->qty_ordered;
                $unitCost = (float) $item->unit_cost;

                $newStock = $currentStock + $incomingQty;
                $newAvgCost = $newStock > 0
                    ? (($currentStock * (float) $material->avg_cost_per_unit) + ($incomingQty * $unitCost)) / $newStock
                    : $unitCost;

                $material->update([
                    'current_stock' => $newStock,
                    'avg_cost_per_unit' => round($newAvgCost, 4),
                ]);

                StockMovement::create([
                    'raw_material_id' => $material->id,
                    'type' => 'IN',
                    'qty' => $incomingQty,
                    'unit_cost' => $unitCost,
                    'reference_type' => PurchaseOrder::class,
                    'reference_id' => $po->id,
                    'notes' => "Penerimaan Barang PO #{$po->po_number} dari {$po->supplier_name}",
                ]);
            }

            AuditService::log(
                'PO_RECEIVED',
                'PurchaseOrder',
                $po->id,
                "Konfirmasi Penerimaan Fisik Barang PO {$po->po_number}. Stok gudang otomatis diperbarui."
            );
        });

        return response()->json([
            'status' => 'success',
            'message' => "Barang dari PO {$po->po_number} berhasil diterima! Seluruh stok bahan baku di gudang otomatis bertambah.",
            'data' => $po->fresh(['supplier', 'requester', 'approver', 'items.rawMaterial']),
        ]);
    }
}
