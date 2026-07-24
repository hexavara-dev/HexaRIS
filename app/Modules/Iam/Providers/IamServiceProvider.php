<?php

namespace App\Modules\Iam\Providers;

use Illuminate\Contracts\Auth\Access\Authorizable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class IamServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::before(function (Authorizable $user): ?bool {
            return $user instanceof Model && method_exists($user, 'hasRole') && $user->hasRole('super-admin') ? true : null;
        });
    }
}
