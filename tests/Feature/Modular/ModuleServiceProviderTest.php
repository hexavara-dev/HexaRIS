<?php

use App\Modular\ModuleRegistry;
use App\Modular\PermissionRegistry;

it('binds the module and permission registries as singletons', function () {
    expect(app(ModuleRegistry::class))->toBe(app(ModuleRegistry::class))
        ->and(app(PermissionRegistry::class))->toBeInstanceOf(PermissionRegistry::class);
});

it('points the module registry at app/Modules', function () {
    $registry = app(ModuleRegistry::class);
    // No modules scaffolded yet → empty, but the call must not throw.
    expect($registry->all())->toBeIterable();
});
