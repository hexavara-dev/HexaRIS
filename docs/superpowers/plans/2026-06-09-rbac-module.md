# RBAC Management Module Implementation Plan (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A self-contained `Rbac` module to manage Roles and view the module-declared Permission catalog, with a `super-admin` role that bypasses all authorization, all behind `can:` permission checks.

**Architecture:** Built on the Plan 1 module system (`module:make`, `permission:sync`, namespaced Inertia pages). Roles are managed via a resourceful controller using spatie/laravel-permission; permissions are read-only (they come from each module's `permissions.php` via `permission:sync`). The module's own service provider registers a `Gate::before` super-admin bypass. Role CRUD writes are audited automatically via the existing `App\Audit\Concerns\IsAudited` trait on a thin Role subclass.

**Tech Stack:** Laravel 12.61, spatie/laravel-permission 8, spatie/laravel-data, Inertia React + TypeScript, Pest. Gate: `composer check`. Workflow: feature branch → PR → squash-merge (Lefthook + CI active).

---

## Prerequisites (in place)

- Module system: `php artisan module:make`, `permission:sync` (validates `<resource>.<action>`), namespaced Inertia resolver (`Name::pages/Foo`).
- `App\Models\User` uses `HasRoles` (spatie) and `IsAudited`.
- `App\Audit\Concerns\IsAudited` trait available for auditing.
- spatie permission tables migrated; permissions currently: `audit.view` (+ a stale `examples.view` in local dev only).

> **Workflow reminder:** Work on `feat/rbac-module`. Lefthook pre-push blocks direct pushes to `main`; land via PR + squash-merge. Run `composer check` before each commit.

---

## File Structure

```
app/Modules/Rbac/                                  # scaffolded by module:make Rbac
├── permissions.php                                # roles.viewAny/create/update/delete, permissions.viewAny
├── Models/Role.php                                # spatie Role subclass + IsAudited
├── Providers/RbacServiceProvider.php              # Gate::before super-admin bypass (fill the stub)
├── Http/
│   ├── Controllers/RoleController.php             # index/create/store/edit/update/destroy
│   ├── Controllers/PermissionController.php        # index (read-only catalog)
│   └── Requests/{StoreRoleRequest,UpdateRoleRequest}.php
├── Data/RoleData.php                              # DTO: id, name, permissions[]
├── Database/Seeders/RbacSeeder.php                # creates the super-admin role
├── routes/web.php
├── resources/js/pages/
│   ├── roles/Index.tsx
│   ├── roles/Form.tsx
│   └── permissions/Index.tsx
└── README.md

database/seeders/DatabaseSeeder.php                # call RbacSeeder (modify)
```

Route map (all under `web` + `auth`):
- `GET  /rbac/roles`              `roles.index`   (can:roles.viewAny)
- `GET  /rbac/roles/create`       `roles.create`  (can:roles.create)
- `POST /rbac/roles`              `roles.store`   (can:roles.create)
- `GET  /rbac/roles/{role}/edit`  `roles.edit`    (can:roles.update)
- `PUT  /rbac/roles/{role}`       `roles.update`  (can:roles.update)
- `DELETE /rbac/roles/{role}`     `roles.destroy` (can:roles.delete)
- `GET  /rbac/permissions`        `permissions.index` (can:permissions.viewAny)

---

## Task 1: Scaffold module, permissions, Role model, super-admin gate

**Files:**
- Generate: `app/Modules/Rbac/` (via `php artisan module:make Rbac`)
- Modify: `app/Modules/Rbac/permissions.php`
- Create: `app/Modules/Rbac/Models/Role.php`
- Modify: `app/Modules/Rbac/Providers/RbacServiceProvider.php`
- Test: `tests/Feature/Rbac/SuperAdminGateTest.php`

- [ ] **Step 1: Scaffold**

```bash
php artisan module:make Rbac
```

- [ ] **Step 2: Declare permissions** — replace `app/Modules/Rbac/permissions.php`:

```php
<?php

return [
    'roles.viewAny',
    'roles.create',
    'roles.update',
    'roles.delete',
    'permissions.viewAny',
];
```

- [ ] **Step 3: Create the audited Role model** — `app/Modules/Rbac/Models/Role.php`:

```php
<?php

namespace App\Modules\Rbac\Models;

use App\Audit\Concerns\IsAudited;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use IsAudited;
}
```

- [ ] **Step 4: Write the failing test** — `tests/Feature/Rbac/SuperAdminGateTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

it('grants every ability to a super-admin', function () {
    Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->assignRole('super-admin');

    expect($user->can('roles.create'))->toBeTrue()
        ->and($user->can('anything.at.all'))->toBeTrue();
});

it('does not grant abilities to a normal user', function () {
    $user = User::factory()->create();

    expect($user->can('roles.create'))->toBeFalse();
});
```

- [ ] **Step 5: Run** — `vendor/bin/pest tests/Feature/Rbac/SuperAdminGateTest.php` → FAIL (super-admin has no gate bypass yet, so `can('anything.at.all')` is false).

- [ ] **Step 6: Register the gate** — replace the body of `app/Modules/Rbac/Providers/RbacServiceProvider.php` `boot()`:

```php
<?php

namespace App\Modules\Rbac\Providers;

use Illuminate\Contracts\Auth\Access\Authorizable;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class RbacServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::before(function (Authorizable $user): ?bool {
            return method_exists($user, 'hasRole') && $user->hasRole('super-admin') ? true : null;
        });
    }
}
```

- [ ] **Step 7: Run** — expect PASS (2 passed). Then FULL `composer check` → green.

- [ ] **Step 8: Commit**

```bash
git add app/Modules/Rbac tests/Feature/Rbac/SuperAdminGateTest.php
git commit -m "feat(rbac): scaffold module with super-admin gate and audited Role"
```

---

## Task 2: RoleData DTO + roles index

**Files:**
- Create: `app/Modules/Rbac/Data/RoleData.php`
- Create: `app/Modules/Rbac/Http/Controllers/RoleController.php`
- Modify: `app/Modules/Rbac/routes/web.php`
- Test: `tests/Feature/Rbac/RoleIndexTest.php`

- [ ] **Step 1: Write the failing test** — `tests/Feature/Rbac/RoleIndexTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.viewAny', 'web');
});

it('forbids users without roles.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/rbac/roles')->assertForbidden();
});

it('lists roles for permitted users', function () {
    $role = Role::findOrCreate('editor', 'web');
    $role->givePermissionTo(Permission::findOrCreate('audit.view', 'web'));
    $user = User::factory()->create()->givePermissionTo('roles.viewAny');

    $this->actingAs($user)
        ->get('/rbac/roles')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Rbac::pages/roles/Index')
            ->has('roles', 1)
            ->where('roles.0.name', 'editor')
            ->where('roles.0.permissions.0', 'audit.view')
        );
});
```

- [ ] **Step 2: Run** — FAIL (route + controller missing → 404).

- [ ] **Step 3: Create the DTO** — `app/Modules/Rbac/Data/RoleData.php`:

```php
<?php

namespace App\Modules\Rbac\Data;

use Spatie\LaravelData\Data;
use Spatie\Permission\Models\Role;

class RoleData extends Data
{
    /**
     * @param array<int,string> $permissions
     */
    public function __construct(
        public int $id,
        public string $name,
        public array $permissions,
    ) {}

    public static function fromModel(Role $role): self
    {
        return new self(
            id: $role->id,
            name: $role->name,
            permissions: $role->permissions->pluck('name')->all(),
        );
    }
}
```

- [ ] **Step 4: Create the controller** — `app/Modules/Rbac/Http/Controllers/RoleController.php`:

```php
<?php

namespace App\Modules\Rbac\Http\Controllers;

use App\Modules\Rbac\Data\RoleData;
use App\Modules\Rbac\Models\Role;
use Inertia\Inertia;
use Inertia\Response;

class RoleController
{
    public function index(): Response
    {
        $roles = Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => RoleData::fromModel($role));

        return Inertia::render('Rbac::pages/roles/Index', [
            'roles' => $roles,
        ]);
    }
}
```

- [ ] **Step 5: Define the route** — replace `app/Modules/Rbac/routes/web.php`:

```php
<?php

use App\Modules\Rbac\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('rbac')->name('rbac.')->group(function () {
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('can:roles.viewAny');
});
```

> The route names become `rbac.roles.index` etc. The test asserts the component, not the route name. The `ModuleServiceProvider` already wraps this in the `web` group — do not add `web` here.

- [ ] **Step 6: Run** — `vendor/bin/pest tests/Feature/Rbac/RoleIndexTest.php` → expect PASS (2 passed). Then `composer check` → green.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Rbac/Data/RoleData.php app/Modules/Rbac/Http/Controllers/RoleController.php app/Modules/Rbac/routes/web.php tests/Feature/Rbac/RoleIndexTest.php
git commit -m "feat(rbac): add RoleData DTO and roles index"
```

---

## Task 3: Create + store role

**Files:**
- Create: `app/Modules/Rbac/Http/Requests/StoreRoleRequest.php`
- Modify: `app/Modules/Rbac/Http/Controllers/RoleController.php`
- Modify: `app/Modules/Rbac/routes/web.php`
- Test: `tests/Feature/Rbac/RoleStoreTest.php`

- [ ] **Step 1: Write the failing test** — `tests/Feature/Rbac/RoleStoreTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.create', 'web');
    Permission::findOrCreate('audit.view', 'web');
});

