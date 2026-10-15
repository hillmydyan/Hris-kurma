<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name',
        'period_key',
        'start_date',
        'end_date',
        'pay_date',
        'paid_at',
        'status',
        'is_published',
        'published_at',
        'published_by',
        'created_by',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function records()
    {
        return $this->hasMany(PayrollRecord::class, 'payroll_period_id');
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
