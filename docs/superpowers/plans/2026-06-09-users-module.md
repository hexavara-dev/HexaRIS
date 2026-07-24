# Users Management Module Implementation Plan (Plan 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A self-contained `Users` module for admin user management — list, create, edit, delete users and assign them roles — all behind `can:users.*` permissions, reusing the core `App\Models\User` (already audited and `HasRoles`).

**Architecture:** Built on the Plan 1 module system. The module is an admin UI over the core `User` model; role assignment uses spatie's `syncRoles` against roles defined by the Plan 3 Rbac module. Personal profile/password pages already ship in the starter kit (`resources/js/pages/settings/`) and are out of scope. User CRUD is auto-audited via the `IsAudited` trait already on `User`.

**Tech Stack:** Laravel 12.61, spatie/laravel-permission 8, spatie/laravel-data, Inertia React + TypeScript, Pest. Gate: `composer check`. Workflow: feature branch → PR → squash-merge.

---

## Prerequisites (in place)

- Module system (`module:make`, `permission:sync`, namespaced Inertia resolver).
- `App\Models\User`: `$fillable = [name, email, password]`, `password` `hashed`-cast, uses `HasRoles` + `IsAudited`.
- Rbac module provides roles + the `super-admin` gate. (Users depends on roles existing for assignment — declared advisory-only in `module.json`.)

> **Workflow:** Work on `feat/users-module`. Land via PR + squash-merge. `composer check` before each commit.

Route map (all under `web` + `auth`):
- `GET    /users`              `users.index`   (can:users.viewAny)
- `GET    /users/create`       `users.create`  (can:users.create)
- `POST   /users`              `users.store`   (can:users.create)
- `GET    /users/{user}/edit`  `users.edit`    (can:users.update)
- `PUT    /users/{user}`       `users.update`  (can:users.update)
- `DELETE /users/{user}`       `users.destroy` (can:users.delete)

---

## Task 1: Scaffold module, permissions, UserData DTO, users index

**Files:**
- Generate: `app/Modules/Users/` (via `php artisan module:make Users`)
- Modify: `app/Modules/Users/permissions.php`, `app/Modules/Users/module.json`
- Create: `app/Modules/Users/Data/UserData.php`, `app/Modules/Users/Http/Controllers/UserController.php`
- Modify: `app/Modules/Users/routes/web.php`
- Test: `tests/Feature/Users/UserIndexTest.php`

- [ ] **Step 1: Scaffold** — `php artisan module:make Users`

- [ ] **Step 2: Permissions** — replace `app/Modules/Users/permissions.php`:

```php
<?php

return [
    'users.viewAny',
    'users.create',
    'users.update',
    'users.delete',
];
```

- [ ] **Step 3: Declare the Rbac dependency** — in `app/Modules/Users/module.json`, set `"dependencies": ["rbac"]` (advisory). Leave other fields as generated.

- [ ] **Step 4: Failing test** — `tests/Feature/Users/UserIndexTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.viewAny', 'web');
});

it('forbids users without users.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/users')->assertForbidden();
});

it('lists users with their roles', function () {
    Role::findOrCreate('editor', 'web');
    $target = User::factory()->create(['name' => 'Jane'])->assignRole('editor');
    $admin = User::factory()->create()->givePermissionTo('users.viewAny');

    $this->actingAs($admin)
        ->get('/users')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Users::pages/Index')
            ->has('users.data')
            ->where('users.data', fn ($rows) => collect($rows)->contains(fn ($r) => $r['name'] === 'Jane' && $r['roles'] === ['editor']))
        );
});
```

- [ ] **Step 5: Run** — FAIL (route/controller missing).

- [ ] **Step 6: DTO** — `app/Modules/Users/Data/UserData.php`:

