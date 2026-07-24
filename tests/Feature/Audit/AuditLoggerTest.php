<?php

use App\Audit\AuditLogger;
use App\Audit\Models\AuditActivity;
use App\Audit\WriteAuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

it('atomic mode writes immediately', function () {
    AuditLogger::atomic()
        ->subject('orders', 7)
        ->before(['status' => 'pending'])
        ->after(['status' => 'approved'])
        ->event('updated')
        ->module('Orders')
        ->log('Order approved');

    $row = AuditActivity::where('subject_type', 'orders')->where('subject_id', 7)->first();
    expect($row)->not->toBeNull()
        ->and($row->event)->toBe('updated')
        ->and($row->attribute_changes)->toBe(['old' => ['status' => 'pending'], 'new' => ['status' => 'approved']])
        ->and($row->properties['module'])->toBe('Orders');
});

it('atomic mode rolls back with the surrounding transaction', function () {
    try {
        DB::transaction(function () {
            AuditLogger::atomic()->subject('orders', 8)->event('deleted')->log('Order deleted');
            throw new RuntimeException('boom');
        });
    } catch (RuntimeException) {
        // expected
    }

    expect(AuditActivity::where('subject_id', 8)->exists())->toBeFalse();
});

it('records the authenticated user as causer', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    AuditLogger::atomic()->subject('orders', 7)->event('updated')->log('x');

    $row = AuditActivity::where('subject_id', 7)->first();
    expect($row->causer_id)->toBe((string) $user->id)
        ->and($row->causer_type)->toBe($user->getMorphClass());
});

it('async mode dispatches the WriteAuditLog job instead of writing inline', function () {
    Queue::fake();

    AuditLogger::async()->subject('orders', 7)->event('viewed')->log('Order viewed');

    Queue::assertPushed(WriteAuditLog::class, function (WriteAuditLog $job) {
        return $job->payload['subject_id'] === 7 && $job->payload['event'] === 'viewed';
    });
    expect(AuditActivity::count())->toBe(0);
});
