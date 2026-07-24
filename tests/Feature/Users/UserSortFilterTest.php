<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.viewAny', 'web');
    $this->admin = User::factory()->create(['name' => 'Zed Admin'])->givePermissionTo('users.viewAny');
});

it('sorts by name ascending when ?sort=name', function () {
    User::factory()->create(['name' => 'Aaron']);
    User::factory()->create(['name' => 'Mona']);

    $this->actingAs($this->admin)
        ->get('/iam/users?sort=name')
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data.0.name', 'Aaron')
            ->where('sort', 'name')
        );
});

it('sorts descending when ?sort=-name', function () {
    User::factory()->create(['name' => 'Aaron']);

    $this->actingAs($this->admin)
        ->get('/iam/users?sort=-name')
        ->assertInertia(fn (Assert $page) => $page->where('users.data.0.name', 'Zed Admin'));
});

it('filters by name with the contains operator', function () {
    User::factory()->create(['name' => 'Findme Smith']);

    $this->actingAs($this->admin)
        ->get('/iam/users?filter[name][contains]=Findme')
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data', fn ($rows) => collect($rows)->count() === 1 && collect($rows)->first()['name'] === 'Findme Smith')
            ->where('filters.name.contains', 'Findme')
        );
});

it('respects the operator (eq does not match a partial)', function () {
    User::factory()->create(['name' => 'Findme Smith']);

    $this->actingAs($this->admin)
        ->get('/iam/users?filter[name][eq]=Findme')
        ->assertInertia(fn (Assert $page) => $page->where('users.data', fn ($rows) => collect($rows)->count() === 0));
});

it('filters by role with the in operator', function () {
    Role::findOrCreate('editor', 'web');
    User::factory()->create(['name' => 'An Editor'])->assignRole('editor');

    $this->actingAs($this->admin)
        ->get('/iam/users?filter[roles][in]=editor')
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data', fn ($rows) => collect($rows)->count() === 1 && collect($rows)->first()['name'] === 'An Editor')
        );
});

it('ignores a disallowed sort instead of erroring', function () {
    $this->actingAs($this->admin)
        ->get('/iam/users?sort=password')
        ->assertOk();
});

it('ignores an invalid operator for the column type', function () {
    User::factory()->create(['name' => 'Findme Smith']);

    // 'gt' is not valid for a text column → ignored, all rows returned, no error.
    $this->actingAs($this->admin)
        ->get('/iam/users?filter[name][gt]=Findme')
        ->assertOk();
});

it('searches across name and email via ?search', function () {
    User::factory()->create(['name' => 'Findme User', 'email' => 'findme@example.com']);
    User::factory()->create(['name' => 'Other User', 'email' => 'other@findme.test']);
    User::factory()->create(['name' => 'Unrelated', 'email' => 'unrelated@example.com']);

    $this->actingAs($this->admin)
        ->get('/iam/users?search=findme')
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data', fn ($rows) => collect($rows)->count() === 2)
            ->where('search', 'findme')
        );
});
