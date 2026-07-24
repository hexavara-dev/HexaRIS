<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('audit.view', 'web');
    $this->withoutVite();
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->user = User::factory()->create()->givePermissionTo('audit.view');

    AuditActivity::query()->delete(); // remove the factory-user's own audit rows

    AuditActivity::create(['log_name' => 'audit', 'description' => 'a', 'event' => 'created', 'properties' => ['module' => 'Orders']]);
    AuditActivity::create(['log_name' => 'audit', 'description' => 'b', 'event' => 'updated', 'properties' => ['module' => 'Users']]);
});

it('filters by event', function () {
    $this->actingAs($this->user)
        ->get('/audit?event=created')
        ->assertInertia(fn (Assert $page) => $page->has('activities.data', 1));
});

it('filters by module', function () {
    $this->actingAs($this->user)
        ->get('/audit?module=Users')
        ->assertInertia(fn (Assert $page) => $page->has('activities.data', 1));
});
