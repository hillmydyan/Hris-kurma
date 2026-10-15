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
            $table->enum('rotating_start_workday', ['saturday', 'sunday'])->default('saturday')->after('weekend_pattern');
            $table->date('rotating_start_week')->nullable()->after('rotating_start_workday');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['rotating_start_workday', 'rotating_start_week']);
        });
    }
};
