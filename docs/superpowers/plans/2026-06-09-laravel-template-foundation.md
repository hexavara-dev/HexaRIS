# Laravel Template — Foundation & Module System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Laravel 12.61 (latest stable; Laravel 13 not yet released) + Inertia React project with a custom self-contained module system (auto-discovery, per-module routes/migrations/permissions/React pages), a `module:make` generator, a validating `permission:sync` command, and quality gates.

**Architecture:** A root `App\Modular\ModuleServiceProvider` discovers every `app/Modules/*/module.json`, then auto-loads each module's routes, migrations, permissions, and own service provider — so a module folder is a portable, copy-paste unit. A Vite glob + custom Inertia resolver loads each module's React pages under a `Name::pages/...` namespace. Permissions are declared per-module and reconciled into the DB by `permission:sync`, which enforces the `<resource>.<action>` naming convention.

**Tech Stack:** Laravel 13, Inertia v2 + React 19 + TypeScript (official React starter kit), Tailwind + shadcn/ui, Pest, spatie/laravel-permission, spatie/laravel-activitylog, spatie/laravel-data, dedoc/scramble, Larastan, Pint.

---

## File Structure

Module-system infrastructure (lives in `app/Modular/`, autoloaded by the default `App\` PSR-4 map):

- `app/Modular/Module.php` — value object: parsed `module.json` (name, alias, version, deps, path) + path/namespace helpers.
- `app/Modular/ModuleRegistry.php` — discovers and caches `Module` objects from a base path.
- `app/Modular/PermissionRegistry.php` — collects per-module declared permissions; validates `<resource>.<action>`.
- `app/Modular/ModuleServiceProvider.php` — registers singletons + sub-providers + commands; boots routes/migrations.
- `app/Modular/Console/MakeModuleCommand.php` — `module:make` generator (engine behind the future `create-module` skill).
- `app/Modular/Console/SyncPermissionsCommand.php` — `permission:sync` with format validation.
- `bootstrap/providers.php` — register `ModuleServiceProvider` (modify).
- `resources/js/app.tsx` — Inertia resolver: namespace-aware module page resolution (modify).
- `app/Modules/.gitkeep` — ensures the modules dir is tracked.

Each generated module (`app/Modules/<Name>/`) uses **PascalCase** internal directories (`Http/`, `Models/`, `Database/Migrations/`, …) so everything is PSR-4 clean under the `App\` map. Migrations are path-loaded, so their casing is irrelevant, but we keep them under `Database/Migrations/` for consistency.

> **Naming note:** the spec sketched lowercase `database/{...}`. We use PascalCase `Database/{Migrations,Seeders,Factories}` in the real implementation so factory/seeder classes (which need autoloading) resolve under `App\Modules\<Name>\Database\…` without an extra composer entry. This is the one deliberate deviation from the spec sketch.

---

## Task 1: Scaffold Laravel 13 + React starter kit

**Files:**
- Create: entire Laravel skeleton in `/Users/ersad/Code/laravel-template` (preserving existing `docs/` and `.git`)

- [ ] **Step 1: Scaffold into a temp dir, then merge in**

The target dir already contains `docs/` and `.git`, so `composer create-project` (which needs an empty dir) is run elsewhere and merged.

```bash
cd /Users/ersad/Code
composer create-project laravel/react-starter-kit laravel-template-scaffold
rsync -a --exclude='.git' laravel-template-scaffold/ laravel-template/
rm -rf laravel-template-scaffold
```

> **Fallback** if `laravel/react-starter-kit` is not resolvable: `composer global require laravel/installer` then `cd /Users/ersad/Code && laravel new laravel-template-scaffold --react --no-interaction` and merge as above.

- [ ] **Step 2: Install JS deps and verify the app boots**

```bash
cd /Users/ersad/Code/laravel-template
cp -n .env.example .env
php artisan key:generate
npm install
```

- [ ] **Step 3: Confirm Laravel 13 and run the default test suite**

Run: `php artisan --version`
Expected: `Laravel Framework 13.x.x`

Run: `php artisan test`
Expected: PASS (starter kit's default tests green)

- [ ] **Step 4: Commit**

```bash
cd /Users/ersad/Code/laravel-template
git add -A
git commit -m "feat: scaffold Laravel 13 + React starter kit"
```

---

## Task 2: Install and configure core packages

**Files:**
- Modify: `composer.json` (via composer require)
- Create: spatie permission + activitylog migrations (published)
- Modify: `app/Models/User.php` (add `HasRoles`)

- [ ] **Step 1: Require runtime + dev packages**

```bash
cd /Users/ersad/Code/laravel-template
composer require spatie/laravel-permission spatie/laravel-activitylog spatie/laravel-data dedoc/scramble
composer require --dev larastan/larastan pestphp/pest pestphp/pest-plugin-laravel laravel/pint
```

> Pest may already be present from the starter kit; composer will no-op if so.

- [ ] **Step 2: Publish migrations and config**

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --tag="activitylog-migrations"
```

- [ ] **Step 3: Add `HasRoles` to the User model**

In `app/Models/User.php`, add the trait import and use it on the class:

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;
    // ... existing traits/body unchanged
}
```

- [ ] **Step 4: Migrate and verify**

Run: `php artisan migrate`
Expected: permission tables (`roles`, `permissions`, …) and `activity_log` created, no errors.

Run: `php artisan vendor:publish --provider="Spatie\LaravelData\LaravelDataServiceProvider" --tag=data-config` (optional config)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: install RBAC, activitylog, data, scramble, and dev tooling"
```

