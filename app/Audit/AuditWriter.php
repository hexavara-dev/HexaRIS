<?php

namespace App\Audit;

use App\Audit\Models\AuditActivity;

class AuditWriter
{
    /**
     * @param array{
     *   description: string,
     *   event: ?string,
     *   subject_type: ?string,
     *   subject_id: int|string|null,
     *   causer_type: ?string,
     *   causer_id: int|string|null,
     *   before: array<string,mixed>,
     *   after: array<string,mixed>,
     *   properties: array<string,mixed>,
     * } $payload
     */
    public function write(array $payload): AuditActivity
    {
        $hasChanges = $payload['before'] !== [] || $payload['after'] !== [];

        return AuditActivity::create([
            'log_name' => 'audit',
            'description' => $payload['description'],
            'event' => $payload['event'],
            'subject_type' => $payload['subject_type'],
            'subject_id' => $payload['subject_id'],
            'causer_type' => $payload['causer_type'],
            'causer_id' => $payload['causer_id'],
            'attribute_changes' => $hasChanges
                ? ['old' => $payload['before'], 'new' => $payload['after']]
                : null,
            'properties' => $payload['properties'],
        ]);
    }
}
