<?php

use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
});

it('shows the route inventory to an authenticated user', function () {
    $this->actingAs(User::factory()->create())
        ->get('/docs/routes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('docs/routes')->has('routes'));
});

it('redirects a guest', function () {
    $this->get('/docs/routes')->assertRedirect('/login');
});

it('includes the FormRequest body schema in the routes prop', function () {
    $this->actingAs(User::factory()->create())
        ->get('/docs/routes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docs/routes')
            ->where('routes', fn (Collection $routes) => $routes->contains(
                fn ($r) => ($r['name'] ?? null) === 'iam.users.store'
                    && is_array($r['body'] ?? null)
                    && array_key_exists('name', $r['body'])
            ))
            ->etc()
        );
});
