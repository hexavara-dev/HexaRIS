<?php

use App\Support\Docs\RouteInventory;
use Tests\TestCase;

uses(TestCase::class);

it('lists app routes with permission, excluding vendor routes', function () {
    $entries = app(RouteInventory::class)->entries();
    $names = collect($entries)->pluck('name')->filter()->all();

    expect($names)->toContain('iam.users.index');
    expect($names)->not->toContain('scramble.docs.ui'); // vendor route excluded

    $store = collect($entries)->firstWhere('name', 'iam.users.store');
    expect($store['permission'])->toBe('users.create'); // parsed from can: middleware
});
