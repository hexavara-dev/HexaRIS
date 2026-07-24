<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.update', 'web');
    Role::findOrCreate('editor', 'web');
    Role::findOrCreate('manager', 'web');
});

it('forbids updating a user without users.update', function () {
    $target = User::factory()->create(['name' => 'Old']);
    $this->actingAs(User::factory()->create());

    $this->put("/iam/users/{$target->id}", ['name' => 'Hacked', 'email' => $target->email])
        ->assertForbidden();

    expect($target->refresh()->name)->toBe('Old');
});

it('updates name, email and roles without changing the password when blank', function () {
    $target = User::factory()->create(['name' => 'Old'])->assignRole('editor');
    $originalPassword = $target->password;
    $admin = User::factory()->create()->givePermissionTo('users.update');

    $this->actingAs($admin)->put("/iam/users/{$target->id}", [
        'name' => 'New',
        'email' => $target->email,
        'roles' => ['manager'],
    ])->assertRedirect();

    $target->refresh();
    expect($target->name)->toBe('New')
        ->and($target->hasRole('manager'))->toBeTrue()
        ->and($target->hasRole('editor'))->toBeFalse()
        ->and($target->password)->toBe($originalPassword);
});

it('updates the password when provided', function () {
    $target = User::factory()->create();
    $admin = User::factory()->create()->givePermissionTo('users.update');

    $this->actingAs($admin)->put("/iam/users/{$target->id}", [
        'name' => $target->name,
        'email' => $target->email,
        'password' => 'brand-new-password',
    ])->assertRedirect();

    expect(Hash::check('brand-new-password', $target->refresh()->password))->toBeTrue();
});
