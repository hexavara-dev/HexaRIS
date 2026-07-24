<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.delete', 'web');
});

it('forbids deleting without users.delete', function () {
    $target = User::factory()->create();
    $this->actingAs(User::factory()->create());

    $this->delete("/iam/users/{$target->id}")->assertForbidden();
    expect(User::whereKey($target->id)->exists())->toBeTrue();
});

it('deletes another user', function () {
    $target = User::factory()->create();
    $admin = User::factory()->create()->givePermissionTo('users.delete');

    $this->actingAs($admin)->delete("/iam/users/{$target->id}")->assertRedirect();
    expect(User::whereKey($target->id)->exists())->toBeFalse();
});

it('refuses to delete your own account', function () {
    $admin = User::factory()->create()->givePermissionTo('users.delete');

    $this->actingAs($admin)->delete("/iam/users/{$admin->id}")->assertRedirect();
    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});
