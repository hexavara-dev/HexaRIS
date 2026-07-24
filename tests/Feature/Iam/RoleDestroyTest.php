<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.delete', 'web');
});

it('deletes a role', function () {
    $role = Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.delete');

    $this->actingAs($user)
        ->delete("/iam/roles/{$role->id}")
        ->assertRedirect();

    expect(Role::where('name', 'editor')->exists())->toBeFalse();
});

it('refuses to delete the super-admin role', function () {
    $role = Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.delete');

    $this->actingAs($user)
        ->delete("/iam/roles/{$role->id}")
        ->assertRedirect();

    expect(Role::where('name', 'super-admin')->exists())->toBeTrue();
});

it('forbids deleting without roles.delete', function () {
    $role = Role::findOrCreate('editor', 'web');
    $this->actingAs(User::factory()->create());

    $this->delete("/iam/roles/{$role->id}")->assertForbidden();
    expect(Role::where('name', 'editor')->exists())->toBeTrue();
});
