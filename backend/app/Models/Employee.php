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
        'nik',
        'address',
        'birth_date',
        'gender',
        'join_date',
        'resign_date',
        'status',
        'employment_type',
        'weekend_pattern',
        'rotating_start_workday',
        'rotating_start_week',
        'basic_salary',
        'allowances',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
    ];

    protected $appends = ['total_salary', 'full_name'];

    public function getTotalSalaryAttribute()
    {
        return ($this->basic_salary ?? 0) + ($this->allowances ?? 0);
    }

    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . ($this->last_name ?? ''));
    }

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

    public function dailyReports()
    {
        return $this->hasMany(DailyReport::class);
    }

    public function weekendSchedules()
    {
        return $this->hasMany(WeekendSchedule::class);
    }

    public function workdaySwaps()
    {
        return $this->hasMany(WorkdaySwap::class);
    }

    /**
     * Calculate weekend schedule for a specific week Monday date.
     * Supports automatic weekly alternating rotation for 'rotating' pattern.
     */
    public function getWeekendScheduleForWeek(string $weekStartDate): array
    {
        $pattern = $this->weekend_pattern ?? 'saturday_fixed';

        if ($pattern === 'saturday_fixed') {
            return [
                'pattern' => $pattern,
                'assigned_workday' => 'saturday',
                'off_workday' => 'sunday',
                'has_custom_schedule' => false,
                'is_auto_rotating' => false,
                'next_week_workday' => 'saturday',
            ];
        }

        if ($pattern === 'sunday_fixed') {
            return [
                'pattern' => $pattern,
                'assigned_workday' => 'sunday',
                'off_workday' => 'saturday',
                'has_custom_schedule' => false,
                'is_auto_rotating' => false,
                'next_week_workday' => 'sunday',
            ];
        }

        // Pattern: 'rotating' (Rotasi HR Otomatis Bergantian Mingguan)
        // 1. Cek apakah ada jadwal manual override di tabel weekend_schedules khusus pekan ini
        $custom = $this->weekendSchedules()->where('week_start_date', $weekStartDate)->first();

        // 2. Hitung rotasi otomatis bergantian dari acuan awal (rotating_start_week & rotating_start_workday)
        $anchorDay = $this->rotating_start_workday ?: 'saturday';
        $anchorWeek = $this->rotating_start_week ?: \Carbon\Carbon::parse($weekStartDate)->startOfWeek()->toDateString();

        $weekStartCarbon = \Carbon\Carbon::parse($weekStartDate)->startOfWeek();
        $anchorCarbon = \Carbon\Carbon::parse($anchorWeek)->startOfWeek();

        // Selisih pekan antara pekan target dan pekan acuan
        $diffInWeeks = (int)$anchorCarbon->diffInWeeks($weekStartCarbon, false);
        $isOddWeek = abs($diffInWeeks) % 2 === 1;

        $autoDay = $isOddWeek
            ? ($anchorDay === 'saturday' ? 'sunday' : 'saturday')
            : $anchorDay;

        $nextWeekAutoDay = $autoDay === 'saturday' ? 'sunday' : 'saturday';

        if ($custom) {
            return [
                'pattern' => 'rotating',
                'assigned_workday' => $custom->assigned_workday,
                'off_workday' => $custom->assigned_workday === 'saturday' ? 'sunday' : 'saturday',
                'has_custom_schedule' => true,
                'is_auto_rotating' => false,
                'auto_calculated_workday' => $autoDay,
                'next_week_workday' => $nextWeekAutoDay,
            ];
        }

        return [
            'pattern' => 'rotating',
            'assigned_workday' => $autoDay,
            'off_workday' => $autoDay === 'saturday' ? 'sunday' : 'saturday',
            'has_custom_schedule' => false,
            'is_auto_rotating' => true,
            'next_week_workday' => $nextWeekAutoDay,
        ];
    }
}
