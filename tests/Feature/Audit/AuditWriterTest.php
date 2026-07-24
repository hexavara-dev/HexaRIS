<?php

use App\Audit\AuditWriter;
use App\Audit\Models\AuditActivity;

it('writes an audit row with changes and properties', function () {
    $activity = app(AuditWriter::class)->write([
        'description' => 'Order updated',
        'event' => 'updated',
        'subject_type' => 'orders',
        'subject_id' => 7,
        'causer_type' => null,
        'causer_id' => null,
        'before' => ['status' => 'pending'],
        'after' => ['status' => 'approved'],
        'properties' => ['module' => 'Orders', 'ip' => '127.0.0.1'],
    ]);

    expect($activity)->toBeInstanceOf(AuditActivity::class);

    $fresh = AuditActivity::find($activity->id);
    expect($fresh->event)->toBe('updated')
        ->and($fresh->subject_type)->toBe('orders')
        ->and($fresh->subject_id)->toBe('7')
        ->and($fresh->attribute_changes)->toBe(['old' => ['status' => 'pending'], 'new' => ['status' => 'approved']])
        ->and($fresh->properties)->toBe(['module' => 'Orders', 'ip' => '127.0.0.1'])
        ->and($fresh->log_name)->toBe('audit');
});

it('omits attribute_changes when before and after are empty', function () {
    $activity = app(AuditWriter::class)->write([
        'description' => 'User logged in',
        'event' => 'auth.login',
        'subject_type' => null,
        'subject_id' => null,
        'causer_type' => null,
        'causer_id' => null,
        'before' => [],
        'after' => [],
        'properties' => ['ip' => '127.0.0.1'],
    ]);

    expect(AuditActivity::find($activity->id)->attribute_changes)->toBeNull();
});
