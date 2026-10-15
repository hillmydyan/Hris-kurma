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
            $table->string('nik')->nullable()->after('phone');
            $table->text('address')->nullable()->after('nik');
            $table->date('birth_date')->nullable()->after('address');
            $table->string('gender')->nullable()->after('birth_date');
            $table->string('employment_type')->default('permanent')->after('status');
            $table->bigInteger('basic_salary')->default(0)->after('employment_type');
            $table->bigInteger('allowances')->default(0)->after('basic_salary');
            $table->string('bank_name')->nullable()->after('allowances');
            $table->string('bank_account_number')->nullable()->after('bank_name');
            $table->string('bank_account_holder')->nullable()->after('bank_account_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'nik',
                'address',
                'birth_date',
                'gender',
                'employment_type',
                'basic_salary',
                'allowances',
                'bank_name',
                'bank_account_number',
                'bank_account_holder',
            ]);
        });
    }
};
