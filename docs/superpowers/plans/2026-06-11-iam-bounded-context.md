# Merge Auth + Rbac + Users into an `Iam` Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the three Identity & Access modules (`Auth`, `Users`, `Rbac`) into one `Iam`
bounded-context module (aggregates Auth/Users/Roles/Permissions inside), rename their routes to the
`iam` context, and shift the template's convention to "1 module = 1 bounded context". `Audit` stays.

**Architecture:** Sequence per aggregate to keep the suite green at every commit. Each move + its old
module's deletion happen in the **same** task (so route names never collide). `User` model stays at
`app/Models/User`; permission names stay resource-scoped (`users.*`, `roles.*`, `permissions.*`);
`login`/`logout` route names + URLs stay. Everything else moves into `App\Modules\Iam\...`, pages to
`Iam::pages/...`, and resource routes to `iam.*` @ `/iam/...`.

**Tech Stack:** Laravel 12.61, PHP 8.4, Inertia v2 + React 19 + TS, Pest, spatie/permission. Module
system: `php artisan module:make`, flat discovery, pages resolved as `Module::pages/Path` →
`app/Modules/Module/resources/js/pages/Path.tsx`.

**Branch:** `refactor/iam-module` (exists, spec committed). PR title type: `refactor`. **After opening
the PR, STOP and wait for the author's explicit approval before merging** (per `CONTRIBUTING.md`).

Reference spec: `docs/superpowers/specs/2026-06-11-iam-bounded-context-design.md`.

**Grounded facts:**
- Page resolver (`resources/js/app.tsx`): `Iam::pages/users/Index` → `app/Modules/Iam/resources/js/pages/users/Index.tsx`. No resolver change needed.
- Super-admin `Gate::before` is in `app/Modules/Rbac/Providers/RbacServiceProvider.php:19-20` → moves to `IamServiceProvider`.
- `database/seeders/DatabaseSeeder.php` references `App\Modules\Rbac\Database\Seeders\RbacSeeder`.
- `Role` model: `app/Modules/Rbac/Models/Role.php` (extends `Spatie\Permission\Models\Role`). Permission uses Spatie's default model (no custom one).
- Tests asserting Inertia component names: `tests/Feature/{Rbac,Auth,Users}/*`, `ModulePageRendersTest`.
- Module web routes auto-register under the `web` group via `ModuleServiceProvider::bootModule()` (no provider edit needed).
- `git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "..."`. Feature branch; never `--no-verify`.

---

## Task 1: Create `Iam` module + move the Auth aggregate (login/logout)

**Goal:** stand up `Iam`, move login/logout in, delete the `Auth` module. `login`/`logout` names + URLs unchanged.

- [ ] **Step 1 — Scaffold + strip.** `php artisan module:make Iam`. Inspect `find app/Modules/Iam -maxdepth 2`. Keep `module.json`, `Providers/IamServiceProvider.php`, and create `Http/`, `routes/`, `resources/js/pages/`. Strip what isn't needed yet (will re-add Models/Data/Database in Task 2-3): leave `Models/`, `Data/`, `Database/` for now if `module:make` made them (harmless), but `rm -rf app/Modules/Iam/{Actions,Services,Policies,tests}` and `rm -f app/Modules/Iam/permissions.php` (re-created in Task 2). Set `module.json`:
  ```json
  { "name": "Iam", "alias": "iam", "version": "1.0.0", "description": "Identity & Access Management (auth, users, roles, permissions)", "dependencies": [] }
  ```
