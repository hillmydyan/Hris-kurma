<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::statement("ALTER TABLE leaves MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'sick'");
        } catch (\Exception $e) {
            Schema::table('leaves', function (Blueprint $table) {
                $table->string('type', 50)->default('sick')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert not strictly needed in dev
    }
};
