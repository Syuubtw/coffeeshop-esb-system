<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('device_id', 128)->nullable()->after('qr_token');
            $table->string('device_info', 255)->nullable()->after('device_id');
            $table->timestamp('device_locked_at')->nullable()->after('device_info');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['device_id', 'device_info', 'device_locked_at']);
        });
    }
};
