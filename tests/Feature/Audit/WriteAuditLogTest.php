<?php

use App\Audit\AuditWriter;
use App\Audit\Models\AuditActivity;
use App\Audit\WriteAuditLog;

it('writes the audit row when handled', function () {
    $payload = [
        'description' => 'Async order updated',
        'event' => 'updated',
        'subject_type' => 'orders',
        'subject_id' => 9,
        'causer_type' => null,
        'causer_id' => null,
        'before' => [],
        'after' => ['status' => 'shipped'],
        'properties' => ['module' => 'Orders'],
    ];

    (new WriteAuditLog($payload))->handle(app(AuditWriter::class));

    expect(AuditActivity::where('subject_id', 9)->where('event', 'updated')->exists())->toBeTrue();
});
