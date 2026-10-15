<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkdaySwap extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'original_date',
        'replacement_date',
        'reason',
        'status',
        'approved_by',
        'rejection_reason',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
