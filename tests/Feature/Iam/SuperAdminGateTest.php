<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

it('grants every ability to a super-admin', function () {
    Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->assignRole('super-admin');

    expect($user->can('roles.create'))->toBeTrue()
        ->and($user->can('anything.at.all'))->toBeTrue();
});

it('does not grant abilities to a normal user', function () {
    $user = User::factory()->create();

    expect($user->can('roles.create'))->toBeFalse();
});
