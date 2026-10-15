<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class DailyReport extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'employee_id',
        'report_date',
        'department_id',
        'job_position_id',
        'status',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'overall_feedback',
        'summary_notes',
    ];

    protected $casts = [
        'report_date' => 'date',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
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

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function entries()
    {
        return $this->hasMany(DailyReportEntry::class)->orderBy('row_order');
    }

    public function reviews()
    {
        return $this->hasMany(DailyReportReview::class)->latest();
    }
}
