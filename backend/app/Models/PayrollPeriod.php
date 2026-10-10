<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;
    
    protected $fillable = ['name', 'start_date', 'end_date', 'pay_date', 'paid_at', 'status', 'created_by'];
}
