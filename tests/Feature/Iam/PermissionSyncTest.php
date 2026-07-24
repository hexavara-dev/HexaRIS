<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Spatie\Permission\Models\Permission;

it('forbids syncing without the permissions.sync permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/iam/permissions/sync')
        ->assertForbidden();
});

it('syncs declared permissions, redirects, and audits the action', function () {
    Permission::findOrCreate('permissions.sync', 'web');

    $user = User::factory()->create();
    $user->givePermissionTo('permissions.sync');

    $this->actingAs($user)
        ->post('/iam/permissions/sync')
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Permission::where('name', 'users.viewAny')->exists())->toBeTrue();

    expect(AuditActivity::where('event', 'permissions.synced')->exists())->toBeTrue();
});
