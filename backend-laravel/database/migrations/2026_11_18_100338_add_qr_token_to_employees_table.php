<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('qr_token', 64)->nullable()->unique()->after('employee_code');
            $table->string('department', 100)->nullable()->after('position');
            $table->date('hire_date')->nullable()->after('department');
            $table->string('phone', 20)->nullable()->after('hire_date');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['qr_token', 'department', 'hire_date', 'phone']);
        });
    }
};