- [ ] **Step 2 — Move the Auth controller + request.** Move `app/Modules/Auth/Http/Controllers/AuthenticatedSessionController.php` → `app/Modules/Iam/Http/Controllers/AuthenticatedSessionController.php` (namespace `App\Modules\Iam\Http\Controllers`; `create()` renders `Iam::pages/Login`). Move `app/Modules/Auth/Http/Requests/LoginRequest.php` → `app/Modules/Iam/Http/Requests/LoginRequest.php` (namespace `App\Modules\Iam\Http\Requests`; update the `use` in the controller).
- [ ] **Step 3 — Move the login page.** `git mv app/Modules/Auth/resources/js/pages/Login.tsx app/Modules/Iam/resources/js/pages/Login.tsx` (no code change; it imports `@/layouts/auth-layout`).
- [ ] **Step 4 — Iam routes.** Create `app/Modules/Iam/routes/web.php`:
  ```php
  <?php

  use App\Modules\Iam\Http\Controllers\AuthenticatedSessionController;
  use Illuminate\Support\Facades\Route;

  Route::middleware('guest')->group(function () {
      Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
      Route::post('login', [AuthenticatedSessionController::class, 'store']);
  });

  Route::middleware('auth')->group(function () {
      Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
  });
  ```
  Create an empty `app/Modules/Iam/routes/api.php` stub (`<?php // Iam api routes`).
- [ ] **Step 5 — Delete the Auth module.** `rm -rf app/Modules/Auth`.
- [ ] **Step 6 — Update the auth test component assertion.** In `tests/Feature/Auth/AuthenticationTest.php`, change the `->component('Auth::pages/Login')` assertion to `Iam::pages/Login`.
- [ ] **Step 7 — Verify + commit.**
  ```bash
  php artisan optimize:clear
  php artisan route:list | grep -E "login|logout"   # → App\Modules\Iam\...AuthenticatedSessionController
  composer check && npm run types && npm run lint && npm run build
  git add -A
  git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(iam): create Iam module, move login/logout from Auth"
  ```
  Expected green; `AuthenticationTest` passes (login/logout URLs + names unchanged).

---

## Task 2: Move the Users aggregate into `Iam` + rename routes to `iam.users.*` @ `/iam/users`

- [ ] **Step 1 — Move backend code.** Move into `app/Modules/Iam/` with namespace `App\Modules\Iam\...`:
  - `Http/Controllers/UserController.php` — update namespace; change `Inertia::render('Users::pages/Index')` → `'Iam::pages/users/Index'` and `'Users::pages/Form'` → `'Iam::pages/users/Form'` (check the actual render calls). Keep using `App\Models\User` (unchanged).
  - `Http/Requests/StoreUserRequest.php`, `UpdateUserRequest.php` — update namespace; if they reference `App\Modules\Rbac\...` (e.g. roles), update to `App\Modules\Iam\...`.
  - `Data/UserData.php` — update namespace.
- [ ] **Step 2 — Move pages.** `git mv app/Modules/Users/resources/js/pages/Index.tsx app/Modules/Iam/resources/js/pages/users/Index.tsx` and `Form.tsx` → `app/Modules/Iam/resources/js/pages/users/Form.tsx`.
- [ ] **Step 3 — Rename the route `route()` calls in those pages.** In the moved `users/Index.tsx` + `users/Form.tsx`, replace every `route('users.<x>')` → `route('iam.users.<x>')` (e.g. `users.store`→`iam.users.store`, `users.update`, `users.edit`, `users.create`, `users.destroy`, `users.index`).
- [ ] **Step 4 — Add the users routes to `Iam/routes/web.php`.** Inside (or add) the iam group:
  ```php
  Route::middleware('auth')->prefix('iam')->name('iam.')->group(function () {
      Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('can:users.viewAny');
      // ...create/store/edit/update/destroy mirroring the OLD app/Modules/Users/routes/web.php,
      //    keeping the same can:<perm> middleware and controller methods, just under this prefix/name group.
  });
  ```
  Read the old `app/Modules/Users/routes/web.php` and reproduce each route faithfully (same methods, same `can:` middleware) inside the `prefix('iam')->name('iam.')` group, so names become `iam.users.*` and URLs `/iam/users`. Add `use App\Modules\Iam\Http\Controllers\UserController;`.
