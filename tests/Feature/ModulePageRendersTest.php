<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

/**
 * Regression for the Vite manifest bug: namespaced module pages (e.g. "Iam::pages/users/Index")
 * must NOT be eagerly @vite()'d in app.blade.php — they are resolved lazily by the Inertia glob
 * resolver. Without the fix, every module page returns a 500 ViteException at runtime.
 *
 * This test renders a module page through the REAL Vite directive (no withoutVite()), so it needs
 * the built manifest — CI runs `npm run build` before the suite; locally, build first or it skips.
 */
beforeEach(function () {
    if (! file_exists(public_path('build/manifest.json'))) {
        $this->markTestSkipped('Run `npm run build` first — this test renders through the real Vite manifest.');
    }
});

it('renders a namespaced module page without a Vite manifest 500', function () {
    Role::findOrCreate('super-admin', 'web');
    $admin = User::factory()->create()->assignRole('super-admin');

    $this->actingAs($admin)->get('/iam/users')->assertOk();
    $this->actingAs($admin)->get('/iam/roles')->assertOk();
    $this->actingAs($admin)->get('/audit')->assertOk();
});
