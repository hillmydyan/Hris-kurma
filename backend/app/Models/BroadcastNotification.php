<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BroadcastNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'title',
        'message',
        'category',
        'target_type',
        'target_department_id',
        'target_employee_ids',
        'recipients_count',
    ];

    protected $casts = [
        'target_employee_ids' => 'array',
        'recipients_count' => 'integer',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'target_department_id');
    }
}
