<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Department extends Model
{
    use HasFactory, Auditable;

    protected $fillable = ['code', 'name', 'parent_id', 'manager_employee_id'];

    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_employee_id');
    }
}
