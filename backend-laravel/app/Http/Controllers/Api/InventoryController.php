<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use App\Models\WasteLog;
use App\Services\AuditService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group(
    name: '06. Gudang (Stok Bahan & Kartu Stok)',
    description: 'Manajemen persediaan bahan baku: stok masuk manual, penyesuaian selisih, barang rusak/waste, dan kartu stok FIFO.',
    weight: 6
)]
class InventoryController extends Controller
{
    /**
     * Daftar Stok Bahan Baku & Peringatan Stok Menipis
     */
    public function index(): JsonResponse
    {
        $materials = RawMaterial::orderBy('name')->get()->map(function ($item) {
            $item->is_low_stock = $item->current_stock <= $item->min_stock_alert;
            return $item;
        });

        return response()->json([
            'status' => 'success',
            'data' => $materials,
        ]);
    }

    /**
     * Tambah Bahan Baku Baru ke Database (Mendukung Satuan kg, liter, gram, ml, pcs & Normalisasi Resep)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:raw_materials,name',
            'unit' => 'required|string|in:gram,ml,pcs,kg,liter',
            'min_stock_alert' => 'required|numeric|min:0',
            'current_stock' => 'nullable|numeric|min:0',
            'avg_cost_per_unit' => 'required|numeric|min:0',
            'sku' => 'nullable|string|max:50|unique:raw_materials,sku',
        ]);

        $rawUnit = strtolower($validated['unit']);
        $initialStock = (float) ($validated['current_stock'] ?? 0);
        $minStock = (float) $validated['min_stock_alert'];
        $cost = (float) $validated['avg_cost_per_unit'];

        // Normalisasi otomatis jika input dalam kg atau liter
        if ($rawUnit === 'kg') {
            $baseUnit = 'gram';
            $initialStock = $initialStock * 1000;
            $minStock = $minStock * 1000;
            $cost = $cost / 1000;
        } elseif ($rawUnit === 'liter') {
            $baseUnit = 'ml';
            $initialStock = $initialStock * 1000;
            $minStock = $minStock * 1000;
            $cost = $cost / 1000;
        } else {
            $baseUnit = $rawUnit;
        }

        $sku = $validated['sku'] ?? null;
        if (!$sku) {
            $prefix = match($baseUnit) {
                'ml' => 'RM-LIQ',
                'pcs' => 'RM-PKG',
                default => 'RM-ING',
            };
            $count = RawMaterial::count() + 1;
            $sku = sprintf('%s-%03d', $prefix, $count);
            while (RawMaterial::where('sku', $sku)->exists()) {
                $count++;
                $sku = sprintf('%s-%03d', $prefix, $count);
            }
        }

        $material = DB::transaction(function () use ($validated, $sku, $baseUnit, $initialStock, $minStock, $cost) {
            $rm = RawMaterial::create([
                'name' => $validated['name'],
                'sku' => $sku,
                'unit' => $baseUnit,
                'current_stock' => $initialStock,
                'min_stock_alert' => $minStock,
                'avg_cost_per_unit' => $cost,
            ]);

            if ($initialStock > 0) {
                StockMovement::create([
                    'raw_material_id' => $rm->id,
                    'type' => 'IN_PURCHASE',
                    'qty' => $initialStock,
                    'unit_cost' => $cost,
                    'notes' => 'Pendaftaran bahan baku baru (Stok awal)',
                ]);
            }

            AuditService::log(
                'RAW_MATERIAL_CREATED',
                'RawMaterial',
                $rm->id,
                "Bahan baku baru '{$rm->name}' ({$rm->sku}) berhasil ditambahkan dengan stok awal {$initialStock} {$rm->unit}."
            );

            return $rm;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Bahan baku '{$material->name}' berhasil didaftarkan ke gudang.",
            'data' => $material,
        ], 201);
    }

    /**
     * Perbarui Data Bahan Baku (Nama, Batas Minimum, Harga Rata-rata)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $material = RawMaterial::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:raw_materials,name,' . $material->id,
            'min_stock_alert' => 'required|numeric|min:0',
            'avg_cost_per_unit' => 'required|numeric|min:0',
        ]);

        $material->update([
            'name' => $validated['name'],
            'min_stock_alert' => $validated['min_stock_alert'],
            'avg_cost_per_unit' => $validated['avg_cost_per_unit'],
        ]);

        AuditService::log(
            'RAW_MATERIAL_UPDATED',
            'RawMaterial',
            $material->id,
            "Bahan baku '{$material->name}' ({$material->sku}) berhasil diperbarui: Min {$material->min_stock_alert}, Biaya Rp {$material->avg_cost_per_unit}."
        );

        return response()->json([
            'status' => 'success',
            'message' => "Bahan baku '{$material->name}' berhasil diperbarui.",
            'data' => $material,
        ]);
    }

    /**
     * Catat Stok Masuk Pembelian Bahan Baku (Inbound)
     */
    public function stockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'qty' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $material = RawMaterial::findOrFail($validated['raw_material_id']);