- [ ] **Step 5 — Permissions.** Create/extend `app/Modules/Iam/permissions.php` to include the users permissions (`users.viewAny`, `users.create`, `users.update`, `users.delete`) — copy from the old `app/Modules/Users/permissions.php`.
- [ ] **Step 6 — Update the nav.** In the sidebar nav (find it: `resources/js/components/app-sidebar.tsx` or a nav-items config it imports), change the Users link's `route('users.index')` → `route('iam.users.index')` and any `can('users.viewAny')` stays the same (permission name unchanged).
- [ ] **Step 7 — Delete the Users module.** `rm -rf app/Modules/Users`.
- [ ] **Step 8 — Update Users tests.** In `tests/Feature/Users/*`: update `->component('Users::pages/...')` → `Iam::pages/users/...`; update any `route('users.*')` / `/users` URL references → `route('iam.users.*')` / `/iam/users`. Behavior/permission assertions unchanged. Also update `tests/Feature/ModulePageRendersTest.php` if it visits `/users` or asserts the Users component (→ `/iam/users`).
- [ ] **Step 9 — Verify + commit.**
  ```bash
  php artisan optimize:clear
  php artisan route:list | grep -E "iam.users|users"   # names iam.users.*, URLs /iam/users, controller App\Modules\Iam\...
  grep -rn "route('users\.\|Users::pages\|App\\\\Modules\\\\Users" resources/js app tests   # → no hits
  composer check && npm run types && npm run lint && npm run build
  git add -A
  git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(iam): move Users aggregate into Iam, rename routes to iam.users.*"
  ```

---

## Task 3: Move the Rbac aggregate (Roles + Permissions) into `Iam` + rename to `iam.roles.*`/`iam.permissions.*`

- [ ] **Step 1 — Move backend code** into `app/Modules/Iam/` (namespace `App\Modules\Iam\...`):
  - `Http/Controllers/RoleController.php`, `PermissionController.php` — update namespace; change render strings `Rbac::pages/roles/Index|Form` → `Iam::pages/roles/Index|Form`, `Rbac::pages/permissions/Index` → `Iam::pages/permissions/Index`. Update the `use App\Modules\Rbac\Models\Role` → `App\Modules\Iam\Models\Role` and `use ...Rbac\Data\RoleData` → `...Iam\Data\RoleData`.
  - `Http/Requests/StoreRoleRequest.php`, `UpdateRoleRequest.php` — namespace.
  - `Data/RoleData.php` — namespace; update any `Role` model import.
  - `Models/Role.php` — namespace `App\Modules\Iam\Models`; still `extends Spatie\Permission\Models\Role`.
  - `Database/Seeders/RbacSeeder.php` — namespace `App\Modules\Iam\Database\Seeders`; update its `Role` import to `App\Modules\Iam\Models\Role`.
