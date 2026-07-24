<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.create', 'web');
    Permission::findOrCreate('audit.view', 'web');
});

it('forbids creating a role without roles.create', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/iam/roles', ['name' => 'editor'])->assertForbidden();
});

it('creates a role and syncs its permissions', function () {
    $user = User::factory()->create()->givePermissionTo('roles.create');

    $this->actingAs($user)
        ->post('/iam/roles', ['name' => 'editor', 'permissions' => ['audit.view']])
        ->assertRedirect();

    $role = Role::where('name', 'editor')->first();
    expect($role)->not->toBeNull()
        ->and($role->permissions->pluck('name')->all())->toBe(['audit.view']);
});

it('rejects a duplicate role name', function () {
    Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.create');

    $this->actingAs($user)
        ->post('/iam/roles', ['name' => 'editor'])
        ->assertSessionHasErrors('name');
});