```php
<?php

namespace App\Modules\Users\Data;

use App\Models\User;
use Spatie\LaravelData\Data;

class UserData extends Data
{
    /**
     * @param array<int,string> $roles
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public array $roles,
        public string $createdAt,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            roles: $user->roles->pluck('name')->all(),
            createdAt: $user->created_at?->toIso8601String() ?? '',
        );
    }
}
```

- [ ] **Step 7: Controller** — `app/Modules/Users/Http/Controllers/UserController.php`:

```php
<?php

namespace App\Modules\Users\Http\Controllers;

use App\Models\User;
use App\Modules\Users\Data\UserData;
use Inertia\Inertia;
use Inertia\Response;

class UserController
{
    public function index(): Response
    {
        $users = User::query()
            ->with('roles')
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $user) => UserData::fromModel($user));

        return Inertia::render('Users::pages/Index', [
            'users' => $users,
        ]);
    }
}
```

- [ ] **Step 8: Route** — replace `app/Modules/Users/routes/web.php`:

```php
<?php

use App\Modules\Users\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('can:users.viewAny');
});
```

(Do NOT add `web` — the ModuleServiceProvider wraps this in the web group.)

- [ ] **Step 9: Run** — `vendor/bin/pest tests/Feature/Users/UserIndexTest.php` → PASS (2). Then `composer check` → green.

- [ ] **Step 10: Commit**

```bash
git add app/Modules/Users tests/Feature/Users/UserIndexTest.php
git commit -m "feat(users): scaffold module with users index and roles"
```

---

## Task 2: Create + store user

**Files:**
- Create: `app/Modules/Users/Http/Requests/StoreUserRequest.php`
- Modify: `app/Modules/Users/Http/Controllers/UserController.php`, `routes/web.php`
- Test: `tests/Feature/Users/UserStoreTest.php`

- [ ] **Step 1: Failing test** — `tests/Feature/Users/UserStoreTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.create', 'web');
    Role::findOrCreate('editor', 'web');
});

it('forbids creating a user without users.create', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/users', [])->assertForbidden();
});

it('creates a user with a role and a hashed password', function () {
    $admin = User::factory()->create()->givePermissionTo('users.create');

    $this->actingAs($admin)->post('/users', [
        'name' => 'New Person',
        'email' => 'new@example.com',
        'password' => 'secret-password',
        'roles' => ['editor'],
    ])->assertRedirect();

    $user = User::where('email', 'new@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->hasRole('editor'))->toBeTrue()
        ->and($user->password)->not->toBe('secret-password')
        ->and(Hash::check('secret-password', $user->password))->toBeTrue();
});

it('rejects a duplicate email', function () {
    User::factory()->create(['email' => 'dup@example.com']);
    $admin = User::factory()->create()->givePermissionTo('users.create');

    $this->actingAs($admin)->post('/users', [
        'name' => 'X',
        'email' => 'dup@example.com',
        'password' => 'secret-password',
    ])->assertSessionHasErrors('email');
});
```

- [ ] **Step 2: Run** — FAIL (no store route).

- [ ] **Step 3: FormRequest** — `app/Modules/Users/Http/Requests/StoreUserRequest.php`:

```php
<?php

namespace App\Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route middleware enforces can:users.create
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
```

- [ ] **Step 4: Controller** — add to `UserController` (imports `use App\Modules\Users\Http\Requests\StoreUserRequest;`, `use Illuminate\Http\RedirectResponse;`, `use Spatie\Permission\Models\Role;`):

```php
public function create(): Response
{
    return Inertia::render('Users::pages/Form', [
        'user' => null,
        'roles' => Role::query()->orderBy('name')->pluck('name'),
    ]);
}

public function store(StoreUserRequest $request): RedirectResponse
{
    $user = User::create($request->safe()->only(['name', 'email', 'password']));
    $user->syncRoles($request->input('roles', []));

    return redirect()->route('users.index');
}
```

> `password` is `hashed`-cast on `User`, so `User::create(['password' => '<plain>'])` stores a bcrypt hash automatically.

- [ ] **Step 5: Routes** — inside the group in `routes/web.php`:

