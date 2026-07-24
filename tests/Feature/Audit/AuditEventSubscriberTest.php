<?php

use App\Audit\AuditEventSubscriber;
use App\Audit\Models\AuditActivity;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

beforeEach(function () {
    // Register the subscriber directly so the test does not depend on the provider.
    Event::subscribe(AuditEventSubscriber::class);
});

it('logs a login as auth.login with the causer', function () {
    $user = User::factory()->create();

    event(new Login('web', $user, false));

    $row = AuditActivity::where('event', 'auth.login')->first();
    expect($row)->not->toBeNull()
        ->and($row->causer_id)->toBe((string) $user->id);
});

it('logs a logout as auth.logout', function () {
    $user = User::factory()->create();

    event(new Logout('web', $user));

    expect(AuditActivity::where('event', 'auth.logout')->exists())->toBeTrue();
});

it('logs a failed attempt as auth.failed with the attempted email', function () {
    event(new Failed('web', null, ['email' => 'nobody@example.com', 'password' => 'secret']));

    $row = AuditActivity::where('event', 'auth.failed')->first();
    expect($row)->not->toBeNull()
        ->and($row->properties['email'])->toBe('nobody@example.com')
        ->and($row->properties)->not->toHaveKey('password');
});
