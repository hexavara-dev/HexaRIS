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

it('sorts roles by name', function () {
    Role::findOrCreate('alpha', 'web');
    Role::findOrCreate('zeta', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.viewAny');

    $this->actingAs($user)
        ->get('/iam/roles?sort=-name')
        ->assertInertia(fn (Assert $page) => $page->where('roles.data.0.name', 'zeta'));
});
