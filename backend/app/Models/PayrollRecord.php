<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_period_id',
        'employee_id',
        'period_key',
        'attendance_summary',
        'snapshot_data',
        'gross_pay',
        'total_deductions',
        'net_pay',
        'slip_path',
        'status',
        'is_published',
        'published_at',
        'published_by',
    ];

    protected $casts = [
        'attendance_summary' => 'array',
        'snapshot_data' => 'array',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function period()
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id');
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