---

## Task 3: Quality gates (Pint + Larastan + Pest + `composer check`)

**Files:**
- Create: `phpstan.neon`
- Modify: `composer.json` (scripts)
- Create: `tests/Unit/SanityTest.php`

- [ ] **Step 1: Configure Larastan**

Create `phpstan.neon`:

```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    paths:
        - app
    level: 6
    excludePaths:
        - app/Modules/*/Database/Migrations/*
```

- [ ] **Step 2: Add `check` scripts to composer.json**

In `composer.json`, add under `"scripts"`:

```json
"scripts": {
    "pint": "pint --test",
    "stan": "phpstan analyse --memory-limit=512M",
    "test": "pest",
    "check": [
        "@pint",
        "@stan",
        "@test"
    ]
}
```

- [ ] **Step 3: Write a sanity test**

Create `tests/Unit/SanityTest.php`:

```php
<?php

test('the test harness runs', function () {
    expect(true)->toBeTrue();
});
```

- [ ] **Step 4: Run the full gate**

Run: `composer check`
Expected: Pint clean, PHPStan "No errors", Pest green.

> If Pint reports style issues, run `vendor/bin/pint` (without `--test`) to auto-fix, then re-run `composer check`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add composer check quality gate (pint, larastan, pest)"
```

---

## Task 4: `Module` value object

**Files:**
- Create: `app/Modular/Module.php`
- Test: `tests/Unit/Modular/ModuleTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/Modular/ModuleTest.php`:

```php
<?php

use App\Modular\Module;

it('builds a module from a manifest', function () {
    $module = Module::fromManifest([
        'name' => 'Blog',
        'alias' => 'blog',
        'version' => '1.2.0',
        'description' => 'Blog module',
        'dependencies' => ['users'],
    ], '/tmp/Blog');

    expect($module->name)->toBe('Blog')
        ->and($module->alias)->toBe('blog')
        ->and($module->version)->toBe('1.2.0')
        ->and($module->dependencies)->toBe(['users'])
        ->and($module->namespace())->toBe('App\\Modules\\Blog')
        ->and($module->providerClass())->toBe('App\\Modules\\Blog\\Providers\\BlogServiceProvider')
        ->and($module->path('routes/web.php'))->toBe('/tmp/Blog/routes/web.php');
});

it('throws when a required manifest key is missing', function () {
    Module::fromManifest(['alias' => 'blog'], '/tmp/Blog');
})->throws(InvalidArgumentException::class);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Unit/Modular/ModuleTest.php`
Expected: FAIL with "Class App\Modular\Module not found".

- [ ] **Step 3: Implement `Module`**

Create `app/Modular/Module.php`:

```php
<?php

namespace App\Modular;

use InvalidArgumentException;

