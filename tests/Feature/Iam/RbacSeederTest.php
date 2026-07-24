<?php

use App\Modules\Iam\Database\Seeders\RbacSeeder;
use Spatie\Permission\Models\Role;

it('seeds the super-admin role idempotently', function () {
    (new RbacSeeder)->run();
    (new RbacSeeder)->run();

    expect(Role::where('name', 'super-admin')->count())->toBe(1);
});
