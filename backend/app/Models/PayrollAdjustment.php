<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'period_key',
        'present_days',
        'eligible_meal_days',
        'late_over_15_days',
        'unattended_days',
        'is_prorated',
        'note',
        'adjusted_by',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function adjustedBy()
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}
