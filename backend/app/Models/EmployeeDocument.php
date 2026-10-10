<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'document_type',
        'document_number',
        'file_path',
        'expiry_date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
