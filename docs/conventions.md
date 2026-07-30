# Conventions

Source of truth for AI agents and developers working in this repo.
Read alongside `CONTRIBUTING.md` before writing any code.

---

## 1. Modules

A module is a **bounded context** that may contain several aggregates/resources.
Each context lives in a self-contained directory under `app/Modules/<Name>/`
(PascalCase) — its routes, controllers, FormRequests, DTOs, React pages,
migrations, and permission declarations together. A single context can own
multiple resources: e.g. the `Iam` context contains the Auth, Users, Roles, and
Permissions aggregates.

**Skill decision:** `create-module` scaffolds a **new bounded context**;
`add-resource` adds a CRUD resource **into a context** (an existing one like
`Iam`, or a new one); `add-action` adds a single operation into a context. Adding
an entity does **not** mean creating a new module — choose the context it belongs
to first.

### Scaffold a new module

```bash
php artisan module:make Blog   # creates app/Modules/Blog/
php artisan permission:sync    # registers declared permissions in DB
```

`MakeModuleCommand` (`app/Modular/Console/MakeModuleCommand.php`) creates the
full directory tree and stubs the required files:

```
app/Modules/Blog/
  module.json                   # manifest (name, alias, version, dependencies)
  permissions.php               # permission declarations
  routes/web.php                # auto-loaded under web middleware
  routes/api.php                # auto-loaded under api middleware + /api prefix
  Providers/BlogServiceProvider.php
  Http/Controllers/
  Http/Requests/
  Data/
  Models/
  Actions/
  Database/Migrations/          # auto-loaded by ModuleServiceProvider
  resources/js/pages/           # React pages for this module
  resources/js/components/
  tests/Feature/
  tests/Unit/
```

### Auto-registration

`ModuleServiceProvider` (`app/Modular/ModuleServiceProvider.php`) discovers
every `app/Modules/*/module.json` at boot time and automatically:

- Registers the module's `Providers/<Name>ServiceProvider`.
- Loads `Database/Migrations/` via `loadMigrationsFrom`.
- Mounts `routes/web.php` under the `web` middleware group.
- Mounts `routes/api.php` under the `api` middleware group with `/api` prefix.

No manual registration is needed — adding `module.json` is enough.

### module.json

```json
{
    "name": "Iam",
    "alias": "iam",
    "version": "1.0.0",
    "description": "Identity & Access Management (auth, users, roles, permissions)",
    "dependencies": []
}
```

Required fields: `name` (PascalCase), `alias` (kebab-case), `version`.
`dependencies` lists other module aliases this module relies on.

### React pages — namespaced resolver

Pages live at `app/Modules/<Name>/resources/js/pages/<Page>.tsx`.
Reference them in controllers with the `Name::` namespace prefix:

```php
// app/Modules/Iam/Http/Controllers/UserController.php
return Inertia::render('Iam::pages/users/Index', ['users' => $users]);
return Inertia::render('Iam::pages/users/Form',  ['user' => null, 'roles' => $roles]);
```

The Inertia resolver in `resources/js/app.tsx` splits on `::` and resolves to
`app/Modules/<Name>/resources/js/<pagePath>.tsx`:

```ts
if (name.includes('::')) {
    const [moduleName, pagePath] = name.split('::');
    return resolvePageComponent(
        `../../app/Modules/${moduleName}/resources/js/${pagePath}.tsx`,
        modulePages,
    );
}
```

### Portability

Modules are portable by design. To move a module between projects, copy the
`app/Modules/<Name>/` directory and run `php artisan permission:sync`. No
changes to `config/` or `bootstrap/` are required.

---

## 2. Permissions & RBAC

### Permission name format

```
<resource>.<action>
```

- `<resource>`: lowercase, matches the module alias or domain noun (e.g. `users`, `roles`, `audit`).
- `<action>`: camelCase; canonical set is `viewAny | view | create | update | delete`; domain verbs
  are allowed (e.g. `approve`, `export`).

Valid examples from `app/Modules/Iam/permissions.php` (one context, several
aggregates — users, roles, permissions):

