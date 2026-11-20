<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id();
            $table->integer('month');
            $table->integer('year');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_disbursed', 15, 2)->default(0);
            $table->string('status')->default('DRAFT'); // DRAFT, CALCULATED, APPROVED, PAID
            $table->timestamps();

            $table->unique(['month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_periods');
    }
};
