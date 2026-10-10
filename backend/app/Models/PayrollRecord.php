<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollRecord extends Model
{
    use HasFactory;

    protected $fillable = ['payroll_period_id', 'employee_id', 'attendance_summary', 'gross_pay', 'total_deductions', 'net_pay', 'slip_path', 'status'];
    
    protected $casts = [
        'attendance_summary' => 'array'
    ];
}
