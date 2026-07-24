<?php

namespace App\Modules\Iam\Database\Seeders;

use App\Modules\Iam\Models\Role;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        Role::findOrCreate('super-admin', 'web');
    }
}