```php
// app/Modules/Iam/permissions.php
return [
    'users.viewAny', 'users.create', 'users.update', 'users.delete',
    'roles.viewAny', 'roles.create', 'roles.update', 'roles.delete',
    'permissions.viewAny',
];
```

`PermissionRegistry::isValidName()` enforces the pattern
`/^[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9]*$/` — any other format is rejected
by `permission:sync`.

### Syncing permissions

```bash
php artisan permission:sync           # upserts declared permissions
php artisan permission:sync --prune   # also deletes permissions no longer declared
```

Run after adding or removing entries in any `permissions.php`. The command
validates names first and exits non-zero on any invalid entry.

### Gating routes

Always attach the `can:` middleware directly on the route — not in the
FormRequest `authorize()`:

```php
// app/Modules/Iam/routes/web.php — the users aggregate, grouped under the iam.* prefix
Route::middleware('auth')->prefix('iam')->name('iam.')->group(function () {
    Route::get('users',             [UserController::class, 'index'])
        ->name('users.index')->middleware('can:users.viewAny');
    Route::post('users',            [UserController::class, 'store'])
        ->name('users.store')->middleware('can:users.create');
    Route::put('users/{user}',      [UserController::class, 'update'])
        ->name('users.update')->middleware('can:users.update');
    Route::delete('users/{user}',   [UserController::class, 'destroy'])
        ->name('users.destroy')->middleware('can:users.delete');
});
```

Route **names** carry the context prefix (`iam.users.index`, `iam.roles.index`)
while the **permission** names stay resource-scoped (`users.viewAny`,
`roles.create`).

### Assigning permissions to roles

Manage roles and their permissions through the Iam module UI (`/iam/roles`).
Programmatically use spatie/laravel-permission:

```php
$role->givePermissionTo('users.viewAny');
$user->assignRole('editor');
```

### super-admin bypass

`IamServiceProvider` registers a `Gate::before` callback that grants all
permissions to any user with the `super-admin` role:

```php
// app/Modules/Iam/Providers/IamServiceProvider.php
Gate::before(function (Authorizable $user): ?bool {
    return $user instanceof Model
        && method_exists($user, 'hasRole')
        && $user->hasRole('super-admin') ? true : null;
});
```

Returning `null` (when the user is not super-admin) lets normal gate checks
proceed.

---

## 3. CRUD shape — the `users` aggregate in `app/Modules/Iam` as the canonical example

**Build-skill choice:** an entity users list/create/edit/delete → use the `add-resource` skill
(it adds the resource into a chosen bounded context); a single operation
(approve/export/sync/one endpoint) → use the `add-action` skill.

Follow this shape for every new CRUD resource.

### FormRequests

- One request class per mutation: `StoreXRequest` / `UpdateXRequest`.
- `authorize()` always returns `true` — the `can:` route middleware is the
  actual guard; the FormRequest only validates.
- Unique-email rules use `Rule::unique()->ignore($id)` on update.

```php
// app/Modules/Iam/Http/Requests/StoreUserRequest.php
public function authorize(): bool { return true; } // route enforces can:users.create

public function rules(): array {
    return [
        'name'    => ['required', 'string', 'max:255'],
        'email'   => ['required', 'email', 'unique:users,email'],
        'password'=> ['required', 'string', 'min:8'],
        'roles'   => ['sometimes', 'array'],
        'roles.*' => ['string', 'exists:roles,name'],
    ];
}
```

### Controller

Keep controllers thin — no business logic, no direct DB calls beyond
retrieving/persisting the model. Seven conventional methods only
(`index / create / store / edit / update / destroy`).

```php
// app/Modules/Iam/Http/Controllers/UserController.php
public function index(): Response
{
    $users = User::query()->with('roles')->orderBy('name')
        ->get()
        ->map(fn (User $u) => UserData::fromModel($u));

    return Inertia::render('Iam::pages/users/Index', ['users' => $users]);
}

public function store(StoreUserRequest $request): RedirectResponse
{
    $user = User::create($request->safe()->only(['name', 'email', 'password']));
    $user->syncRoles($request->input('roles', []));
    return redirect()->route('iam.users.index');
}
```