it('forbids creating a role without roles.create', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/rbac/roles', ['name' => 'editor'])->assertForbidden();
});

it('creates a role and syncs its permissions', function () {
    $user = User::factory()->create()->givePermissionTo('roles.create');

    $this->actingAs($user)
        ->post('/rbac/roles', ['name' => 'editor', 'permissions' => ['audit.view']])
        ->assertRedirect();

    $role = Role::where('name', 'editor')->first();
    expect($role)->not->toBeNull()
        ->and($role->permissions->pluck('name')->all())->toBe(['audit.view']);
});

it('rejects a duplicate role name', function () {
    Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.create');

    $this->actingAs($user)
        ->post('/rbac/roles', ['name' => 'editor'])
        ->assertSessionHasErrors('name');
});
```

- [ ] **Step 2: Run** — FAIL (no store route/method).

- [ ] **Step 3: Create the FormRequest** — `app/Modules/Rbac/Http/Requests/StoreRoleRequest.php`:

```php
<?php

namespace App\Modules\Rbac\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route middleware enforces can:roles.create
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
```

- [ ] **Step 4: Add `create` + `store` to the controller** — add these methods and imports to `RoleController`:

```php
// add imports at top:
use App\Modules\Rbac\Http\Requests\StoreRoleRequest;
use Illuminate\Http\RedirectResponse;
use Spatie\Permission\Models\Permission;

