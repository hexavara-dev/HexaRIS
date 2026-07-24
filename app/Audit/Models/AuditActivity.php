<?php

namespace App\Audit\Models;

use Spatie\Activitylog\Models\Activity;

class AuditActivity extends Activity
{
    protected $table = 'activity_log';

    protected $fillable = [
        'log_name',
        'description',
        'subject_type',
        'subject_id',
        'event',
        'causer_type',
        'causer_id',
        'attribute_changes',
        'properties',
    ];

    protected function casts(): array
    {
        return [
            'attribute_changes' => 'array',
            'properties' => 'array',
            'subject_id' => 'string',
            'causer_id' => 'string',
        ];
    }
}
