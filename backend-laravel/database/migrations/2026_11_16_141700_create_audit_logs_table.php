<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name', 100);
            $table->string('user_role', 50)->nullable();
            $table->string('action', 50); // LOGIN, ORDER_PAID, ORDER_VOID, ORDER_STATUS, STOCK_IN, WASTE_APPROVED, OPNAME_SUBMITTED, RECIPE_MODIFIED, etc.
            $table->string('entity_type', 100)->nullable(); // Order, RawMaterial, WasteLog, Product, etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