// add methods:
public function create(): Response
{
    return Inertia::render('Rbac::pages/roles/Form', [
        'role' => null,
        'permissions' => $this->groupedPermissions(),
    ]);
}

public function store(StoreRoleRequest $request): RedirectResponse
{
    $role = Role::create(['name' => $request->string('name'), 'guard_name' => 'web']);
    $role->syncPermissions($request->input('permissions', []));

    return redirect()->route('rbac.roles.index');
}

/**
 * @return array<string, array<int,string>>
 */
private function groupedPermissions(): array
{
    return Permission::query()
        ->orderBy('name')
        ->pluck('name')
        ->groupBy(fn (string $name) => explode('.', $name)[0])
        ->map(fn ($group) => $group->values()->all())
        ->all();
}
```

- [ ] **Step 5: Add routes** — inside the existing group in `app/Modules/Rbac/routes/web.php`, add:

```php
Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('can:roles.create');
Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('can:roles.create');
```

- [ ] **Step 6: Run** — `vendor/bin/pest tests/Feature/Rbac/RoleStoreTest.php` → expect PASS (3 passed). Then `composer check` → green.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Rbac/Http tests/Feature/Rbac/RoleStoreTest.php app/Modules/Rbac/routes/web.php
git commit -m "feat(rbac): add role creation with permission sync"
```

---

## Task 4: Edit + update role

**Files:**
- Create: `app/Modules/Rbac/Http/Requests/UpdateRoleRequest.php`
- Modify: `app/Modules/Rbac/Http/Controllers/RoleController.php`
- Modify: `app/Modules/Rbac/routes/web.php`
- Test: `tests/Feature/Rbac/RoleUpdateTest.php`

