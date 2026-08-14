<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('payroll.update', 'web');
});

it('forbids users without payroll.update', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/payroll/settings')->assertForbidden();
});

it('renders the payroll settings page for users with payroll.update', function () {
    $admin = User::factory()->create()->givePermissionTo('payroll.update');

    $this->actingAs($admin)
        ->get('/payroll/settings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payroll::pages/Settings'));
});
