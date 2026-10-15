<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyReportEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'daily_report_id',
        'row_order',
        'time_start',
        'time_end',
        'activity',
        'output_result',
        'status',
        'notes',
        'custom_attributes',
    ];

    protected $casts = [
        'custom_attributes' => 'array',
        'row_order' => 'integer',
    ];

    public function dailyReport()
    {
        return $this->belongsTo(DailyReport::class);
    }
}