- [ ] **Step 1: Write the failing test** — `tests/Feature/Rbac/RoleUpdateTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.update', 'web');
    Permission::findOrCreate('audit.view', 'web');
});

it('updates a role name and permissions', function () {
    $role = Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.update');

    $this->actingAs($user)
        ->put("/rbac/roles/{$role->id}", ['name' => 'manager', 'permissions' => ['audit.view']])
        ->assertRedirect();

    $role->refresh();
    expect($role->name)->toBe('manager')
        ->and($role->permissions->pluck('name')->all())->toBe(['audit.view']);
});

it('allows keeping the same name on update', function () {
    $role = Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.update');

    $this->actingAs($user)
        ->put("/rbac/roles/{$role->id}", ['name' => 'editor'])
        ->assertRedirect();

    expect(Role::where('name', 'editor')->count())->toBe(1);
});
```

- [ ] **Step 2: Run** — FAIL (no update route/method).

- [ ] **Step 3: Create the FormRequest** — `app/Modules/Rbac/Http/Requests/UpdateRoleRequest.php`:

```php
<?php

namespace App\Modules\Rbac\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route middleware enforces can:roles.update
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        $roleId = $this->route('role');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($roleId)],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
```

> `$this->route('role')` is the route parameter; with implicit binding it may be a `Role` model or the raw id. To be safe in the unique rule, this plan uses route-model binding (see route below) so `$this->route('role')` is a `Role`; `Rule::ignore()` accepts a model. If it is the raw id, `ignore()` still works with a scalar.

- [ ] **Step 4: Add `edit` + `update` to the controller**:

```php
// add import:
use App\Modules\Rbac\Http\Requests\UpdateRoleRequest;

// add methods:
public function edit(Role $role): Response
{
    return Inertia::render('Rbac::pages/roles/Form', [
        'role' => RoleData::fromModel($role->load('permissions')),
        'permissions' => $this->groupedPermissions(),
    ]);
}

public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
{
    $role->update(['name' => $request->string('name')]);
    $role->syncPermissions($request->input('permissions', []));

    return redirect()->route('rbac.roles.index');
}
```

- [ ] **Step 5: Add routes** (with model binding) — inside the group:

```php
Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit')->middleware('can:roles.update');
Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('can:roles.update');
```

> Laravel binds `{role}` to a `Spatie\Permission\Models\Role` by default (its route key is `id`). The controller type-hints `Role` (spatie) — matching the binding.

- [ ] **Step 6: Run** — `vendor/bin/pest tests/Feature/Rbac/RoleUpdateTest.php` → expect PASS (2 passed). Then `composer check` → green.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Rbac/Http tests/Feature/Rbac/RoleUpdateTest.php app/Modules/Rbac/routes/web.php
git commit -m "feat(rbac): add role editing and update"
```

---

## Task 5: Delete role (protect super-admin)

**Files:**
- Modify: `app/Modules/Rbac/Http/Controllers/RoleController.php`
- Modify: `app/Modules/Rbac/routes/web.php`
- Test: `tests/Feature/Rbac/RoleDestroyTest.php`

- [ ] **Step 1: Write the failing test** — `tests/Feature/Rbac/RoleDestroyTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('roles.delete', 'web');
});