```php
Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('can:users.create');
Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('can:users.create');
```

- [ ] **Step 6: Run** — `vendor/bin/pest tests/Feature/Users/UserStoreTest.php` → PASS (3). Then `composer check` → green.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Users/Http app/Modules/Users/routes/web.php tests/Feature/Users/UserStoreTest.php
git commit -m "feat(users): add user creation with role assignment"
```

---

## Task 3: Edit + update user

**Files:**
- Create: `app/Modules/Users/Http/Requests/UpdateUserRequest.php`
- Modify: `app/Modules/Users/Http/Controllers/UserController.php`, `routes/web.php`
- Test: `tests/Feature/Users/UserUpdateTest.php`

- [ ] **Step 1: Failing test** — `tests/Feature/Users/UserUpdateTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.update', 'web');
    Role::findOrCreate('editor', 'web');
    Role::findOrCreate('manager', 'web');
});

it('updates name, email and roles without changing the password when blank', function () {
    $target = User::factory()->create(['name' => 'Old'])->assignRole('editor');
    $originalPassword = $target->password;
    $admin = User::factory()->create()->givePermissionTo('users.update');

    $this->actingAs($admin)->put("/users/{$target->id}", [
        'name' => 'New',
        'email' => $target->email,
        'roles' => ['manager'],
    ])->assertRedirect();

    $target->refresh();
    expect($target->name)->toBe('New')
        ->and($target->hasRole('manager'))->toBeTrue()
        ->and($target->hasRole('editor'))->toBeFalse()
        ->and($target->password)->toBe($originalPassword);
});

it('updates the password when provided', function () {
    $target = User::factory()->create();
    $admin = User::factory()->create()->givePermissionTo('users.update');

    $this->actingAs($admin)->put("/users/{$target->id}", [
        'name' => $target->name,
        'email' => $target->email,
        'password' => 'brand-new-password',
    ])->assertRedirect();

    expect(Hash::check('brand-new-password', $target->refresh()->password))->toBeTrue();
});
```

- [ ] **Step 2: Run** — FAIL (no update route).

- [ ] **Step 3: FormRequest** — `app/Modules/Users/Http/Requests/UpdateUserRequest.php`:

```php
<?php

namespace App\Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route middleware enforces can:users.update
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
```

- [ ] **Step 4: Controller** — add (import `use App\Modules\Users\Http\Requests\UpdateUserRequest;`):

```php
public function edit(User $user): Response
{
    return Inertia::render('Users::pages/Form', [
        'user' => UserData::fromModel($user->load('roles')),
        'roles' => Role::query()->orderBy('name')->pluck('name'),
    ]);
}

public function update(UpdateUserRequest $request, User $user): RedirectResponse
{
    $user->update($request->safe()->only(['name', 'email']));

    if ($request->filled('password')) {
        $user->update(['password' => (string) $request->string('password')]);
    }

    $user->syncRoles($request->input('roles', []));

    return redirect()->route('users.index');
}
```

- [ ] **Step 5: Routes** — inside the group:

```php
Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('can:users.update');
Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('can:users.update');
```

- [ ] **Step 6: Run** — `vendor/bin/pest tests/Feature/Users/UserUpdateTest.php` → PASS (2). Then `composer check` → green.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Users/Http app/Modules/Users/routes/web.php tests/Feature/Users/UserUpdateTest.php
git commit -m "feat(users): add user editing with optional password and roles"
```

---

## Task 4: Delete user (self-delete protection)

**Files:**
- Modify: `app/Modules/Users/Http/Controllers/UserController.php`, `routes/web.php`
- Test: `tests/Feature/Users/UserDestroyTest.php`

- [ ] **Step 1: Failing test** — `tests/Feature/Users/UserDestroyTest.php`:

