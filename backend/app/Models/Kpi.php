<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kpi extends Model
{
    use HasFactory;
    
    protected $fillable = ['employee_id', 'month', 'score', 'feedback'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
