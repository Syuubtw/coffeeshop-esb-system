<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->string('opname_number', 50)->unique();
            $table->date('opname_date');
            $table->foreignId('audited_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('PENDING_APPROVAL'); // PENDING_APPROVAL, APPROVED, REJECTED
            $table->decimal('total_variance_qty', 12, 2)->default(0);
            $table->decimal('total_variance_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_opname_id')->constrained('stock_opnames')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials');
            $table->decimal('system_stock', 12, 2);
            $table->decimal('physical_stock', 12, 2);
            $table->decimal('variance_qty', 12, 2); // physical - system
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('variance_cost', 15, 2)->default(0); // variance_qty * unit_cost
            $table->string('reason', 255)->nullable(); // e.g. Tumpah, Kalibrasi grinder, Selisih timbangan, dll
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
    }
};
