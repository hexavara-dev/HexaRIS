<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('audit.view', 'web');
    $this->withoutVite();
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->user = User::factory()->create()->givePermissionTo('audit.view');

    AuditActivity::query()->delete(); // remove the factory-user's own audit rows
});

it('filters by date_from', function () {
    AuditActivity::create(['log_name' => 'audit', 'description' => 'recent', 'event' => 'created']);
    $old = AuditActivity::create(['log_name' => 'audit', 'description' => 'old', 'event' => 'created']);
    DB::table('activity_log')
        ->where('id', $old->id)
        ->update(['created_at' => now()->subDays(5)->toDateTimeString()]);

    $today = now()->toDateString();

    $this->actingAs($this->user)
        ->get("/audit?date_from={$today}")
        ->assertInertia(fn (Assert $page) => $page->has('activities.data', 1));
});

it('filters by causer_id', function () {
    AuditActivity::create([
        'log_name' => 'audit',
        'description' => 'by user',
        'event' => 'created',
        'causer_type' => User::class,
        'causer_id' => (string) $this->user->id,
    ]);

    AuditActivity::create([
        'log_name' => 'audit',
        'description' => 'no causer',
        'event' => 'updated',
    ]);

    $this->actingAs($this->user)
        ->get("/audit?causer_id={$this->user->id}")
        ->assertInertia(fn (Assert $page) => $page->has('activities.data', 1));
});
