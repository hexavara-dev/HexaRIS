<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.viewAny', 'web');
});

it('forbids users without users.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/iam/users')->assertForbidden();
});

it('lists users with their roles', function () {
    Role::findOrCreate('editor', 'web');
    $target = User::factory()->create(['name' => 'Jane'])->assignRole('editor');
    $admin = User::factory()->create()->givePermissionTo('users.viewAny');

    $this->actingAs($admin)
        ->get('/iam/users')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Iam::pages/users/Index')
            ->has('users')
            ->where('users', fn ($rows) => collect($rows)->contains(fn ($r) => $r['name'] === 'Jane' && $r['roles'] === ['editor']))
        );
});
