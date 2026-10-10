<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Employee extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'employee_id',
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'join_date',
        'resign_date',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignments()
    {
        return $this->hasMany(EmployeeAssignment::class);
    }

    public function currentAssignment()
    {
        return $this->hasOne(EmployeeAssignment::class)
            ->where('is_primary', true)
            ->where(function ($query) {
                $query->whereNull('end_date')
                      ->orWhere('end_date', '>=', now());
            })
            ->latest('start_date');
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function attendanceCorrections()
    {
        return $this->hasMany(AttendanceCorrection::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function kpis()
    {
        return $this->hasMany(Kpi::class);
    }
}
