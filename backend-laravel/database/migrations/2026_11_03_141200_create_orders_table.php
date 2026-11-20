<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('dining_table_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cashier_shift_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_source')->default('POS'); // POS, QR_TABLE
            $table->string('order_type')->default('DINE_IN'); // DINE_IN, TAKEAWAY
            $table->string('customer_name')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('service_charge', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('payment_method')->nullable(); // CASH, QRIS, CARD, E_WALLET
            $table->string('payment_status')->default('UNPAID'); // UNPAID, PAID, REFUNDED
            $table->string('order_status')->default('PENDING'); // PENDING, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
