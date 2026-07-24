---
name: add-permission
description: Use when adding a new permission to a module and gating routes with it.
---

> Follow **`superpowers:test-driven-development`** for the TDD discipline (failing test first). The
> Laravel-specific sequence is below.

Follow this sequence exactly: declare → sync → gate → test. Never skip `permission:sync` — undeclared permissions do not exist in the DB and the `can:` middleware will always deny them.

---

## 1. Declare the permission

Add one entry to the module's `permissions.php`:

```php
// app/Modules/<Name>/permissions.php
return [
    // existing entries...
    '<resource>.<action>',   // e.g. 'invoices.approve', 'reports.export'
];
```

**Name format** (enforced by `PermissionRegistry::isValidName()` — pattern `/^[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9]*$/`):

- `<resource>`: lowercase; matches the module alias or domain noun (e.g. `users`, `invoices`, `audit`).
- `<action>`: camelCase; canonical set is `viewAny | view | create | update | delete`; domain verbs are allowed (`approve`, `export`, `publish`, `sync`).

Valid examples from `app/Modules/Iam/permissions.php` (one context, several aggregates):

```php
'users.viewAny', 'users.create', 'users.update', 'users.delete'
'roles.viewAny', 'roles.create', 'permissions.viewAny'
'invoices.approve', 'reports.export'
```

Any other format causes `permission:sync` to exit non-zero with a validation error — fix the name before proceeding.

---

## 2. Sync the database

```bash
php artisan permission:sync
```

`SyncPermissionsCommand` (`app/Modular/Console/SyncPermissionsCommand.php`) validates every declared name first, then upserts each via `Permission::findOrCreate($name, 'web')`. If any name is malformed the command aborts before touching the DB.

```bash
php artisan permission:sync --prune
```

Pass `--prune` to also delete DB rows for permissions no longer declared in any module. Use with care in production — it removes permissions that may be assigned to roles.

Run `permission:sync` after every addition or removal in any `permissions.php`.

---

## 3. Gate the route(s)

Attach `can:` middleware **directly on the route** — not inside `FormRequest::authorize()` (that always returns `true`). The middleware is the actual enforcement point.

```php
// app/Modules/<Name>/routes/web.php
Route::middleware('auth')->group(function () {
    Route::get('<resource>',              [MyController::class, 'index'])
        ->name('<resource>.index')->middleware('can:<resource>.viewAny');

    Route::post('<resource>/{item}/<action>', [ApproveController::class, '__invoke'])
        ->name('<resource>.<action>')->middleware('can:<resource>.<action>');
});
```

Canonical example from `app/Modules/Iam/routes/web.php` (the users aggregate, grouped under the
`iam.` route-name prefix — note route names carry the context prefix while permission names stay
resource-scoped):

```php
Route::middleware('auth')->prefix('iam')->name('iam.')->group(function () {
    Route::get('users',           [UserController::class, 'index'])
        ->name('users.index')->middleware('can:users.viewAny');
    Route::post('users',          [UserController::class, 'store'])
        ->name('users.store')->middleware('can:users.create');
    Route::put('users/{user}',    [UserController::class, 'update'])
        ->name('users.update')->middleware('can:users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])
        ->name('users.destroy')->middleware('can:users.delete');
});
```

Do **not** add the `web` middleware group manually — `ModuleServiceProvider` applies it to every `routes/web.php` automatically.

---

## 4. Assign to roles (runtime)

After sync the permission appears automatically in the permission catalog at `/iam/permissions` and is assignable to roles at `/iam/roles`. No code change is needed for this.

Programmatically (e.g. in a seeder or test):

```php
$role->givePermissionTo('invoices.approve');
$user->givePermissionTo('invoices.approve');
```

`super-admin` bypass: `IamServiceProvider` registers a `Gate::before` that grants every permission to users with the `super-admin` role — no explicit assignment needed for them.

---

## 5. Write Pest tests

Two tests are required for every permission-gated endpoint: a 403 (no permission) and a happy-path (permission granted). Follow the layout in `tests/Feature/Users/`.

```php
// tests/Feature/<ModuleName>/<ResourceAction>Test.php
use Spatie\Permission\Models\Permission;
use App\Models\User;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('<resource>.<action>', 'web');
});

it('returns 403 without <resource>.<action>', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/<resource>/{id}/<action>')->assertForbidden();
});

it('succeeds with <resource>.<action>', function () {
    $actor = User::factory()->create()->givePermissionTo('<resource>.<action>');

    $this->actingAs($actor)
        ->post('/<resource>/1/<action>')
        ->assertRedirect(); // or ->assertOk() for JSON endpoints
});
```

Test files live in `tests/Feature/<ModuleName>/` (outside the module directory). Canonical examples: `tests/Feature/Users/UserStoreTest.php`, `UserDestroyTest.php`.

---

## 6. Quality gate

```bash
composer check   # Pint + PHPStan level 6 + Pest — must be green
```

All new tests from step 5 must pass. Do not commit until the gate is green.

---

## Summary checklist

- [ ] Entry added to `app/Modules/<Name>/permissions.php` with valid `<resource>.<action>` format
- [ ] `php artisan permission:sync` ran and exited `0`
- [ ] Route(s) have `->middleware('can:<resource>.<action>')`
- [ ] `FormRequest::authorize()` returns `true` (guard is on the route, not the request)
- [ ] Pest 403 test + happy-path test written and passing
- [ ] `composer check` green
