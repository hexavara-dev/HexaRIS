<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Iam\Database\Seeders\RbacSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reconcile every module-declared permission into the database.
        Artisan::call('permission:sync');

        // Create the super-admin role (bypasses all authorization via Gate::before).
        $this->call(RbacSeeder::class);

        // Idempotent: safe to re-run db:seed (e.g. after adding a module's permissions).
        if (! User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        // A ready-to-use admin account (local credentials: admin@example.com / password).
        $admin = User::where('email', 'admin@example.com')->first()
            ?? User::factory()->create(['name' => 'Admin', 'email' => 'admin@example.com']);
        $admin->assignRole('super-admin');
    }
}
