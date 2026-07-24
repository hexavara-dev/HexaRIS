# Merge Auth + Rbac + Users into an `Iam` Bounded-Context Module — Design

**Date:** 2026-06-11
**Status:** Approved (user said "gas langsung sampe open PR")

## Goal

Reorganize the template's platform modules around **DDD bounded contexts** instead of "one feature =
one module". Merge the three Identity & Access modules — `Auth` (authentication), `Users` (identity),
`Rbac` (authorization) — into a single **`Iam`** (Identity & Access Management) bounded-context module
that holds those aggregates internally. `Audit` stays a separate context (cross-cutting
observability). End state: **2 modules — `Iam` + `Audit`**.

## Why (decisions from brainstorming)

- The three IAM modules share one ubiquitous language (User, Role, Permission, Credential) → they are
  **one bounded context**, not three. Modeling them as one module is the DDD-orthodox choice.
- The user explicitly rejected the "1 feature = 1 module" rule ("nanti jadi aneh"). The new convention
  is **1 module = 1 bounded context** (may contain several aggregates/resources).
- The loss of three standalone CRUD reference modules is accepted; **example business modules will be
  added later** (out of scope here) to serve that teaching role.
- Internal layout: **layer-first + per-aggregate subfolders** (keeps the module skeleton and the
  existing Vite page resolver; minimal module-system change).

## Route renaming → the `iam` context

Routes move under the `iam` context — **both names and URLs** (the user chose full consistency):

| Old name | Old URL | New name | New URL |
|---|---|---|---|
| `users.*` | `/users` | `iam.users.*` | `/iam/users` |
| `rbac.roles.*` | `/rbac/roles` | `iam.roles.*` | `/iam/roles` |
| `rbac.permissions.*` | `/rbac/permissions` | `iam.permissions.*` | `/iam/permissions` |
| `login` / `logout` | `/login` `/logout` | **unchanged** | **unchanged** |

`login`/`logout` keep their names + URLs (the framework redirects guests to `route('login')`).
Implementation: in `Iam/routes/web.php`, wrap the three resources in
`Route::middleware('auth')->prefix('iam')->name('iam.')->group(...)`. **Every frontend `route('users.*')`
/ `route('rbac.*')` call (nav, pages, `<Link>`s) and every test asserting these names/URLs must be
updated** to the new names — this is the accepted churn.

## What stays UNCHANGED (risk containment)

- **Permission names:** `users.viewAny|create|update|delete`, `roles.viewAny|create|update|delete`,
  `permissions.viewAny`. They are **resource-scoped**, not module-scoped — merging modules doesn't
  change the resources. Only the per-module `permissions.php` files consolidate into one
  `Iam/permissions.php`.
- **`User` model stays at `app/Models/User.php`** — Laravel convention, `config/auth.php`
  `providers.users.model`, the `UserFactory`, and dozens of `use App\Models\User`. `Iam` *manages*
  users but the shared identity model stays in its conventional spot. (The `Role` model **does** move
  — it lives only in the Rbac module today.)

## Target structure

```
app/Modules/Iam/
  module.json                       # {name: Iam, alias: iam, dependencies: []}
  permissions.php                   # users.*, roles.*, permissions.viewAny (consolidated)
  README.md
  Providers/IamServiceProvider.php  # super-admin Gate::before (moved from RbacServiceProvider)
  routes/web.php                    # login(guest)+logout(auth); iam-prefixed group → /iam/users, /iam/roles, /iam/permissions
  routes/api.php                    # empty stub (convention)
  Http/
    Controllers/
      AuthenticatedSessionController.php
      UserController.php
      RoleController.php
      PermissionController.php
    Requests/
      LoginRequest.php
      StoreUserRequest.php  UpdateUserRequest.php
      StoreRoleRequest.php  UpdateRoleRequest.php
  Models/Role.php                   # extends Spatie\Permission\Models\Role
  Data/UserData.php  Data/RoleData.php
  Database/Seeders/RbacSeeder.php
  resources/js/pages/
    Login.tsx
    users/{Index,Form}.tsx
    roles/{Index,Form}.tsx
    permissions/Index.tsx
app/Modules/Audit/                  # unchanged
```

Inertia render strings change from the old module namespaces to the `Iam` one:
`Users::pages/Index` → `Iam::pages/users/Index`; `Rbac::pages/roles/Index` → `Iam::pages/roles/Index`;
`Rbac::pages/permissions/Index` → `Iam::pages/permissions/Index`; `Auth::pages/Login` →
`Iam::pages/Login`. The resolver (`resources/js/app.tsx`,
`app/Modules/{module}/resources/js/{pagePath}`) handles this without change.

## What moves / changes

