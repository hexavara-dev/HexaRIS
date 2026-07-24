<?php

namespace App\Modular\Console;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

class MakeModuleCommand extends Command
{
    protected $signature = 'module:make {name : StudlyCase module name}';

    protected $description = 'Scaffold a new self-contained module';

    public function handle(Filesystem $files): int
    {
        $name = Str::studly($this->argument('name'));
        $alias = Str::kebab($name);
        $base = app_path("Modules/{$name}");

        if ($files->isDirectory($base)) {
            $this->error("Module {$name} already exists.");

            return self::FAILURE;
        }

        foreach ([
            'Http/Controllers', 'Http/Requests', 'Models', 'Actions',
            'Services', 'Policies', 'Data', 'Providers', 'routes',
            'Database/Migrations', 'Database/Seeders', 'Database/Factories',
            'resources/js/pages', 'resources/js/components',
            'tests/Feature', 'tests/Unit',
        ] as $dir) {
            $files->ensureDirectoryExists("{$base}/{$dir}");
        }

        foreach ($this->stubs($name, $alias) as $relative => $contents) {
            $files->put("{$base}/{$relative}", $contents);
        }

        $this->info("Module {$name} created at app/Modules/{$name}.");
        $this->line('Next: php artisan permission:sync');

        return self::SUCCESS;
    }

    /**
     * @return array<string,string>
     */
    private function stubs(string $name, string $alias): array
    {
        $manifest = json_encode([
            'name' => $name,
            'alias' => $alias,
            'version' => '1.0.0',
            'description' => "{$name} module",
            'dependencies' => [],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";

        $provider = <<<PHP
<?php

namespace App\\Modules\\{$name}\\Providers;

use Illuminate\\Support\\ServiceProvider;

class {$name}ServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}

PHP;

        $webRoutes = "<?php\n\n// {$name} web routes\n";
        $apiRoutes = "<?php\n\n// {$name} api routes\n";
        $permissions = "<?php\n\nreturn [\n    // '{$alias}.view',\n];\n";
        $readme = "# {$name}\n\nSelf-contained `{$name}` module.\n\n## Permissions\n\n_None yet._\n\n## Routes\n\n_None yet._\n";

        return [
            'module.json' => $manifest,
            'README.md' => $readme,
            "Providers/{$name}ServiceProvider.php" => $provider,
            'routes/web.php' => $webRoutes,
            'routes/api.php' => $apiRoutes,
            'permissions.php' => $permissions,
            'resources/js/pages/.gitkeep' => '',
            'Database/Migrations/.gitkeep' => '',
        ];
    }
}
