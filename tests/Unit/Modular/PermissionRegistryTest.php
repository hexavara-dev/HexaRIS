<?php

use App\Modular\PermissionRegistry;

it('validates the <resource>.<action> name format', function () {
    expect(PermissionRegistry::isValidName('users.view'))->toBeTrue()
        ->and(PermissionRegistry::isValidName('orders.approve'))->toBeTrue()
        ->and(PermissionRegistry::isValidName('users.viewAny'))->toBeTrue()
        ->and(PermissionRegistry::isValidName('Users.view'))->toBeFalse()
        ->and(PermissionRegistry::isValidName('users'))->toBeFalse()
        ->and(PermissionRegistry::isValidName('users view'))->toBeFalse()
        ->and(PermissionRegistry::isValidName('users.'))->toBeFalse();
});

it('dedupes added permissions preserving order', function () {
    $registry = new PermissionRegistry;
    $registry->add(['users.view', 'users.view', 'users.create']);

    expect($registry->all())->toBe(['users.view', 'users.create']);
});
