<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'department_id',
        'job_position_id',
        'work_location_id',
        'start_date',
        'end_date',
        'is_primary',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_primary' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function jobPosition()
    {
        return $this->belongsTo(JobPosition::class);
    }

    public function workLocation()
    {
        return $this->belongsTo(WorkLocation::class);
    }
}