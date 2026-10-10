<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            $model->logAudit('create', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $model->logAudit('update', $model->getOriginal(), $model->getChanges());
        });

        static::deleted(function ($model) {
            $model->logAudit('delete', $model->getAttributes(), null);
        });
    }

    protected function logAudit($action, $oldValues, $newValues)
    {
        $sensitiveFields = ['password', 'remember_token', 'pin'];
        
        $maskSensitive = function ($data) use ($sensitiveFields) {
            if (!is_array($data)) return $data;
            foreach ($data as $key => $value) {
                if (in_array($key, $sensitiveFields)) {
                    $data[$key] = '********';
                }
            }
            return $data;
        };

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => get_class($this),
            'model_id' => $this->id,
            'old_values' => $maskSensitive($oldValues),
            'new_values' => $maskSensitive($newValues),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