### DTO (spatie/laravel-data)

Every response shape is a typed DTO. Never expose `$hidden` model attributes
(passwords, tokens, secrets) — omit them from the DTO constructor entirely.

```php
// app/Modules/Iam/Data/UserData.php
class UserData extends Data {
    public function __construct(
        public int    $id,
        public string $name,
        public string $email,
        public array  $roles,      // no `password` — it's in User::$hidden
        public string $createdAt,
    ) {}

    public static function fromModel(User $user): self { ... }
}
```

### List pages use `DataTable` (client-side by default)

`DataTable` (`@/components/data-table`) defaults to **client-side** mode: the controller returns
the full list as a plain array (no pagination, no `sort`/`filter` query params), and
search/sort/filter/pagination are computed in the browser with zero network calls on interaction.
This is right for small/bounded lists (users, roles, employees). `mode="server"` is the deliberate
exception for datasets that grow without bound — see the Audit log
(`app/Modules/Audit/resources/js/pages/Index.tsx`), which keeps pagination server-driven and passes
a `Paginated<T>` instead of a plain array.

```php
class PostController
{
    public function index(): Response
    {
        $posts = Post::query()->with('category')->orderBy('name')
            ->get()
            ->map(fn (Post $p) => PostData::fromModel($p));

        return Inertia::render('Blog::pages/Index', ['posts' => $posts]);
    }
}
```

The React `Index.tsx` uses `AppLayout` + `PageHeader` + `<DataTable columns={columns} data={items} search={...} filters={...} rowActions={(row) => [...]} />` from `@/components/data-table`. `search` is a single free-text `SearchConfig` (keys + placeholder); `filters` is a list of `FilterConfig` toolbar controls; `rowActions` returns the per-row `RowAction[]` (Edit/Delete) and replaces the old manual `RowActionMenu` column. Deletes are confirmed via `ConfirmDialog` (from `@/components/confirm-dialog`) driven by local state — never `window.confirm()`. The canonical example is `app/Modules/Iam/resources/js/pages/users/Index.tsx`.

Breadcrumbs, the browser tab title, and the sidebar are derived automatically from the current URL via `resources/js/lib/navigation.ts` — `AppLayout` does not take a manual `breadcrumbs` prop for the common case; only pass one to override the derived trail.

Mutations (store/update/destroy) flash success state via Inertia flash / toasts (Plan C). No native alert/confirm dialogs.

### React pages

Two files per resource: `Index.tsx` (list + delete) and `Form.tsx` (create/edit).

- `Index.tsx` receives `{ items: XRow[] }` (or `{ items: Paginated<XRow> }` + `mode="server"` for the unbounded exception); renders `AppLayout` + `PageHeader` + `DataTable` with `search`/`filters`/`rowActions` props + `ConfirmDialog` for deletes.
- `Form.tsx` receives a nullable DTO (`user: UserRow | null`) and a list of available options
  (`roles: string[]`); uses Inertia `useForm` and calls `post` or `put` based on whether the
  record exists. Wraps the form in `FormLayout` and each field in `FormField`.

### Feature tests

Every mutation endpoint needs **at least** a 403 test (unauthenticated / unpermissioned user) **and**
a happy-path test. Follow the pattern in `tests/Feature/Users/`:

```php
// tests/Feature/Users/UserStoreTest.php
it('forbids creating a user without users.create', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/iam/users', [])->assertForbidden();
});

it('creates a user with a role and a hashed password', function () {
    $admin = User::factory()->create()->givePermissionTo('users.create');
    $this->actingAs($admin)->post('/iam/users', [...$payload])->assertRedirect();
    // assert DB state and side-effects
});
```

Test files live in `tests/Feature/<ModuleName>/` (not inside the module
directory), matching the existing layout:
`tests/Feature/Users/UserIndexTest.php`, `UserStoreTest.php`,
`UserUpdateTest.php`, `UserDestroyTest.php`.

