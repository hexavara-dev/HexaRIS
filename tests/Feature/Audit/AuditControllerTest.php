<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('audit.view', 'web');
    $this->withoutVite();
    config(['inertia.testing.ensure_pages_exist' => false]);
});

it('forbids users without the audit.view permission', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/audit')->assertForbidden();
});

it('renders the audit viewer for permitted users', function () {
    $user = User::factory()->create()->givePermissionTo('audit.view');
    AuditActivity::query()->delete();
    AuditActivity::create([
        'log_name' => 'audit',
        'description' => 'Order updated',
        'event' => 'updated',
        'subject_type' => 'orders',
        'subject_id' => 1,
        'properties' => ['module' => 'Orders'],
    ]);

    $this->actingAs($user)
        ->get('/audit')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Audit::pages/Index')
            ->has('activities.data', 1)
            ->has('filters')
        );
});
