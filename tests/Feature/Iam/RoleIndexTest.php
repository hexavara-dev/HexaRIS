<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.viewAny', 'web');
});

it('forbids users without roles.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/iam/roles')->assertForbidden();
});

it('lists roles for permitted users', function () {
    $role = Role::findOrCreate('editor', 'web');
    $role->givePermissionTo(Permission::findOrCreate('audit.view', 'web'));
    $user = User::factory()->create()->givePermissionTo('roles.viewAny');

    $this->actingAs($user)
        ->get('/iam/roles')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Iam::pages/roles/Index')
            ->has('roles.data', 1)
            ->where('roles.data.0.name', 'editor')
            ->where('roles.data.0.permissions.0', 'audit.view')
        );
});
