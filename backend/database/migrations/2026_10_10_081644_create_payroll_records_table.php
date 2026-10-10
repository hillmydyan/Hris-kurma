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
        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->json('attendance_summary')->nullable();
            $table->bigInteger('gross_pay')->default(0);
            $table->bigInteger('total_deductions')->default(0);
            $table->bigInteger('net_pay')->default(0);
            $table->string('slip_path')->nullable();
            $table->enum('status', ['draft', 'final'])->default('draft');
            $table->timestamps();
            $table->unique(['payroll_period_id', 'employee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
    }
};
