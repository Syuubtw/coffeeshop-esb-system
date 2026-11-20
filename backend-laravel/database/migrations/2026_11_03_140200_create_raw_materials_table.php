<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('unit'); // gram, ml, pcs
            $table->decimal('current_stock', 15, 2)->default(0);
            $table->decimal('min_stock_alert', 15, 2)->default(0);
            $table->decimal('avg_cost_per_unit', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_materials');
    }
};
