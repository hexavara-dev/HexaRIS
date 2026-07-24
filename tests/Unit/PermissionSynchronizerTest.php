<?php

use App\Modular\PermissionRegistry;
use App\Modular\PermissionSynchronizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('creates declared permissions on a fresh database', function () {
    $result = app(PermissionSynchronizer::class)->sync();

    expect($result['created'])->toBeGreaterThan(0)
        ->and($result['invalid'])->toBe([]);

    foreach (app(PermissionRegistry::class)->all() as $name) {
        expect(Permission::where('name', $name)->exists())->toBeTrue();
    }
});

it('is idempotent on a second sync', function () {
    app(PermissionSynchronizer::class)->sync();

    $result = app(PermissionSynchronizer::class)->sync();

    expect($result['created'])->toBe(0)
        ->and($result['invalid'])->toBe([]);
});

it('reports invalid names without creating them', function () {
    $registry = app(PermissionRegistry::class);
    $registry->add(['BadName']);

    $sync = new PermissionSynchronizer($registry);
    $result = $sync->sync();

    expect($result['invalid'])->toContain('BadName')
        ->and(Permission::where('name', 'BadName')->exists())->toBeFalse();
});
