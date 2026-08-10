<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('payroll.viewAny', 'web');
});

it('forbids users without payroll.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/payroll/data')->assertForbidden();
});

it('renders the payroll data page for users with payroll.viewAny', function () {
    $admin = User::factory()->create()->givePermissionTo('payroll.viewAny');

    $this->actingAs($admin)
        ->get('/payroll/data')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payroll::pages/Index'));
});
