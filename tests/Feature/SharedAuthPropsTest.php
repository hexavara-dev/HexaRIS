<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
});

it('shares the user permissions and super-admin flag', function () {
    Permission::findOrCreate('users.viewAny', 'web');
    $user = User::factory()->create()->givePermissionTo('users.viewAny');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.isSuperAdmin', false)
            ->where('auth.permissions', fn ($perms) => in_array('users.viewAny', $perms->toArray(), true))
        );
});

it('flags super-admin users', function () {
    Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->assignRole('super-admin');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->where('auth.isSuperAdmin', true));
});