```php
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.delete', 'web');
});

it('forbids deleting without users.delete', function () {
    $target = User::factory()->create();
    $this->actingAs(User::factory()->create());

    $this->delete("/users/{$target->id}")->assertForbidden();
    expect(User::whereKey($target->id)->exists())->toBeTrue();
});

it('deletes another user', function () {
    $target = User::factory()->create();
    $admin = User::factory()->create()->givePermissionTo('users.delete');

    $this->actingAs($admin)->delete("/users/{$target->id}")->assertRedirect();
    expect(User::whereKey($target->id)->exists())->toBeFalse();
});

it('refuses to delete your own account', function () {
    $admin = User::factory()->create()->givePermissionTo('users.delete');

    $this->actingAs($admin)->delete("/users/{$admin->id}")->assertRedirect();
    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});
```

- [ ] **Step 2: Run** — FAIL (no destroy route).

- [ ] **Step 3: Controller** — add (import `use Illuminate\Http\Request;`):

```php
public function destroy(Request $request, User $user): RedirectResponse
{
    if ($request->user()?->is($user)) {
        return redirect()->route('users.index')->with('error', 'You cannot delete your own account.');
    }

    $user->delete();

    return redirect()->route('users.index');
}
```

- [ ] **Step 4: Route** — inside the group:

```php
Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('can:users.delete');
```

- [ ] **Step 5: Run** — `vendor/bin/pest tests/Feature/Users/UserDestroyTest.php` → PASS (3). Then `composer check` → green.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Users/Http/Controllers/UserController.php app/Modules/Users/routes/web.php tests/Feature/Users/UserDestroyTest.php
git commit -m "feat(users): add user deletion (self-delete protected)"
```

---

## Task 5: React pages (users index + form)

**Files:**
- Create: `app/Modules/Users/resources/js/pages/Index.tsx`, `app/Modules/Users/resources/js/pages/Form.tsx`

- [ ] **Step 1: Users index** — `app/Modules/Users/resources/js/pages/Index.tsx`:

```tsx
import { Head, Link, router } from '@inertiajs/react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface Paginated<T> {
    data: T[];
}

