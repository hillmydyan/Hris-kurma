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
            $table->string('weekend_pattern')->default('saturday_fixed')->after('employment_type');
            // 'saturday_fixed' => Masuk Senin-Sabtu, Libur Minggu
            // 'sunday_fixed'   => Masuk Senin-Jumat & Minggu, Libur Sabtu
            // 'rotating'       => Ditentukan HR per minggu (Sabtu atau Minggu)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('weekend_pattern');
        });
    }
};
