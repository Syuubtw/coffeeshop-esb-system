<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('employee_code')->unique();
            $table->string('position'); // BARISTA, CASHIER, MANAGER, etc.
            $table->string('employment_status')->default('ACTIVE'); // ACTIVE, INACTIVE, RESIGNED
            $table->decimal('base_salary', 15, 2)->default(0);
            $table->decimal('daily_allowance', 15, 2)->default(0);
            $table->decimal('hourly_overtime_rate', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