---

## 4. Auditing

### IsAudited trait — automatic model auditing

Add `App\Audit\Concerns\IsAudited` to any Eloquent model that needs an
automatic audit trail. The trait hooks into `created`, `updated`, and `deleted`
events and calls `AuditLogger::atomic()` for each, recording `before` and
`after` snapshots.

**Hidden attributes are never recorded.** Any field in `$hidden` (e.g.
`password`, API tokens) is stripped via `auditableAttributes()` before writing.

```php
use App\Audit\Concerns\IsAudited;

class Invoice extends Model {
    use IsAudited;

    protected $hidden = ['internal_notes']; // excluded from audit snapshots
}
```

### AuditLogger — manual / explicit auditing

Use `AuditLogger` directly when the change happens outside Eloquent (Query
Builder, raw SQL, external APIs) or when you need to log a domain event.

Fluent builder API:

```php
AuditLogger::atomic()               // or ::async()
    ->subject('orders', $order->id)
    ->before($oldAttributes)
    ->after($newAttributes)
    ->event('approved')
    ->module('orders')
    ->log('Order approved');
```

**`::atomic()`** — writes synchronously via `AuditWriter` inside the current
DB transaction. Use for critical business events where the audit record must
roll back if the transaction rolls back.

**`::async()`** — dispatches a `WriteAuditLog` job to the queue. Use for
high-volume or non-critical events where you don't want synchronous overhead.

### Audit viewer

The read-only viewer is at `GET /audit` (`audit.index`), gated by `can:audit.view`.
It supports filters: event type, module, date range, and causer. See
`app/Modules/Audit/README.md` for the full filter reference.

Auth events (login / logout / failed) are captured automatically by
`AuditEventSubscriber`.

---

## 5. Quality gate & workflow

### Local gate

```bash
composer check        # Pint (style) + PHPStan level 6 + Pest — must be green
npm run build         # Vite asset build — must succeed
```

`composer check` is an alias for `@pint && @stan && @test`
(see `composer.json` `scripts`). Never submit a PR with a failing gate.

### Automated enforcement layers

| Layer | When | What |
|-------|------|------|
| **Lefthook pre-commit** | Every local commit | Pint + Prettier + ESLint on staged files (auto-fix) |
| **Lefthook pre-push** | Before push | Pint `--test` + PHPStan; blocks push to `main` |
| **GitHub Actions CI** | Every PR | Full `composer check` + frontend checks + asset build + PR-title lint |
| **Claude Code hook** | Claude sessions | `guard-main.sh` blocks commit/push to `main` |

### Branching and merge strategy

- **Never commit directly to `main`.** Create a feature branch:
  ```bash
  git checkout -b feat/<short-name>   # or fix/, docs/, chore/, refactor/, test/
  ```
- **Squash and merge only.** The PR title becomes the single commit on `main`,
  so it must be a valid [Conventional Commit](https://www.conventionalcommits.org/):
  ```
  feat(users): add user management module
  fix(audit): write log inside transaction
  docs: add CLAUDE.md and conventions source of truth
  ```
- **Never auto-merge.** Opening the PR + green CI is not authorization to merge — **wait for the PR
  author to review and explicitly approve** before running `gh pr merge`. CI-green is a prerequisite,
  not approval.
- After merge, the branch is deleted automatically.

### Typical feature flow

```bash
git checkout -b feat/blog
php artisan module:make Blog
php artisan permission:sync
# implement, write tests
composer check && npm run build
git push -u origin feat/blog
gh pr create --title "feat(blog): add blog module"
# CI runs → request review → WAIT for author approval → Squash and merge
```

## 6. Theming / brand color

The brand accent is a single design token. To re-brand, edit `--primary` (and its `.dark` variant)
in `resources/css/app.css` — everything (buttons, active nav, focus rings, sidebar) derives from it.
The default is **teal**. `--radius: 0.5rem` controls corner rounding (moderate). Light/dark is
handled by the `use-appearance` hook; no per-token dark overrides are needed beyond the `.dark` block.
