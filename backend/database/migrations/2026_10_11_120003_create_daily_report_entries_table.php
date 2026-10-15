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
        Schema::create('daily_report_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained('daily_reports')->cascadeOnDelete();
            $table->unsignedInteger('row_order')->default(0);
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->text('activity');
            $table->text('output_result')->nullable();
            $table->enum('status', ['done', 'in_progress', 'pending', 'blocked'])->default('done');
            $table->text('notes')->nullable();
            $table->json('custom_attributes')->nullable();
            $table->timestamps();

            $table->index(['daily_report_id', 'row_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_report_entries');
    }
};