            // Calculate new moving average cost
            $currentTotalVal = $material->current_stock * $material->avg_cost_per_unit;
            $newIncomingVal = $validated['qty'] * $validated['unit_cost'];
            $newTotalQty = $material->current_stock + $validated['qty'];
            $newAvgCost = $newTotalQty > 0 ? ($currentTotalVal + $newIncomingVal) / $newTotalQty : $validated['unit_cost'];

            $material->current_stock += $validated['qty'];
            $material->avg_cost_per_unit = round($newAvgCost, 4);
            $material->save();

            $movement = StockMovement::create([
                'raw_material_id' => $material->id,
                'type' => 'IN_PURCHASE',
                'qty' => $validated['qty'],
                'unit_cost' => $validated['unit_cost'],
                'notes' => $validated['notes'] ?? 'Restock / Purchase',
            ]);

            $totalInboundCost = $validated['qty'] * $validated['unit_cost'];

            // Auto-Journaling for Stock Purchase
            app(\App\Services\AccountingService::class)->recordStockIn(
                $material,
                $validated['qty'],
                $totalInboundCost,
                'CASH'
            );

            \App\Services\AuditService::log(
                'STOCK_IN',
                'RawMaterial',
                $material->id,
                "Inbound stok pembelian {$material->name}: {$validated['qty']} {$material->unit} (Total Rp " . number_format($totalInboundCost, 0, ',', '.') . ")"
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Stok bahan baku berhasil ditambahkan.',
                'data' => [
                    'material' => $material,
                    'movement' => $movement,
                ],
            ], 201);
        });
    }

    /**
     * Penyesuaian Selisih Stok Manual (Adjustment)
     */
    public function stockAdjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'actual_stock' => 'required|numeric|min:0',
            'notes' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $material = RawMaterial::findOrFail($validated['raw_material_id']);
            $diffQty = $validated['actual_stock'] - $material->current_stock;

            $material->update(['current_stock' => $validated['actual_stock']]);

            $movement = StockMovement::create([
                'raw_material_id' => $material->id,
                'type' => 'ADJUSTMENT',
                'qty' => $diffQty,
                'unit_cost' => $material->avg_cost_per_unit,
                'notes' => $validated['notes'],
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Penyesuaian stok opname berhasil.',
                'data' => [
                    'material' => $material,
                    'movement' => $movement,
                ],
            ]);
        });
    }

    /**
     * Laporkan Bahan Rusak / Basi / Tumpah (Waste)
     */
    public function reportWaste(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'qty' => 'required|numeric|min:0.01',
            'reason' => 'required|string',
        ]);

        $waste = WasteLog::create([
            'raw_material_id' => $validated['raw_material_id'],
            'qty' => $validated['qty'],
            'reason' => $validated['reason'],
            'status' => 'PENDING',
            'reported_by' => $request->user()->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan waste berhasil diajukan, menunggu persetujuan manager.',
            'data' => $waste,
        ], 201);
    }

    /**
     * Persetujuan atau Penolakan Laporan Waste oleh Manajer
     */
    public function approveWaste(Request $request, int $wasteId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED',
        ]);

        $waste = WasteLog::findOrFail($wasteId);

        if ($waste->status !== 'PENDING') {
            return response()->json([
                'status' => 'error',
                'message' => 'Waste log sudah pernah diproses.',
            ], 400);
        }

        return DB::transaction(function () use ($waste, $validated, $request) {
            $waste->update([
                'status' => $validated['status'],
                'approved_by' => $request->user()->id,
            ]);

            if ($validated['status'] === 'APPROVED') {
                $material = RawMaterial::findOrFail($waste->raw_material_id);
                $material->decrement('current_stock', $waste->qty);

                StockMovement::create([
                    'raw_material_id' => $material->id,
                    'type' => 'OUT_WASTE',
                    'qty' => $waste->qty,
                    'unit_cost' => $material->avg_cost_per_unit,
                    'reference_type' => WasteLog::class,
                    'reference_id' => $waste->id,
                    'notes' => "Approved waste: {$waste->reason}",
                ]);

                $wasteCost = $waste->qty * $material->avg_cost_per_unit;

                // Auto-Journaling for Approved Waste
                app(\App\Services\AccountingService::class)->recordWaste($waste, $wasteCost);

                \App\Services\AuditService::log(
                    'WASTE_APPROVED',
                    'WasteLog',
                    $waste->id,
                    "Approval pembuangan bahan #{$waste->id}: {$waste->qty} {$material->unit} {$material->name} ({$waste->reason}) - Kerugian Rp " . number_format($wasteCost, 0, ',', '.')
                );
            }

            return response()->json([
                'status' => 'success',
                'message' => "Laporan waste telah di-{$validated['status']}.",
                'data' => $waste,
            ]);
        });
    }

    /**
     * Riwayat Mutasi Aliran Stok Bahan Baku (FIFO Log)
     */
    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::with('rawMaterial')->latest();

        if ($request->has('raw_material_id')) {
            $query->where('raw_material_id', $request->raw_material_id);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(20),
        ]);
    }

    /**
     * Kartu Stok Detail per Bahan Baku (Riwayat Masuk, Pakai & Sisa)
     */
    public function stockCard(int $materialId): JsonResponse
    {
        $material = RawMaterial::findOrFail($materialId);
        $movements = StockMovement::where('raw_material_id', $materialId)
            ->orderBy('created_at', 'asc')
            ->get();

        $totalIn = (float) $movements->whereIn('type', ['IN', 'IN_PURCHASE', 'IN_ADJUSTMENT'])
            ->sum('qty') + (float) $movements->where('type', 'ADJUSTMENT')->where('qty', '>', 0)->sum('qty');
        $totalOutSale = (float) $movements->whereIn('type', ['OUT_SALE', 'OUT'])->sum('qty');
        $totalOutWaste = (float) $movements->whereIn('type', ['OUT_WASTE', 'OUT_ADJUSTMENT'])->sum('qty');
        $totalAdjDown = abs((float) $movements->where('type', 'ADJUSTMENT')
            ->where('qty', '<', 0)->sum('qty'));

        $totalUsed = $totalOutSale + $totalOutWaste + $totalAdjDown;

        // Build running balance timeline
        $timeline = [];
        $runningBalance = 0;
        foreach ($movements as $mov) {
            if (in_array($mov->type, ['IN', 'IN_PURCHASE', 'IN_ADJUSTMENT'])) {
                $runningBalance += $mov->qty;
            } elseif (in_array($mov->type, ['OUT_SALE', 'OUT', 'OUT_WASTE', 'OUT_ADJUSTMENT'])) {
                $runningBalance -= $mov->qty;
            } elseif ($mov->type === 'ADJUSTMENT') {
                $runningBalance += $mov->qty; // can be negative
            }

            $timeline[] = [
                'id' => $mov->id,
                'date' => $mov->created_at->format('Y-m-d H:i'),
                'type' => $mov->type,
                'type_label' => match($mov->type) {
                    'IN', 'IN_PURCHASE' => 'Pembelian Masuk (PO)',
                    'IN_ADJUSTMENT' => 'Selisih Lebih Fisik (Opname)',
                    'OUT_SALE', 'OUT' => 'Terpakai (Penjualan Kasir)',
                    'OUT_WASTE' => 'Waste / Terbuang',
                    'OUT_ADJUSTMENT' => 'Tumpah / Selisih Opname',
                    'ADJUSTMENT' => 'Penyesuaian Stok',
                    default => $mov->type,
                },
                'qty_in' => in_array($mov->type, ['IN', 'IN_PURCHASE', 'IN_ADJUSTMENT']) || ($mov->type === 'ADJUSTMENT' && $mov->qty > 0) ? $mov->qty : 0,
                'qty_out' => in_array($mov->type, ['OUT_SALE', 'OUT', 'OUT_WASTE', 'OUT_ADJUSTMENT']) || ($mov->type === 'ADJUSTMENT' && $mov->qty < 0) ? abs($mov->qty) : 0,
                'running_balance' => $runningBalance,
                'unit_cost' => $mov->unit_cost,
                'notes' => $mov->notes,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'material' => $material,
                'summary' => [
                    'total_in' => $totalIn,
                    'total_used_sale' => $totalOutSale,
                    'total_used_waste' => $totalOutWaste,
                    'total_adjustment_down' => $totalAdjDown,
                    'total_used' => $totalUsed,
                    'current_stock' => $material->current_stock,
                ],
                'timeline' => $timeline,
            ],
        ]);
    }

    /**
     * Ringkasan Kartu Stok Bulanan Seluruh Bahan & Estimasi Porsi
     */
    public function stockCardSummary(Request $request): JsonResponse
    {
        $materials = RawMaterial::orderBy('name')->get();
        $query = StockMovement::query();
        
        if ($request->filled('month') && $request->filled('year')) {
            $monthStart = \Carbon\Carbon::create((int) $request->year, (int) $request->month, 1)->startOfMonth();
            $monthEnd = \Carbon\Carbon::create((int) $request->year, (int) $request->month, 1)->endOfMonth();
            $query->whereBetween('created_at', [$monthStart, $monthEnd]);
        }
        
        $allMovements = $query->get();

        $summary = $materials->map(function ($mat) use ($allMovements) {
            $matMov = $allMovements->where('raw_material_id', $mat->id);

            $totalIn = (float) $matMov->whereIn('type', ['IN', 'IN_PURCHASE', 'IN_ADJUSTMENT'])
                ->sum('qty') + (float) $matMov->where('type', 'ADJUSTMENT')->where('qty', '>', 0)->sum('qty');
            $totalOutSale = (float) $matMov->whereIn('type', ['OUT_SALE', 'OUT'])->sum('qty');
            $totalOutWaste = (float) $matMov->whereIn('type', ['OUT_WASTE', 'OUT_ADJUSTMENT'])->sum('qty')
                + abs((float) $matMov->where('type', 'ADJUSTMENT')->where('qty', '<', 0)->sum('qty'));
            $totalUsed = $totalOutSale + $totalOutWaste;

            // Yield estimation: how many portions can be made from current stock
            $yieldInfo = [];
            $recipes = \App\Models\Recipe::with('product')
                ->where('raw_material_id', $mat->id)
                ->get();

            foreach ($recipes as $recipe) {
                if ($recipe->qty_needed > 0) {
                    $portionsLeft = floor($mat->current_stock / $recipe->qty_needed);
                    $yieldFormula = '';
                    if ($mat->unit === 'gram') {
                        $perKg = floor(1000 / $recipe->qty_needed);
                        $yieldFormula = "1 kg dapat ±{$perKg} porsi ({$recipe->qty_needed}g/porsi)";
                    } elseif ($mat->unit === 'ml') {
                        $perLiter = floor(1000 / $recipe->qty_needed);
                        if (stripos($mat->name, 'galon') !== false || stripos($mat->name, 'air') !== false) {
                            $perGalon = floor(19000 / $recipe->qty_needed);
                            $yieldFormula = "1 Galon (19L) dapat ±{$perGalon} porsi ({$recipe->qty_needed}ml/cup, 1L = {$perLiter} cup)";
                        } else {
                            $yieldFormula = "1 Liter dapat ±{$perLiter} porsi ({$recipe->qty_needed}ml/porsi)";
                        }
                    } else {
                        $yieldFormula = "1 {$mat->unit} = 1 porsi ({$recipe->qty_needed} {$mat->unit})";
                    }

                    $yieldInfo[] = [
                        'product_name' => $recipe->product->name ?? '-',
                        'qty_per_portion' => $recipe->qty_needed,
                        'unit' => $mat->unit,
                        'portions_from_current' => $portionsLeft,
                        'yield_formula' => $yieldFormula,
                    ];
                }
            }

            return [
                'id' => $mat->id,
                'name' => $mat->name,
                'sku' => $mat->sku,
                'unit' => $mat->unit,
                'current_stock' => $mat->current_stock,
                'min_stock_alert' => $mat->min_stock_alert,
                'is_low_stock' => $mat->current_stock <= $mat->min_stock_alert,
                'total_in' => $totalIn,
                'total_used_sale' => $totalOutSale,
                'total_used_waste' => $totalOutWaste,
                'total_used' => $totalUsed,
                'avg_cost_per_unit' => $mat->avg_cost_per_unit,
                'asset_value' => round($mat->current_stock * $mat->avg_cost_per_unit, 2),
                'yield_info' => $yieldInfo,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $summary,
        ]);
    }
}