1. **Create `Iam` module** (`module:make Iam`, then strip the unused scaffold like the Auth module was).
2. **Move all three aggregates' code** into `Iam` with namespace `App\Modules\Iam\...`, updating
   controller `Inertia::render(...)` strings and relocating page files into the subfolders above.
2b. **Rename the routes** to the `iam` context (names + URLs per the table above); update every
   frontend `route('users.*')` / `route('rbac.*')` call (nav, pages, `<Link>`s) accordingly. The
   `login`/`logout` routes are untouched.
3. **Move `Role` model** → `App\Modules\Iam\Models\Role` (update its references: `RoleData`,
   `RoleController`, anything type-hinting it).
4. **Move super-admin `Gate::before`** from `RbacServiceProvider` → `IamServiceProvider`.
5. **Move `RbacSeeder`** → `App\Modules\Iam\Database\Seeders\RbacSeeder`; update
   `database/seeders/DatabaseSeeder.php`.
6. **Consolidate `permissions.php`** into one `Iam/permissions.php`; `php artisan permission:sync`
   stays green.
7. **Delete the three old modules** (`app/Modules/{Auth,Users,Rbac}`) and drop the now-internal
   `Users → rbac` dependency.
8. **Update the 7 tests** that assert Inertia component names
   (`tests/Feature/{Rbac,Auth,Users}/*`, `ModulePageRendersTest`) to the `Iam::pages/...` strings.
   Route-name / permission / behavior assertions are unchanged. Test directories can stay where they
   are (top-level `tests/Feature/...`); they are not module-bound.
9. **Regenerate `docs/endpoints.md`** (controllers now under `App\Modules\Iam\...`).

## Convention shift (docs + skills)

Update the template's guidance from "1 module = 1 entity/feature" to **"1 module = 1 bounded context"**:

- `docs/conventions.md`, `CLAUDE.md`, `README.md`: a module is a bounded context that may contain
  several aggregates/resources. `create-module` = a new bounded context; `add-resource` /
  `add-action` add a resource/operation **into an existing context** (e.g. into `Iam`, or a new
  context). Remove the old "managed entity → its own module" framing.
- Build skills `.claude/skills/{create-module,add-resource,add-action,feature-brainstorm,plan-feature}/SKILL.md`:
  reflect the same. `add-resource`'s canonical CRUD reference shifts from "the Users module" to "the
  `users` aggregate inside the `Iam` module" (same code, new location).

## Testing

- `composer check` (Pint + PHPStan L6 + Pest) green at every commit; route-name/permission/policy
  tests pass unchanged; component-name assertions updated to `Iam::pages/...`.
- `npm run types` + `npm run lint` + `npm run build` green; the Vite manifest contains the relocated
  `Iam` pages.
- `php artisan route:list` shows the same route names pointing at `App\Modules\Iam\...` controllers;
  `permission:sync` syncs the same permission set.
- **Live verification:** login as `admin@example.com`/`password`; `/users` (sort/filter/CRUD),
  `/rbac/roles` (create/edit/delete, super-admin protected), `/rbac/permissions`, `/audit` all render
  and work; super-admin bypass intact; logout. No console errors.

## Out of scope (YAGNI / later)

- Adding example **business-domain** modules (the future "CRUD reference" modules) — separate effort.
- Moving the `User` model out of `app/Models`.
- Renaming **permission** names — they stay resource-scoped (`users.*`, `roles.*`, `permissions.*`).
- Renaming `login`/`logout`.
- Physical nesting of modules under context folders, or a `module.json` `group` field (the merge
  itself is the reorganization; grouping was the rejected Option A).
- Changing the `Audit` module.

## Risks & mitigations

- **Route-name collision during the move** (old + new module both defining `users.index`) → move each
  aggregate's routes and delete its old module in the **same** task; never run with both registered.
- **Broken Inertia page resolution** (wrong `Iam::pages/...` path) → `npm run build` + the
  `ModulePageRendersTest` regression test + live smoke catch it.
- **Super-admin bypass lost** when `Gate::before` moves → a Pest test already covers the super-admin
  gate (`SuperAdminGateTest`); keep it green; live-verify the bypass.
- **`permission:sync` drift** when consolidating `permissions.php` → run it in the gate; the permission
  set is identical, only its declaring file changes.
- **Stale references** to `App\Modules\{Auth,Users,Rbac}\...` (DatabaseSeeder, tests, the Role model,
  module deps) → a grep sweep + PHPStan (it flags unknown classes) + `composer check`.
- **Missed `route()` call after renaming** (`route('users.index')` left dangling) → Ziggy throws at
  runtime for an unknown name; caught by a grep sweep for old names + `npm run build` + live smoke.
  A dangling old route name also surfaces in tests that hit the route by name.
