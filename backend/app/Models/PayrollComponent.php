<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollComponent extends Model
{
    use HasFactory;
    
    protected $fillable = ['code', 'name', 'type', 'calc_type', 'is_active'];
}
