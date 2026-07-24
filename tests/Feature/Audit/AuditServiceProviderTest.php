<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Illuminate\Auth\Events\Login;

it('wires the auth subscriber so a login is audited end-to-end', function () {
    $user = User::factory()->create();

    event(new Login('web', $user, false));

    expect(AuditActivity::where('event', 'auth.login')->where('causer_id', $user->id)->exists())->toBeTrue();
});
