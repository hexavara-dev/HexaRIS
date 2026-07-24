<?php

namespace App\Modular;

use App\Modular\Console\MakeModuleCommand;
use App\Modular\Console\SyncPermissionsCommand;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ModuleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ModuleRegistry::class, fn () => new ModuleRegistry(app_path('Modules')));

        $this->app->singleton(
            PermissionRegistry::class,
            fn ($app) => PermissionRegistry::fromModules($app->make(ModuleRegistry::class)),
        );

        foreach ($this->registry()->all() as $module) {
            $provider = $module->providerClass();
            if (class_exists($provider)) {
                $this->app->register($provider);
            }
        }

        $this->commands([
            MakeModuleCommand::class,
            SyncPermissionsCommand::class,
        ]);
    }

    public function boot(): void
    {
        foreach ($this->registry()->all() as $module) {
            $this->bootModule($module);
        }
    }

    private function bootModule(Module $module): void
    {
        if (is_dir($module->path('Database/Migrations'))) {
            $this->loadMigrationsFrom($module->path('Database/Migrations'));
        }

        if (is_file($module->path('routes/web.php'))) {
            Route::middleware('web')->group($module->path('routes/web.php'));
        }

        if (is_file($module->path('routes/api.php'))) {
            Route::middleware('api')->prefix('api')->group($module->path('routes/api.php'));
        }
    }

    private function registry(): ModuleRegistry
    {
        return $this->app->make(ModuleRegistry::class);
    }
}
