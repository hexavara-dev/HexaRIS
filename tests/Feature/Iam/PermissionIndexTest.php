<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('permissions.viewAny', 'web');
});

it('forbids users without permissions.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/iam/permissions')->assertForbidden();
});

it('lists permissions grouped by resource', function () {
    Permission::findOrCreate('audit.view', 'web');
    Permission::findOrCreate('roles.create', 'web');
    $user = User::factory()->create()->givePermissionTo('permissions.viewAny');

    $this->actingAs($user)
        ->get('/iam/permissions')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Iam::pages/permissions/Index')
            ->has('groups')
            ->has('groups.audit')
            ->has('groups.roles')
        );
});