it('deletes a role', function () {
    $role = Role::findOrCreate('editor', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.delete');

    $this->actingAs($user)
        ->delete("/rbac/roles/{$role->id}")
        ->assertRedirect();

    expect(Role::where('name', 'editor')->exists())->toBeFalse();
});

it('refuses to delete the super-admin role', function () {
    $role = Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.delete');

    $this->actingAs($user)
        ->delete("/rbac/roles/{$role->id}")
        ->assertRedirect();

    expect(Role::where('name', 'super-admin')->exists())->toBeTrue();
});
```

- [ ] **Step 2: Run** — FAIL (no destroy route/method).

- [ ] **Step 3: Add `destroy` to the controller**:

```php
public function destroy(Role $role): RedirectResponse
{
    if ($role->name !== 'super-admin') {
        $role->delete();
    }

    return redirect()->route('rbac.roles.index');
}
```

- [ ] **Step 4: Add the route** — inside the group:

```php
Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('can:roles.delete');
```

- [ ] **Step 5: Run** — `vendor/bin/pest tests/Feature/Rbac/RoleDestroyTest.php` → expect PASS (2 passed). Then `composer check` → green.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Rbac/Http/Controllers/RoleController.php tests/Feature/Rbac/RoleDestroyTest.php app/Modules/Rbac/routes/web.php
git commit -m "feat(rbac): add role deletion (super-admin protected)"
```

---

## Task 6: Permission catalog (read-only)

**Files:**
- Create: `app/Modules/Rbac/Http/Controllers/PermissionController.php`
- Modify: `app/Modules/Rbac/routes/web.php`
- Test: `tests/Feature/Rbac/PermissionIndexTest.php`

- [ ] **Step 1: Write the failing test** — `tests/Feature/Rbac/PermissionIndexTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('permissions.viewAny', 'web');
});

it('forbids users without permissions.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/rbac/permissions')->assertForbidden();
});

it('lists permissions grouped by resource', function () {
    Permission::findOrCreate('audit.view', 'web');
    Permission::findOrCreate('roles.create', 'web');
    $user = User::factory()->create()->givePermissionTo('permissions.viewAny');

    $this->actingAs($user)
        ->get('/rbac/permissions')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Rbac::pages/permissions/Index')
            ->has('groups')
            ->has('groups.audit')
            ->has('groups.roles')
        );
});
```

- [ ] **Step 2: Run** — FAIL (no permissions route/controller).

- [ ] **Step 3: Create the controller** — `app/Modules/Rbac/Http/Controllers/PermissionController.php`:

```php
<?php

namespace App\Modules\Rbac\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController
{
    public function index(): Response
    {
        $groups = Permission::query()
            ->orderBy('name')
            ->pluck('name')
            ->groupBy(fn (string $name) => explode('.', $name)[0])
            ->map(fn ($group) => $group->values()->all())
            ->all();

        return Inertia::render('Rbac::pages/permissions/Index', [
            'groups' => $groups,
        ]);
    }
}
```

- [ ] **Step 4: Add the route** — inside the group:

```php
Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index')->middleware('can:permissions.viewAny');
```

(Add `use App\Modules\Rbac\Http\Controllers\PermissionController;` at the top of the routes file.)

- [ ] **Step 5: Run** — `vendor/bin/pest tests/Feature/Rbac/PermissionIndexTest.php` → expect PASS (2 passed). Then `composer check` → green.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Rbac/Http/Controllers/PermissionController.php app/Modules/Rbac/routes/web.php tests/Feature/Rbac/PermissionIndexTest.php
git commit -m "feat(rbac): add read-only permission catalog"
```

---

## Task 7: super-admin seeder

**Files:**
- Create: `app/Modules/Rbac/Database/Seeders/RbacSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Test: `tests/Feature/Rbac/RbacSeederTest.php`

- [ ] **Step 1: Write the failing test** — `tests/Feature/Rbac/RbacSeederTest.php`:

```php
<?php

use App\Modules\Rbac\Database\Seeders\RbacSeeder;
use Spatie\Permission\Models\Role;

it('seeds the super-admin role idempotently', function () {
    (new RbacSeeder())->run();
    (new RbacSeeder())->run();

    expect(Role::where('name', 'super-admin')->count())->toBe(1);
});
```

- [ ] **Step 2: Run** — FAIL ("Class ...RbacSeeder not found").

- [ ] **Step 3: Create the seeder** — `app/Modules/Rbac/Database/Seeders/RbacSeeder.php`:

```php
<?php

namespace App\Modules\Rbac\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        Role::findOrCreate('super-admin', 'web');
    }
}
```

- [ ] **Step 4: Call it from the root seeder** — in `database/seeders/DatabaseSeeder.php`, add a call inside `run()` (keep existing seeding):

```php
use App\Modules\Rbac\Database\Seeders\RbacSeeder;

// inside run():
$this->call(RbacSeeder::class);
```

- [ ] **Step 5: Run** — `vendor/bin/pest tests/Feature/Rbac/RbacSeederTest.php` → expect PASS (1 passed). Then `composer check` → green.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Rbac/Database/Seeders/RbacSeeder.php database/seeders/DatabaseSeeder.php tests/Feature/Rbac/RbacSeederTest.php
git commit -m "feat(rbac): seed the super-admin role"
```

---

## Task 8: React pages (roles index/form, permissions index)

**Files:**
- Create: `app/Modules/Rbac/resources/js/pages/roles/Index.tsx`
- Create: `app/Modules/Rbac/resources/js/pages/roles/Form.tsx`
- Create: `app/Modules/Rbac/resources/js/pages/permissions/Index.tsx`

- [ ] **Step 1: Roles index** — `app/Modules/Rbac/resources/js/pages/roles/Index.tsx`:

```tsx
import { Head, Link, router } from '@inertiajs/react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

export default function Index({ roles }: { roles: Role[] }) {
    const destroy = (id: number) => {
        if (confirm('Delete this role?')) {
            router.delete(`/rbac/roles/${id}`);
        }
    };

    return (
        <div className="p-6">
            <Head title="Roles" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Roles</h1>
                <Link href="/rbac/roles/create" className="rounded bg-black px-3 py-1 text-white">
                    New role
                </Link>
            </div>

            <div className="overflow-x-auto rounded border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Permissions</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id} className="border-t">
                                <td className="p-2 font-medium">{role.name}</td>
                                <td className="p-2 text-muted-foreground">{role.permissions.length} permissions</td>
                                <td className="space-x-3 p-2 text-right">
                                    <Link href={`/rbac/roles/${role.id}/edit`} className="text-blue-600">
                                        Edit
                                    </Link>
                                    {role.name !== 'super-admin' && (
                                        <button onClick={() => destroy(role.id)} className="text-red-600">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Role form** — `app/Modules/Rbac/resources/js/pages/roles/Form.tsx`:

```tsx
import { Head, useForm } from '@inertiajs/react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface Props {
    role: Role | null;
    permissions: Record<string, string[]>;
}

export default function Form({ role, permissions }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: role?.name ?? '',
        permissions: role?.permissions ?? [],
    });

    const toggle = (name: string) => {
        setData(
            'permissions',
            data.permissions.includes(name)
                ? data.permissions.filter((p) => p !== name)
                : [...data.permissions, name],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (role) {
            put(`/rbac/roles/${role.id}`);
        } else {
            post('/rbac/roles');
        }
    };

    return (
        <div className="p-6">
            <Head title={role ? 'Edit role' : 'New role'} />
            <h1 className="mb-4 text-2xl font-semibold">{role ? 'Edit role' : 'New role'}</h1>

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                        className="w-full rounded border px-2 py-1"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-4">
                    {Object.entries(permissions).map(([group, names]) => (
                        <fieldset key={group} className="rounded border p-3">
                            <legend className="px-1 text-sm font-semibold capitalize">{group}</legend>
                            <div className="grid grid-cols-2 gap-2">
                                {names.map((name) => (
                                    <label key={name} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.permissions.includes(name)}
                                            onChange={() => toggle(name)}
                                        />
                                        {name}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    Save
                </button>
            </form>
        </div>
    );
}
```

- [ ] **Step 3: Permissions index** — `app/Modules/Rbac/resources/js/pages/permissions/Index.tsx`:

```tsx
import { Head } from '@inertiajs/react';

export default function Index({ groups }: { groups: Record<string, string[]> }) {
    return (
        <div className="p-6">
            <Head title="Permissions" />
            <h1 className="mb-4 text-2xl font-semibold">Permissions</h1>
            <p className="mb-4 text-sm text-muted-foreground">
                Declared per module and synced via <code>php artisan permission:sync</code>. Read-only.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(groups).map(([group, names]) => (
                    <div key={group} className="rounded border p-3">
                        <h2 className="mb-2 font-semibold capitalize">{group}</h2>
                        <ul className="space-y-1 text-sm">
                            {names.map((name) => (
                                <li key={name} className="text-muted-foreground">
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Format, lint, build**

```bash
npx prettier --write app/Modules/Rbac/resources/js/pages
npx eslint app/Modules/Rbac/resources/js/pages
npm run build
```
All must pass; `npm run build` must emit the three module pages. Fix any eslint/TS issues minimally (e.g. type the `React.FormEvent` import if eslint requires `import type { FormEvent } from 'react'` — adjust to satisfy the project's eslint config).

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Rbac/resources/js/pages
git commit -m "feat(rbac): add roles and permissions React pages"
```

---

## Task 9: README, permission sync, dogfood

**Files:**
- Modify: `app/Modules/Rbac/README.md`

- [ ] **Step 1: Document the module** — replace `app/Modules/Rbac/README.md`:

```markdown
# Rbac

Role-based access control management.

## Permissions

- `roles.viewAny`, `roles.create`, `roles.update`, `roles.delete` — manage roles.
- `permissions.viewAny` — view the permission catalog.

## Routes

- `GET /rbac/roles` (`rbac.roles.index`) — list roles
- `GET /rbac/roles/create`, `POST /rbac/roles` — create
- `GET /rbac/roles/{role}/edit`, `PUT /rbac/roles/{role}` — edit
- `DELETE /rbac/roles/{role}` — delete (the `super-admin` role is protected)
- `GET /rbac/permissions` (`rbac.permissions.index`) — read-only catalog

## Super-admin

A user with the `super-admin` role bypasses all authorization (`Gate::before` in
`RbacServiceProvider`). Seed it with `RbacSeeder` (called from `DatabaseSeeder`), or
`php artisan db:seed`.

Role create/update/delete are audited via `App\Audit\Concerns\IsAudited`.
```

- [ ] **Step 2: Sync permissions + dogfood**

```bash
php artisan migrate --force
php artisan permission:sync
```
Run: `php artisan permission:sync` → output includes the 5 `roles.*`/`permissions.viewAny` names.

Run: `php artisan route:list --name=rbac` → the `rbac.roles.*` and `rbac.permissions.index` routes are listed, served from `app/Modules/Rbac/routes/web.php`.

- [ ] **Step 3: Full gates**

Run: `composer check` → green (all Rbac tests passing).
Run: `npm run build` → succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Rbac/README.md
git commit -m "docs(rbac): document the Rbac module"
```

---

## Self-Review

**Spec coverage (Section 4 — RBAC management UI):**
- Role & Permission management UI → Tasks 2–6, 8 ✅
- Assign permissions → roles → Tasks 3, 4 (syncPermissions) ✅
- Permissions declared per module, read-only catalog → Task 6 ✅
- Super-admin bypass via `Gate::before` → Task 1 ✅
- `<resource>.<action>` permission convention → Task 1 (`roles.*`, `permissions.viewAny`) ✅
- Role changes audited → Task 1 (audited Role model) ✅

**Out of scope (deferred to the Users module plan):** assigning roles to users (the user-management UI), which depends on this module's roles existing.

**Type consistency:** `RoleData::fromModel(Role)`, `RoleController` methods (index/create/store/edit/update/destroy), `groupedPermissions()`, `StoreRoleRequest`/`UpdateRoleRequest`, route names `rbac.roles.*`/`rbac.permissions.index` are consistent across tasks. The controller type-hints `Spatie\Permission\Models\Role` for route binding; the audited `App\Modules\Rbac\Models\Role` subclass is used by the seeder/audit path but the controller relies on spatie's base for binding — both map to the `roles` table.

**Placeholder scan:** every code step has complete code; no TBD/TODO.

**Known choices:**
- The `RoleController` imports and uses `App\Modules\Rbac\Models\Role` (the audited subclass) for all queries, creation, and route-model binding (`edit/update/destroy` type-hint `Role`, so Laravel binds `{role}` to the subclass). This guarantees every role create/update/delete is captured by `IsAudited`. `RoleData::fromModel()` type-hints spatie's base `Role`, which is compatible since the subclass extends it.
- Route names are prefixed `rbac.` (e.g. `rbac.roles.index`). The `super-admin` role is protected from deletion in `destroy()`.

---

## Next plan

**Plan 4 — Users module:** admin user listing/CRUD, assign roles to users (uses this module's roles), leveraging the starter kit's existing personal Profile/password pages. Then **Plan 5 — the skill pipeline + Scramble API docs.**
