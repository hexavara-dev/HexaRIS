<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('reimburse.viewAny', 'web');
});

it('forbids users without reimburse.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/payroll/reimburse')->assertForbidden();
});

it('renders the reimburse page for users with reimburse.viewAny', function () {
    $admin = User::factory()->create()->givePermissionTo('reimburse.viewAny');

    $this->actingAs($admin)
        ->get('/payroll/reimburse')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payroll::pages/Reimburse'));
});