- [ ] **Step 2 — Move pages.** `git mv` `app/Modules/Rbac/resources/js/pages/roles/{Index,Form}.tsx` → `app/Modules/Iam/resources/js/pages/roles/`, and `permissions/Index.tsx` → `app/Modules/Iam/resources/js/pages/permissions/Index.tsx`.
- [ ] **Step 3 — Rename `route()` calls in those pages.** `route('rbac.roles.<x>')` → `route('iam.roles.<x>')`; `route('rbac.permissions.<x>')` → `route('iam.permissions.<x>')`.
- [ ] **Step 4 — Add the roles + permissions routes to the `iam` group** in `Iam/routes/web.php` (read old `app/Modules/Rbac/routes/web.php`; reproduce faithfully inside `prefix('iam')->name('iam.')`, keeping `can:` middleware). Result: `iam.roles.*` @ `/iam/roles`, `iam.permissions.index` @ `/iam/permissions`. Add the controller `use`s.
- [ ] **Step 5 — Move super-admin `Gate::before`** from the old `RbacServiceProvider` into `app/Modules/Iam/Providers/IamServiceProvider.php` `boot()` (verbatim logic from `RbacServiceProvider.php:19-20`, with its imports).
- [ ] **Step 6 — Update `DatabaseSeeder`.** In `database/seeders/DatabaseSeeder.php`, change `use App\Modules\Rbac\Database\Seeders\RbacSeeder;` → `use App\Modules\Iam\Database\Seeders\RbacSeeder;` (the `$this->call(RbacSeeder::class)` line stays).
- [ ] **Step 7 — Permissions.** Append the Rbac permissions (`roles.viewAny|create|update|delete`, `permissions.viewAny`) to `app/Modules/Iam/permissions.php`.
- [ ] **Step 8 — Update the nav.** Change the Roles + Permissions links: `route('rbac.roles.index')` → `route('iam.roles.index')`, `route('rbac.permissions.index')` → `route('iam.permissions.index')`. Permission gates (`can('roles.viewAny')` etc.) unchanged.
- [ ] **Step 9 — Delete the Rbac module.** `rm -rf app/Modules/Rbac`.
- [ ] **Step 10 — Update Rbac tests.** In `tests/Feature/Rbac/*`: `->component('Rbac::pages/...')` → `Iam::pages/...`; `route('rbac.*')` / `/rbac/...` → `route('iam.*')` / `/iam/...`; `use App\Modules\Rbac\Models\Role` → `App\Modules\Iam\Models\Role`. The `SuperAdminGateTest` + role-protection tests stay green (behavior unchanged). Update `ModulePageRendersTest` for the `/iam/roles`, `/iam/permissions` URLs.
- [ ] **Step 11 — Verify + commit.**
  ```bash
  php artisan optimize:clear
  php artisan migrate:fresh --seed   # confirms RbacSeeder (new namespace) + super-admin still seed
  php artisan route:list | grep -E "iam.roles|iam.permissions"
  grep -rn "Rbac::pages\|route('rbac\.\|App\\\\Modules\\\\Rbac" resources/js app tests database   # → no hits
  composer check && npm run types && npm run lint && npm run build
  git add -A
  git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(iam): move Rbac aggregate into Iam, rename routes to iam.roles/iam.permissions"
  ```
  Expected: green; super-admin bypass + role protection intact.

---

## Task 4: Sweep, regenerate endpoint docs, full gate

- [ ] **Step 1 — Empty-dir + stale-ref sweep.**
  ```bash
  for d in app/Modules/Auth app/Modules/Users app/Modules/Rbac; do [ -d "$d" ] && echo "STILL EXISTS: $d"; done
  grep -rn "App\\\\Modules\\\\Auth\|App\\\\Modules\\\\Users\|App\\\\Modules\\\\Rbac\|Users::pages\|Rbac::pages\|Auth::pages\|route('users\.\|route('rbac\." app/ resources/js/ routes/ tests/ database/ bootstrap/ config/
  ```
  Expected: no hits. Fix anything found.
- [ ] **Step 2 — Regenerate endpoint docs.** `php artisan optimize:clear && php artisan app:endpoints`. Confirm `docs/endpoints.md` shows `iam.users.*` @ `/iam/users`, `iam.roles.*` @ `/iam/roles`, `iam.permissions.index` @ `/iam/permissions`, `login`/`logout`, controllers under `App\Modules\Iam\...`; no `Users`/`Rbac`/`Auth` rows.
- [ ] **Step 3 — Full gate.** `composer check && npm run types && npm run lint && npm run build`. All green.
- [ ] **Step 4 — Commit** (if anything changed): `git add -A && git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "chore(iam): regenerate endpoint inventory and clean up stale references"`. If nothing changed, report and skip.

---

## Task 5: Convention shift — "1 module = 1 bounded context"

