<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Spatie\Permission\Models\Permission;

it('seeds an admin user with the super-admin role', function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::where('email', 'admin@example.com')->first();
    expect($admin)->not->toBeNull()
        ->and($admin->hasRole('super-admin'))->toBeTrue();
});

it('syncs every module permission on seed', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Permission::where('name', 'users.viewAny')->exists())->toBeTrue()
        ->and(Permission::where('name', 'roles.create')->exists())->toBeTrue()
        ->and(Permission::where('name', 'audit.view')->exists())->toBeTrue();
});

it('is idempotent — re-seeding does not crash or duplicate users', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(User::where('email', 'admin@example.com')->count())->toBe(1)
        ->and(User::where('email', 'test@example.com')->count())->toBe(1);
});
