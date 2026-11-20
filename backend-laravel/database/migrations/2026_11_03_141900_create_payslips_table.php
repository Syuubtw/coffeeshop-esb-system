<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->integer('total_attendance_days')->default(0);
            $table->integer('total_late_minutes')->default(0);
            $table->decimal('total_overtime_hours', 8, 2)->default(0);
            $table->decimal('base_salary_earned', 15, 2)->default(0);
            $table->decimal('allowance_earned', 15, 2)->default(0);
            $table->decimal('overtime_earned', 15, 2)->default(0);
            $table->decimal('service_charge_bonus', 15, 2)->default(0);
            $table->decimal('deductions_amount', 15, 2)->default(0);
            $table->decimal('net_salary', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['payroll_period_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
