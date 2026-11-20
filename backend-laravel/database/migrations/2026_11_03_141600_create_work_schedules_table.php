<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->string('shift_name'); // MORNING, AFTERNOON, FULL
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();

            $table->unique(['employee_id', 'work_date', 'shift_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_schedules');
    }
};
