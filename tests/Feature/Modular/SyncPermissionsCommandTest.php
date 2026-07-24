<?php

use App\Modular\PermissionRegistry;
use Spatie\Permission\Models\Permission;

it('syncs declared permissions into the database', function () {
    app()->bind(PermissionRegistry::class, function () {
        $registry = new PermissionRegistry;
        $registry->add(['users.view', 'users.create']);

        return $registry;
    });

    $this->artisan('permission:sync')->assertSuccessful();

    expect(Permission::pluck('name')->all())->toContain('users.view', 'users.create');
});

it('fails loudly on an invalid permission name', function () {
    app()->bind(PermissionRegistry::class, function () {
        $registry = new PermissionRegistry;
        $registry->add(['Bad Name']);

        return $registry;
    });

    $this->artisan('permission:sync')->assertFailed();

    expect(Permission::count())->toBe(0);
});

it('prunes undeclared permissions when --prune is passed', function () {
    Permission::findOrCreate('legacy.remove', 'web');

    app()->bind(PermissionRegistry::class, function () {
        $registry = new PermissionRegistry;
        $registry->add(['users.view']);

        return $registry;
    });

    $this->artisan('permission:sync --prune')->assertSuccessful();

    expect(Permission::pluck('name')->all())
        ->toContain('users.view')
        ->not->toContain('legacy.remove');
});