- [ ] **Step 1 — Docs.** Update `docs/conventions.md`, `CLAUDE.md`, `README.md`: replace the "1 module = 1 feature/entity; managed entity → its own module" framing with **"a module is a bounded context that may contain several aggregates/resources"**. State: `create-module` = a new bounded context; `add-resource`/`add-action` add a resource/operation **into an existing context** (the canonical CRUD reference is now the `users` aggregate inside the `Iam` module). Update the "Built-in modules" lists to `Iam` (`/login`, `/iam/users`, `/iam/roles`, `/iam/permissions`) + `Audit` (`/audit`).
- [ ] **Step 2 — Build skills.** Update `.claude/skills/{create-module,add-resource,add-action,feature-brainstorm,plan-feature}/SKILL.md` to the new convention: `add-resource` mirrors the `users` aggregate **inside `Iam`** (not a standalone Users module); `create-module` is for a new bounded context; the `add-resource` vs `add-action` decision is "new resource in a context" vs "single operation". Replace path references `app/Modules/Users` → `app/Modules/Iam` (users aggregate) where they point to the CRUD exemplar.
- [ ] **Step 3 — Module READMEs.** Write `app/Modules/Iam/README.md` (describe the context + its four aggregates, routes, permissions). Leave `app/Modules/Audit/README.md` as-is.
- [ ] **Step 4 — Verify + commit.**
  ```bash
  grep -rn "1 module = 1\|one module per\|managed entity\|app/Modules/Users\|app/Modules/Rbac\|app/Modules/Auth" docs/ CLAUDE.md README.md .claude/skills/   # → only intentional/historical (docs/superpowers/* untouched)
  composer check
  git add -A
  git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "docs: shift convention to one module per bounded context (Iam)"
  ```

---

## Task 6: Live verification

- [ ] Drive the real app in Chrome (built assets + `php artisan migrate --seed` + `php artisan serve`; playwright-core/Chrome installed transiently and removed after; `git checkout package.json package-lock.json` at the end). As `admin@example.com`/`password`, verify:
  1. Login → dashboard; `/iam/users` lists users, sort/filter/create/edit/delete work (a CRUD round-trip persists).
  2. `/iam/roles` create/edit/delete; the `super-admin` role is protected (can't edit/delete); `/iam/permissions` lists.
  3. Super-admin bypass intact (admin sees all nav + can do everything).
  4. Nav links point at the new `/iam/...` URLs; `/audit` still renders; logout works.
  5. No console errors; no Ziggy "route not defined" errors.
  Screenshot key pages. Clean up transient deps; confirm `git status` clean.

---

## Task 7: Open the PR — then STOP for approval

- [ ] **Step 1 — Final gate.** `composer check && npm run types && npm run lint && npm run build`.
- [ ] **Step 2 — Push + PR.** `git push -u origin refactor/iam-module`; `gh pr create --title "refactor: merge auth/rbac/users into an Iam bounded-context module"` with a body summarizing the merge, the route rename table, the convention shift, and the test plan (gate + live verify).
- [ ] **Step 3 — Wait for CI, then STOP.** Watch `gh pr checks <n>`. When green, **report the PR URL + CI status and wait for the author's explicit approval. Do NOT run `gh pr merge`** (per `CONTRIBUTING.md` — never auto-merge).

---

## Self-Review

**Spec coverage:** Iam module + 4 aggregates (Tasks 1-3) ✓; route rename to iam.*/`/iam` with login/logout kept (Tasks 1-3) ✓; permission names + User model unchanged (kept throughout) ✓; Role model + RbacSeeder + super-admin gate moved (Task 3) ✓; delete 3 old modules (Tasks 1-3) ✓; convention shift docs + skills (Task 5) ✓; endpoint regen (Task 4) ✓; tests updated (Tasks 1-3) ✓; live verify (Task 6) ✓; PR + approval gate (Task 7) ✓.

**Placeholder scan:** transformation steps reference real files + exact namespace/render/route changes + verification greps; the implementer reads the actual route/page files (faithful reproduction) rather than the plan reproducing every line — appropriate for a move/rename refactor.

**Ordering safety:** each aggregate's move + its old module's deletion + its route rename + its frontend `route()` updates + its tests happen in one task → no route-name collision, suite green at each commit. Nav `route()` calls are updated in the same task that renames each resource's routes (Task 2 users, Task 3 roles/permissions) so no dangling `route()` is left between commits.

**Consistency:** module namespace `App\Modules\Iam\...`, pages `Iam::pages/{Login,users/*,roles/*,permissions/*}`, route names `iam.users.*`/`iam.roles.*`/`iam.permissions.*` (login/logout kept), permissions `users.*`/`roles.*`/`permissions.*` (unchanged) — used consistently across controllers, routes, nav, tests.
