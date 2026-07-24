<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.update', 'web');
    Permission::findOrCreate('audit.view', 'web');
});

it('updates a role name and permissions', function () {
    $role = Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.update');

    $this->actingAs($user)
        ->put("/iam/roles/{$role->id}", ['name' => 'manager', 'permissions' => ['audit.view']])
        ->assertRedirect();

    $role->refresh();
    expect($role->name)->toBe('manager')
        ->and($role->permissions->pluck('name')->all())->toBe(['audit.view']);
});

it('allows keeping the same name on update', function () {
    $role = Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.update');

    $this->actingAs($user)
        ->put("/iam/roles/{$role->id}", ['name' => 'editor'])
        ->assertRedirect();

    expect(Role::where('name', 'editor')->count())->toBe(1);
});

it('forbids updating without roles.update', function () {
    $role = Role::findOrCreate('editor', 'web');
    $this->actingAs(User::factory()->create());

    $this->put("/iam/roles/{$role->id}", ['name' => 'manager'])->assertForbidden();
});

it('refuses to rename the super-admin role', function () {
    $role = Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.update');

    $this->actingAs($user)
        ->put("/iam/roles/{$role->id}", ['name' => 'not-admin'])
        ->assertForbidden();

    expect(Role::where('name', 'super-admin')->exists())->toBeTrue();
});
