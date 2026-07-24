<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.create', 'web');
    Role::findOrCreate('editor', 'web');
});

it('forbids creating a user without users.create', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/iam/users', [])->assertForbidden();
});

it('creates a user with a role and a hashed password', function () {
    $admin = User::factory()->create()->givePermissionTo('users.create');

    $this->actingAs($admin)->post('/iam/users', [
        'name' => 'New Person',
        'email' => 'new@example.com',
        'password' => 'secret-password',
        'roles' => ['editor'],
    ])->assertRedirect();

    $user = User::where('email', 'new@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->hasRole('editor'))->toBeTrue()
        ->and($user->password)->not->toBe('secret-password')
        ->and(Hash::check('secret-password', $user->password))->toBeTrue();
});

it('rejects a duplicate email', function () {
    User::factory()->create(['email' => 'dup@example.com']);
    $admin = User::factory()->create()->givePermissionTo('users.create');

    $this->actingAs($admin)->post('/iam/users', [
        'name' => 'X',
        'email' => 'dup@example.com',
        'password' => 'secret-password',
    ])->assertSessionHasErrors('email');
});