export default function Index({ users }: { users: Paginated<UserRow> }) {
    const destroy = (id: number) => {
        if (confirm('Delete this user?')) {
            router.delete(`/users/${id}`);
        }
    };

    return (
        <div className="p-6">
            <Head title="Users" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Users</h1>
                <Link href="/users/create" className="rounded bg-black px-3 py-1 text-white">
                    New user
                </Link>
            </div>

            <div className="overflow-x-auto rounded border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Roles</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.map((user) => (
                            <tr key={user.id} className="border-t">
                                <td className="p-2 font-medium">{user.name}</td>
                                <td className="p-2 text-muted-foreground">{user.email}</td>
                                <td className="p-2 text-muted-foreground">{user.roles.join(', ') || '—'}</td>
                                <td className="space-x-3 p-2 text-right">
                                    <Link href={`/users/${user.id}/edit`} className="text-blue-600">
                                        Edit
                                    </Link>
                                    <button onClick={() => destroy(user.id)} className="text-red-600">
                                        Delete
                                    </button>
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

- [ ] **Step 2: User form** — `app/Modules/Users/resources/js/pages/Form.tsx`:

```tsx
import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface Props {
    user: UserRow | null;
    roles: string[];
}

export default function Form({ user, roles }: Props) {
    const { data, setData, post, put, processing, errors } = useForm<{
        name: string;
        email: string;
        password: string;
        roles: string[];
    }>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        roles: user?.roles ?? [],
    });

    const toggle = (name: string) => {
        setData('roles', data.roles.includes(name) ? data.roles.filter((r) => r !== name) : [...data.roles, name]);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (user) {
            put(`/users/${user.id}`);
        } else {
            post('/users');
        }
    };

    return (
        <div className="p-6">
            <Head title={user ? 'Edit user' : 'New user'} />
            <h1 className="mb-4 text-2xl font-semibold">{user ? 'Edit user' : 'New user'}</h1>

            <form onSubmit={submit} className="max-w-xl space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                        className="w-full rounded border px-2 py-1"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        className="w-full rounded border px-2 py-1"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Password {user && <span className="text-muted-foreground">(leave blank to keep)</span>}
                    </label>
                    <input
                        type="password"
                        className="w-full rounded border px-2 py-1"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <fieldset className="rounded border p-3">
                    <legend className="px-1 text-sm font-semibold">Roles</legend>
                    <div className="grid grid-cols-2 gap-2">
                        {roles.map((name) => (
                            <label key={name} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={data.roles.includes(name)} onChange={() => toggle(name)} />
                                {name}
                            </label>
                        ))}
                    </div>
                </fieldset>

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

- [ ] **Step 3: Format, lint, build**

```bash
npx prettier --write app/Modules/Users/resources/js/pages
npx eslint app/Modules/Users/resources/js/pages
npx eslint .
npm run build
```
All pass; the two pages appear in the Vite manifest. Fix eslint/TS minimally if needed. `composer check` stays green.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Users/resources/js/pages
git commit -m "feat(users): add users index and form React pages"
```

---

## Task 6: README, permission sync, dogfood

**Files:**
- Modify: `app/Modules/Users/README.md`

- [ ] **Step 1: README** — replace `app/Modules/Users/README.md`:

```markdown
# Users

Admin user management.

## Permissions

- `users.viewAny`, `users.create`, `users.update`, `users.delete`.

## Routes

- `GET /users` (`users.index`) — list users with roles
- `GET /users/create`, `POST /users` — create (assign roles)
- `GET /users/{user}/edit`, `PUT /users/{user}` — edit (password optional; assign roles)
- `DELETE /users/{user}` — delete (you cannot delete your own account)

Operates on the core `App\Models\User` (audited via `IsAudited`, `HasRoles`). Roles come from the
`Rbac` module. Personal profile/password live in the starter kit's settings pages.
```

- [ ] **Step 2: Sync + dogfood**

```bash
php artisan migrate --force
php artisan permission:sync
```
Run: `php artisan permission:sync` → includes the 4 `users.*` names.
Run: `php artisan route:list --name=users` → the 6 `users.*` routes from the module.

- [ ] **Step 3: Gates** — `composer check` → green; `npm run build` → succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Users/README.md
git commit -m "docs(users): document the Users module"
```

---

## Self-Review

**Spec coverage (Section 6 — Built-in modules, "Auth + User & Profile"):**
- Admin user CRUD → Tasks 1–4 ✅
- Assign roles to users → Tasks 2, 3 (`syncRoles`) ✅
- Password hashing on create/update → Tasks 2, 3 (`hashed` cast) ✅
- Self-delete protection → Task 4 ✅
- User changes audited → inherited (`User` already uses `IsAudited`) ✅
- Personal profile/password → already provided by the starter kit (out of scope) ✅

**Type consistency:** `UserData::fromModel(User)`, `UserController` (index/create/store/edit/update/destroy), `StoreUserRequest`/`UpdateUserRequest`, route names `users.*`, `syncRoles` usage are consistent across tasks. Route-model binding `{user}` → `App\Models\User`.

**Placeholder scan:** every code step has complete code; no TBD/TODO.

**Known choices:**
- `StoreUserRequest`/`UpdateUserRequest` `authorize()` return `true`; the route `can:users.*` middleware is the gate (present on every endpoint).
- No "last super-admin" protection on delete/role-removal beyond self-delete — acceptable for the template; a single self-delete guard prevents the common lockout.

---

## Next plan

**Plan 5 — Skill pipeline + Scramble API docs:** the `.claude/skills/` lifecycle skills (`feature-brainstorm`, `plan-feature`, `create-module`, `add-resource`, `add-action`, `add-audit`, `add-permission`, `review-module`, `finish-feature`) codifying the conventions used across the Audit/Rbac/Users modules as worked examples, plus `dedoc/scramble` API docs wired into the gate. This completes the template.