final class Module
{
    /**
     * @param array<int,string> $dependencies
     */
    public function __construct(
        public readonly string $name,
        public readonly string $alias,
        public readonly string $version,
        public readonly string $description,
        public readonly array $dependencies,
        public readonly string $path,
    ) {}

    /**
     * @param array<string,mixed> $data
     */
    public static function fromManifest(array $data, string $path): self
    {
        foreach (['name', 'alias', 'version'] as $key) {
            if (empty($data[$key])) {
                throw new InvalidArgumentException("Module manifest at {$path} is missing required key: {$key}");
            }
        }

        return new self(
            name: $data['name'],
            alias: $data['alias'],
            version: $data['version'],
            description: $data['description'] ?? '',
            dependencies: $data['dependencies'] ?? [],
            path: $path,
        );
    }

    public function namespace(): string
    {
        return "App\\Modules\\{$this->name}";
    }

    public function providerClass(): string
    {
        return $this->namespace()."\\Providers\\{$this->name}ServiceProvider";
    }

    public function path(string $append = ''): string
    {
        return $append === '' ? $this->path : $this->path.'/'.ltrim($append, '/');
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Unit/Modular/ModuleTest.php`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Modular/Module.php tests/Unit/Modular/ModuleTest.php
git commit -m "feat(modular): add Module value object"
```

---

## Task 5: `ModuleRegistry` (discovery)

**Files:**
- Create: `app/Modular/ModuleRegistry.php`
- Test: `tests/Unit/Modular/ModuleRegistryTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/Modular/ModuleRegistryTest.php`:

```php
<?php

use App\Modular\ModuleRegistry;

beforeEach(function () {
    $this->base = sys_get_temp_dir().'/modular-test-'.uniqid();
    mkdir($this->base.'/Blog', 0777, true);
    file_put_contents($this->base.'/Blog/module.json', json_encode([
        'name' => 'Blog',
        'alias' => 'blog',
        'version' => '1.0.0',
    ]));
});

afterEach(function () {
    exec('rm -rf '.escapeshellarg($this->base));
});

it('discovers modules from manifests', function () {
    $registry = new ModuleRegistry($this->base);

    expect($registry->all())->toHaveCount(1)
        ->and($registry->find('blog')?->name)->toBe('Blog');
});

it('returns an empty collection when the base path is missing', function () {
    expect((new ModuleRegistry('/no/such/path'))->all())->toBeEmpty();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Unit/Modular/ModuleRegistryTest.php`
Expected: FAIL with "Class App\Modular\ModuleRegistry not found".

- [ ] **Step 3: Implement `ModuleRegistry`**

Create `app/Modular/ModuleRegistry.php`:

```php
<?php

namespace App\Modular;

use Illuminate\Support\Collection;

class ModuleRegistry
{
    /** @var Collection<int,Module>|null */
    private ?Collection $modules = null;

    public function __construct(private readonly string $basePath) {}

    /**
     * @return Collection<int,Module>
     */
    public function all(): Collection
    {
        return $this->modules ??= $this->discover();
    }

    public function find(string $alias): ?Module
    {
        return $this->all()->firstWhere('alias', $alias);
    }

    /**
     * @return Collection<int,Module>
     */
    private function discover(): Collection
    {
        if (! is_dir($this->basePath)) {
            return collect();
        }

        return collect(glob($this->basePath.'/*/module.json') ?: [])
            ->map(function (string $manifestPath): Module {
                /** @var array<string,mixed> $data */
                $data = json_decode((string) file_get_contents($manifestPath), true) ?? [];

                return Module::fromManifest($data, dirname($manifestPath));
            })
            ->values();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Unit/Modular/ModuleRegistryTest.php`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Modular/ModuleRegistry.php tests/Unit/Modular/ModuleRegistryTest.php
git commit -m "feat(modular): add ModuleRegistry discovery"
```

---

## Task 6: `PermissionRegistry` (collect + validate)

**Files:**
- Create: `app/Modular/PermissionRegistry.php`
- Test: `tests/Unit/Modular/PermissionRegistryTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/Modular/PermissionRegistryTest.php`:

```php
<?php

use App\Modular\PermissionRegistry;

it('validates the <resource>.<action> name format', function () {
    expect(PermissionRegistry::isValidName('users.view'))->toBeTrue()
        ->and(PermissionRegistry::isValidName('orders.approve'))->toBeTrue()
        ->and(PermissionRegistry::isValidName('users.viewAny'))->toBeTrue()
        ->and(PermissionRegistry::isValidName('Users.view'))->toBeFalse()
        ->and(PermissionRegistry::isValidName('users'))->toBeFalse()
        ->and(PermissionRegistry::isValidName('users view'))->toBeFalse()
        ->and(PermissionRegistry::isValidName('users.'))->toBeFalse();
});

it('dedupes added permissions preserving order', function () {
    $registry = new PermissionRegistry();
    $registry->add(['users.view', 'users.view', 'users.create']);

    expect($registry->all())->toBe(['users.view', 'users.create']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Unit/Modular/PermissionRegistryTest.php`
Expected: FAIL with "Class App\Modular\PermissionRegistry not found".

- [ ] **Step 3: Implement `PermissionRegistry`**

Create `app/Modular/PermissionRegistry.php`:

```php
<?php

namespace App\Modular;

class PermissionRegistry
{
    /** @var array<int,string> */
    private array $permissions = [];

    public static function fromModules(ModuleRegistry $registry): self
    {
        $instance = new self();

        foreach ($registry->all() as $module) {
            $file = $module->path('permissions.php');
            if (is_file($file)) {
                /** @var array<int,string> $declared */
                $declared = require $file;
                $instance->add($declared);
            }
        }

        return $instance;
    }

    /**
     * @param array<int,string> $permissions
     */
    public function add(array $permissions): void
    {
        foreach ($permissions as $permission) {
            $this->permissions[] = $permission;
        }
    }

    /**
     * @return array<int,string>
     */
    public function all(): array
    {
        return array_values(array_unique($this->permissions));
    }

    public static function isValidName(string $name): bool
    {
        return (bool) preg_match('/^[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9]*$/', $name);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Unit/Modular/PermissionRegistryTest.php`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Modular/PermissionRegistry.php tests/Unit/Modular/PermissionRegistryTest.php
git commit -m "feat(modular): add PermissionRegistry with name validation"
```

---

## Task 7: `ModuleServiceProvider` + registration

**Files:**
- Create: `app/Modular/ModuleServiceProvider.php`
- Create: `app/Modules/.gitkeep`
- Modify: `bootstrap/providers.php`
- Test: `tests/Feature/Modular/ModuleServiceProviderTest.php`

- [ ] **Step 1: Ensure the modules directory exists**

```bash
mkdir -p app/Modules && touch app/Modules/.gitkeep
```

- [ ] **Step 2: Write the failing test**

Create `tests/Feature/Modular/ModuleServiceProviderTest.php`:

```php
<?php

use App\Modular\ModuleRegistry;
use App\Modular\PermissionRegistry;

it('binds the module and permission registries as singletons', function () {
    expect(app(ModuleRegistry::class))->toBe(app(ModuleRegistry::class))
        ->and(app(PermissionRegistry::class))->toBeInstanceOf(PermissionRegistry::class);
});

it('points the module registry at app/Modules', function () {
    $registry = app(ModuleRegistry::class);
    // No modules scaffolded yet → empty, but the call must not throw.
    expect($registry->all())->toBeIterable();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Modular/ModuleServiceProviderTest.php`
Expected: FAIL — `ModuleRegistry` is not yet bound (resolution error).

- [ ] **Step 4: Implement the provider**

Create `app/Modular/ModuleServiceProvider.php`:

```php
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
```

> The commands referenced here are created in Tasks 9 and 10. Until then, the `use` imports will reference classes that don't exist yet — **create empty stub classes now** so the provider loads:
>
> `app/Modular/Console/MakeModuleCommand.php` and `app/Modular/Console/SyncPermissionsCommand.php`, each a minimal `Illuminate\Console\Command` subclass with a unique `$signature` (`module:make` / `permission:sync`) and a `handle(): int { return self::SUCCESS; }`. Tasks 9–10 replace the bodies via TDD.

- [ ] **Step 5: Create the command stubs**

Create `app/Modular/Console/SyncPermissionsCommand.php`:

```php
<?php

namespace App\Modular\Console;

use Illuminate\Console\Command;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permission:sync';

    protected $description = 'Sync module-declared permissions into the database';

    public function handle(): int
    {
        return self::SUCCESS;
    }
}
```

Create `app/Modular/Console/MakeModuleCommand.php`:

```php
<?php

namespace App\Modular\Console;

use Illuminate\Console\Command;

class MakeModuleCommand extends Command
{
    protected $signature = 'module:make {name}';

    protected $description = 'Scaffold a new self-contained module';

    public function handle(): int
    {
        return self::SUCCESS;
    }
}
```

- [ ] **Step 6: Register the provider**

In `bootstrap/providers.php`, add `App\Modular\ModuleServiceProvider::class` to the returned array:

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Modular\ModuleServiceProvider::class,
];
```

- [ ] **Step 7: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Modular/ModuleServiceProviderTest.php`
Expected: PASS (2 passed).

- [ ] **Step 8: Commit**

```bash
git add app/Modular bootstrap/providers.php tests/Feature/Modular/ModuleServiceProviderTest.php
git commit -m "feat(modular): register ModuleServiceProvider and command stubs"
```

---

## Task 8: Inertia resolver — namespace-aware module pages

**Files:**
- Modify: `resources/js/app.tsx`

- [ ] **Step 1: Update the Inertia page resolver**

In `resources/js/app.tsx`, replace the `resolve` callback in `createInertiaApp({ ... })` with namespace-aware resolution. The app pages glob stays; a second glob covers module pages, and a `Name::path` page name routes to the module folder:

```tsx
const appPages = import.meta.glob('./pages/**/*.tsx');
const modulePages = import.meta.glob('../../app/Modules/*/resources/js/pages/**/*.tsx');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        if (name.includes('::')) {
            const [moduleName, pagePath] = name.split('::');
            return resolvePageComponent(
                `../../app/Modules/${moduleName}/resources/js/${pagePath}.tsx`,
                modulePages,
            );
        }

        return resolvePageComponent(`./pages/${name}.tsx`, appPages);
    },
    // ...rest of the existing config (setup, progress) unchanged
});
```

> `resolvePageComponent` is already imported in the starter kit's `app.tsx`. Keep that import.

- [ ] **Step 2: Verify the production build compiles**

Run: `npm run build`
Expected: build succeeds with no module-resolution errors. (No module pages exist yet; the globs simply match nothing, which is valid.)

- [ ] **Step 3: Commit**

```bash
git add resources/js/app.tsx
git commit -m "feat(modular): namespace-aware Inertia resolver for module pages"
```

---

## Task 9: Implement `permission:sync`

**Files:**
- Modify: `app/Modular/Console/SyncPermissionsCommand.php`
- Test: `tests/Feature/Modular/SyncPermissionsCommandTest.php`

- [ ] **Step 1: Ensure Feature tests refresh the database**

Confirm `tests/Pest.php` applies `RefreshDatabase` to Feature tests. If not present, add:

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class)->in('Feature');
```

- [ ] **Step 2: Write the failing test**

Create `tests/Feature/Modular/SyncPermissionsCommandTest.php`:

```php
<?php

use App\Modular\PermissionRegistry;
use Spatie\Permission\Models\Permission;

it('syncs declared permissions into the database', function () {
    app()->bind(PermissionRegistry::class, function () {
        $registry = new PermissionRegistry();
        $registry->add(['users.view', 'users.create']);

        return $registry;
    });

    $this->artisan('permission:sync')->assertSuccessful();

    expect(Permission::pluck('name')->all())->toContain('users.view', 'users.create');
});

it('fails loudly on an invalid permission name', function () {
    app()->bind(PermissionRegistry::class, function () {
        $registry = new PermissionRegistry();
        $registry->add(['Bad Name']);

        return $registry;
    });

    $this->artisan('permission:sync')->assertFailed();

    expect(Permission::count())->toBe(0);
});

it('prunes undeclared permissions when --prune is passed', function () {
    Permission::findOrCreate('legacy.remove', 'web');

    app()->bind(PermissionRegistry::class, function () {
        $registry = new PermissionRegistry();
        $registry->add(['users.view']);

        return $registry;
    });

    $this->artisan('permission:sync --prune')->assertSuccessful();

    expect(Permission::pluck('name')->all())
        ->toContain('users.view')
        ->not->toContain('legacy.remove');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Modular/SyncPermissionsCommandTest.php`
Expected: FAIL — the stub returns SUCCESS but creates no permissions, so the assertions fail.

- [ ] **Step 4: Implement the command**

Replace `app/Modular/Console/SyncPermissionsCommand.php` with:

```php
<?php

namespace App\Modular\Console;

use App\Modular\PermissionRegistry;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permission:sync {--prune : Delete permissions no longer declared by any module}';

    protected $description = 'Sync module-declared permissions into the database';

    public function handle(PermissionRegistry $registry): int
    {
        $declared = $registry->all();

        $invalid = array_filter($declared, fn (string $name) => ! PermissionRegistry::isValidName($name));
        if ($invalid !== []) {
            $this->error('Invalid permission names (expected <resource>.<action>): '.implode(', ', $invalid));

            return self::FAILURE;
        }

        foreach ($declared as $name) {
            Permission::findOrCreate($name, 'web');
        }

        if ($this->option('prune')) {
            Permission::whereNotIn('name', $declared)->delete();
        }

        $this->info(count($declared).' permissions synced.');

        return self::SUCCESS;
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Modular/SyncPermissionsCommandTest.php`
Expected: PASS (3 passed).

- [ ] **Step 6: Commit**

```bash
git add app/Modular/Console/SyncPermissionsCommand.php tests/Feature/Modular/SyncPermissionsCommandTest.php tests/Pest.php
git commit -m "feat(modular): implement permission:sync with format validation and prune"
```

---

## Task 10: Implement `module:make` generator

**Files:**
- Modify: `app/Modular/Console/MakeModuleCommand.php`
- Test: `tests/Feature/Modular/MakeModuleCommandTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Modular/MakeModuleCommandTest.php`:

```php
<?php

use Illuminate\Support\Facades\File;

afterEach(function () {
    File::deleteDirectory(app_path('Modules/Sample'));
});

it('scaffolds a self-contained module skeleton', function () {
    File::deleteDirectory(app_path('Modules/Sample'));

    $this->artisan('module:make', ['name' => 'sample'])->assertSuccessful();

    $base = app_path('Modules/Sample');

    expect(File::exists("{$base}/module.json"))->toBeTrue()
        ->and(File::exists("{$base}/README.md"))->toBeTrue()
        ->and(File::exists("{$base}/Providers/SampleServiceProvider.php"))->toBeTrue()
        ->and(File::exists("{$base}/routes/web.php"))->toBeTrue()
        ->and(File::exists("{$base}/routes/api.php"))->toBeTrue()
        ->and(File::exists("{$base}/permissions.php"))->toBeTrue()
        ->and(File::isDirectory("{$base}/resources/js/pages"))->toBeTrue()
        ->and(File::isDirectory("{$base}/Database/Migrations"))->toBeTrue();

    $manifest = json_decode(File::get("{$base}/module.json"), true);
    expect($manifest['name'])->toBe('Sample')
        ->and($manifest['alias'])->toBe('sample');
});

it('refuses to overwrite an existing module', function () {
    $this->artisan('module:make', ['name' => 'Sample'])->assertSuccessful();
    $this->artisan('module:make', ['name' => 'Sample'])->assertFailed();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Modular/MakeModuleCommandTest.php`
Expected: FAIL — stub creates no files.

- [ ] **Step 3: Implement the generator**

Replace `app/Modular/Console/MakeModuleCommand.php` with:

```php
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

        $webRoutes = "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\n// {$name} web routes\n";
        $apiRoutes = "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\n// {$name} api routes\n";
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Modular/MakeModuleCommandTest.php`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Modular/Console/MakeModuleCommand.php tests/Feature/Modular/MakeModuleCommandTest.php
git commit -m "feat(modular): implement module:make generator"
```

---

## Task 11: End-to-end dogfood — generate, register, verify

**Files:**
- Temporary: `app/Modules/Example/` (created then removed)

- [ ] **Step 1: Generate a module**

Run: `php artisan module:make Example`
Expected: "Module Example created at app/Modules/Example."

- [ ] **Step 2: Declare a permission and a route**

Edit `app/Modules/Example/permissions.php`:

```php
<?php

return [
    'examples.view',
];
```

Edit `app/Modules/Example/routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/example/ping', fn () => response()->json(['module' => 'Example']))
    ->name('example.ping');
```

- [ ] **Step 3: Verify auto-registration of the route**

Run: `php artisan route:list --name=example`
Expected: the `example.ping` route is listed — proving the module's routes were auto-loaded with no manual wiring.

- [ ] **Step 4: Verify permission sync picks up the module**

Run: `php artisan migrate --force && php artisan permission:sync`
Expected: output includes `examples.view` among synced permissions (at least "1 permissions synced." or more).

Run: `php artisan tinker --execute="echo Spatie\Permission\Models\Permission::where('name','examples.view')->exists() ? 'yes' : 'no';"`
Expected: `yes`

- [ ] **Step 5: Remove the throwaway module and confirm clean state**

```bash
rm -rf app/Modules/Example
php artisan route:list --name=example
```
Expected: no `example.ping` route (module removal = feature removal, proving portability/isolation).

- [ ] **Step 6: Run the full gate and commit the proof note**

Run: `composer check`
Expected: all green.

```bash
git add -A
git commit -m "test(modular): dogfood module generation, auto-registration, permission sync"
```

---

## Self-Review

**Spec coverage (foundation slice):**
- Laravel 13 + React starter kit → Task 1 ✅
- Core packages (permission, activitylog, data, scramble) + dev tooling → Task 2 ✅
- Quality gates (`composer check`) → Task 3 ✅
- Module value object / discovery → Tasks 4–5 ✅
- Per-module permissions + `<resource>.<action>` validation → Tasks 6, 9 ✅
- Auto-registration of routes/migrations/sub-providers → Task 7 ✅
- Namespaced module React pages (Vite glob + resolver) → Task 8 ✅
- `module:make` generator (engine behind `create-module` skill) → Task 10 ✅
- End-to-end portability proof → Task 11 ✅

**Deferred to later plans (intentionally, not gaps):**
- `AuditLogger` (atomic/async), Eloquent + Query Builder paths, Audit Viewer → **Plan 2**
- User/Profile + RBAC management UI modules → **Plan 2**
- The 9 Claude Code skills, CLAUDE.md/conventions, Scramble doc polish → **Plan 3**

**Type consistency:** `Module`, `ModuleRegistry::all()/find()`, `PermissionRegistry::all()/add()/isValidName()/fromModules()`, `permission:sync`, `module:make` signatures are referenced identically across tasks. ✅

**Placeholder scan:** No TBD/TODO; every code step contains complete code. The only intentional stubs (Task 7 commands) are explicitly replaced by full implementations in Tasks 9–10. ✅

---

## Roadmap — Plans 2 & 3 (written after Plan 1 lands)

### Plan 2 — Audit Logging + Built-in Modules
- `App\Audit\AuditLogger` fluent service with `::atomic()` / `::async()` factories; `subject()`, `before()`, `after()`, `event()`, `log()`. Atomic writes within the current DB transaction; async dispatches a queued `WriteAuditLog` job. Both persist via the spatie `Activity` model.
- `LogsActivity` integration trait for Eloquent models (auto-capture) + documented Query Builder pattern.
- Auth event subscriber → `auth.login` / `auth.logout` / `auth.failed` audit entries.
- **Audit** module: read-only React viewer with filters + before/after diff.
- **Users** module: CRUD via the soon-to-exist `add-resource` pattern, Profile pages.
- **Rbac** module: Role & Permission management UI; `Gate::before()` super-admin bypass.

### Plan 3 — Skill Pipeline + Docs
- `.claude/skills/` for: `feature-brainstorm`, `plan-feature`, `create-module` (wraps `module:make`), `add-resource`, `add-action`, `add-audit`, `add-permission`, `review-module`, `finish-feature`.
- `add-resource` / `add-action` as artisan generators (`module:resource`, `module:action`) wrapped by skills, TDD-first output.
- `CLAUDE.md` + `docs/conventions.md` (module layout, permission format, audit modes).
- Scramble config + `/docs/api` published; `composer check` extended with JS lint/types; `review-module` checklist.
