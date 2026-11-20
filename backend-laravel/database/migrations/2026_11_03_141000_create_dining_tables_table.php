<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_tables', function (Blueprint $table) {
            $table->id();
            $table->string('table_number')->unique();
            $table->string('qr_token')->unique();
            $table->integer('capacity')->default(4);
            $table->string('status')->default('AVAILABLE'); // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_tables');
    }
};
