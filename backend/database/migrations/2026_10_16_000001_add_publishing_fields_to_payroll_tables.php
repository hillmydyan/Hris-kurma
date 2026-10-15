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
        Schema::table('payroll_periods', function (Blueprint $table) {
            if (!Schema::hasColumn('payroll_periods', 'period_key')) {
                $table->string('period_key')->nullable()->index()->after('id');
            }
            if (!Schema::hasColumn('payroll_periods', 'is_published')) {
                $table->boolean('is_published')->default(false)->after('status');
            }
            if (!Schema::hasColumn('payroll_periods', 'published_at')) {
                $table->dateTime('published_at')->nullable()->after('is_published');
            }
            if (!Schema::hasColumn('payroll_periods', 'published_by')) {
                $table->foreignId('published_by')->nullable()->after('published_at')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('payroll_records', function (Blueprint $table) {
            if (!Schema::hasColumn('payroll_records', 'period_key')) {
                $table->string('period_key')->nullable()->index()->after('employee_id');
            }
            if (!Schema::hasColumn('payroll_records', 'snapshot_data')) {
                $table->json('snapshot_data')->nullable()->after('attendance_summary');
            }
            if (!Schema::hasColumn('payroll_records', 'is_published')) {
                $table->boolean('is_published')->default(false)->after('status');
            }
            if (!Schema::hasColumn('payroll_records', 'published_at')) {
                $table->dateTime('published_at')->nullable()->after('is_published');
            }
            if (!Schema::hasColumn('payroll_records', 'published_by')) {
                $table->foreignId('published_by')->nullable()->after('published_at')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            if (Schema::hasColumn('payroll_records', 'published_by')) {
                $table->dropForeign(['published_by']);
                $table->dropColumn('published_by');
            }
            if (Schema::hasColumn('payroll_records', 'published_at')) {
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('payroll_records', 'is_published')) {
                $table->dropColumn('is_published');
            }
            if (Schema::hasColumn('payroll_records', 'snapshot_data')) {
                $table->dropColumn('snapshot_data');
            }
            if (Schema::hasColumn('payroll_records', 'period_key')) {
                $table->dropColumn('period_key');
            }
        });

        Schema::table('payroll_periods', function (Blueprint $table) {
            if (Schema::hasColumn('payroll_periods', 'published_by')) {
                $table->dropForeign(['published_by']);
                $table->dropColumn('published_by');
            }
            if (Schema::hasColumn('payroll_periods', 'published_at')) {
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('payroll_periods', 'is_published')) {
                $table->dropColumn('is_published');
            }
            if (Schema::hasColumn('payroll_periods', 'period_key')) {
                $table->dropColumn('period_key');
            }
        });
    }
};
