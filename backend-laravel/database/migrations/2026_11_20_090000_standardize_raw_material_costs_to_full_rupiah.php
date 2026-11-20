<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Standardize raw_materials with avg_cost_per_unit < 10 (legacy thousands format) to Full Rupiah
        DB::table('raw_materials')
            ->where('avg_cost_per_unit', '>', 0)
            ->where('avg_cost_per_unit', '<', 10)
            ->update([
                'avg_cost_per_unit' => DB::raw('avg_cost_per_unit * 1000')
            ]);

        // Fix initial stock_movements where unit_cost was in thousands
        DB::table('stock_movements')
            ->where('unit_cost', '>', 0)
            ->where('unit_cost', '<', 10)
            ->update([
                'unit_cost' => DB::raw('unit_cost * 1000')
            ]);

        // Fix purchase_order_items where unit_cost was in thousands
        if (Schema::hasTable('purchase_order_items')) {
            DB::table('purchase_order_items')
                ->where('unit_cost', '>', 0)
                ->where('unit_cost', '<', 10)
                ->update([
                    'unit_cost' => DB::raw('unit_cost * 1000'),
                    'subtotal' => DB::raw('qty_ordered * (unit_cost * 1000)')
                ]);
        }
    }

    public function down(): void
    {
        DB::table('raw_materials')
            ->where('avg_cost_per_unit', '>=', 10)
            ->update([
                'avg_cost_per_unit' => DB::raw('avg_cost_per_unit / 1000')
            ]);
    }
};
