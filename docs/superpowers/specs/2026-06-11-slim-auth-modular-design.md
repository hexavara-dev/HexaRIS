# Slim Starter-Kit Scaffolding + Modular Auth — Design

**Date:** 2026-06-11
**Status:** Approved (pending user review of this spec)

## Goal

Remove the Laravel React starter-kit scaffolding the template doesn't use, and relocate the surviving
authentication (email+password **login** and **logout**) into the module system under
`app/Modules/Auth/` — so auth follows the same self-contained, auto-registered pattern as every other
feature, and the template ships lean.

## Decisions (from brainstorming)

1. **Remove these auth flows entirely** (controllers + pages + routes + tests): public **registration**,
   **password reset** (`forgot-password` / `reset-password`), **email verification** (dead — `User`
   does not implement `MustVerifyEmail`), **password confirmation**.
2. **Remove the Settings area entirely**: `settings/profile` (incl. self-delete), `settings/password`,
   `settings/appearance` page — controllers, routes, pages, the settings layout, the `delete-user`
   component, and their tests.
3. **Preserve the theme toggle.** The only theme switcher today is the `settings/appearance` page.
   After removing it, wire the existing `appearance-dropdown` into the user-menu dropdown so light/dark
   stays switchable. Keep `use-appearance` + `initializeTheme`.
4. **Welcome → general.** Replace the Laravel-marketing `welcome.tsx` with a neutral, brand-agnostic
   landing (app name + one primary action: authenticated → "Dashboard", guest → "Log in"),
   theme-aware. The `/` route (`home`) stays.
5. **Modularize login/logout** into a new `Auth` module created with `php artisan module:make Auth`,
   then stripped of the scaffold it doesn't need (no Models/Actions/Services/Policies/Data/Database/
   permissions). Keep the route name `login` (the framework redirects guests to `route('login')`).
6. Keep working: email+password login/logout, `guest`/`auth` middleware, module routes
   (users/rbac/audit), `dashboard`, `/docs/routes`, `/docs/api`.

## Part A — Remove starter-kit scaffolding

### A1. Auth flows (delete)

Controllers (`app/Http/Controllers/Auth/`): `RegisteredUserController`, `PasswordResetLinkController`,
`NewPasswordController`, `EmailVerificationPromptController`, `VerifyEmailController`,
`EmailVerificationNotificationController`, `ConfirmablePasswordController`.
(`AuthenticatedSessionController` is **moved**, not deleted — see Part B.)

Pages (`resources/js/pages/auth/`): `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`,
`verify-email.tsx`, `confirm-password.tsx`. (`login.tsx` is **moved** — Part B.)

Tests (`tests/Feature/Auth/`): `RegistrationTest`, `PasswordResetTest`, `EmailVerificationTest`,
`PasswordConfirmationTest`. (`AuthenticationTest` is **rewritten** into the module — Part B.)

Routes: the `register`, `forgot-password`, `reset-password`, `verify-email`,
`email/verification-notification`, `confirm-password` definitions in `routes/auth.php` (the whole file
is deleted once `login`/`logout` move to the module).

### A2. Settings area (delete)

Controllers: `app/Http/Controllers/Settings/ProfileController.php`,
`app/Http/Controllers/Settings/PasswordController.php`. Any `app/Http/Requests/Settings/*`.

Routes: `routes/settings.php` (whole file) + its `require` in `routes/web.php`.

Pages: `resources/js/pages/settings/profile.tsx`, `password.tsx`, `appearance.tsx`. The settings
layout (`resources/js/layouts/settings/*` and/or `settings-layout.tsx`). The
`resources/js/components/delete-user.tsx` component. The `resources/js/components/appearance-tabs.tsx`
component (only used by the removed appearance page).

Tests (`tests/Feature/Settings/`): `ProfileUpdateTest`, `PasswordUpdateTest`.

### A3. Welcome → general landing

Replace `resources/js/pages/welcome.tsx` with a minimal, neutral landing: centered app name/logo and
one primary button — `route('dashboard')` "Go to dashboard" when `auth.user` is present, else
`route('login')` "Log in". Theme-aware (uses existing tokens). No Laravel-specific marketing copy,
illustrations, or external links. `/` route + name `home` unchanged.

## Part B — Modular Auth (`app/Modules/Auth/`)

Create with `php artisan module:make Auth`, then **strip** the unused scaffold (delete empty
`Models/`, `Actions/`, `Services/`, `Policies/`, `Data/`, `Database/`, and `permissions.php`; the
module declares no permissions and runs no migrations). Keep the generated manifest + service provider
so it auto-registers like other modules.

### B1. Backend

- `app/Modules/Auth/Http/Controllers/AuthenticatedSessionController.php` — moved from
  `app/Http/Controllers/Auth/`. Namespace `App\Modules\Auth\Http\Controllers`. Changes:
  - `create()` renders **`Auth::pages/Login`** and drops the `canResetPassword`/`status` props (those
    fed the removed reset flow).
  - `store(LoginRequest $request)` — unchanged behavior: authenticate, regenerate session, redirect
    `intended(route('dashboard', absolute: false))`.
  - `destroy()` — unchanged: logout web guard, invalidate session, regenerate token, redirect `/`.
- `app/Modules/Auth/Http/Requests/LoginRequest.php` — moved from `app/Http/Requests/Auth/`. Namespace
  updated. Rate-limiting + `authenticate()` logic unchanged.
- `app/Modules/Auth/routes/web.php`:
  ```php
  Route::middleware('guest')->group(function () {
      Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
      Route::post('login', [AuthenticatedSessionController::class, 'store']);
  });
  Route::middleware('auth')->group(function () {
      Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
  });
  ```
  Module web routes already run under the `web` group (session + CSRF); the per-route `guest`/`auth`
  middleware is layered on top. Route names `login` and `logout` are preserved.

### B2. Frontend

- `app/Modules/Auth/resources/js/pages/Login.tsx` — moved from `resources/js/pages/auth/login.tsx`,
  resolved as `Auth::pages/Login`. Trim: remove the "Sign up" (`route('register')`) link, the
  "Forgot password?" (`route('password.request')`) link, and the `status`/`canResetPassword` handling.
  Keep importing the **shared** `@/layouts/auth-layout` (the auth layout stays in
  `resources/js/layouts/`, used only by login now).

### B3. Tests

- Rewrite `AuthenticationTest` into the module's tests (e.g.
  `app/Modules/Auth/tests/Feature/AuthenticationTest.php`, matching how other modules place tests, or
  `tests/Feature/Auth/AuthenticationTest.php` if module test discovery isn't wired — verify during
  planning). Cover: login page renders the `Auth::pages/Login` component; valid credentials →
  redirect `dashboard` + authenticated; invalid credentials → error, stays guest; `logout` →
  guest + redirect `/`; an unauthenticated visit to a protected route redirects to `route('login')`;
  login rate-limiting still triggers.

## Part C — Ripple cleanup

- `routes/web.php`: drop `require __DIR__.'/settings.php';` and `require __DIR__.'/auth.php';`; keep
  `/` (`home`), `dashboard`, `/docs/routes`. Delete `routes/auth.php` + `routes/settings.php`.
- `resources/js/components/user-menu-content.tsx`: remove the `route('profile.edit')` link; **add a
  theme toggle** (reuse `appearance-dropdown` or an inline light/dark switch driven by
  `use-appearance`) so the design system's light/dark stays user-switchable; keep the `logout` link.
- Remove now-empty directories: `app/Http/Controllers/Auth/`, `app/Http/Controllers/Settings/`,
  `app/Http/Requests/Auth/`, `app/Http/Requests/Settings/`, `resources/js/pages/auth/` and
  `resources/js/pages/settings/` (if empty after moves/deletes).
- Grep-sweep for dangling references to removed route names (`register`, `password.request`,
  `password.reset`, `password.email`, `password.store`, `password.confirm`, `verification.*`,
  `profile.edit`, `profile.update`, `profile.destroy`, `password.edit`, `password.update`,
  `appearance`) across `resources/js` and `app/`; fix or remove each.
- After routes change, regenerate `docs/endpoints.md` via `php artisan app:endpoints` (it should drop
  to the lean set: `/`, dashboard, docs/routes, login, logout, users.*, rbac.*, audit).

## Testing

- New/rewritten module auth tests (Part B3) pass.
- All obsolete tests removed; the suite has no references to deleted controllers/routes.
- `php artisan route:list` shows only the intended lean route set; `route('login')`/`route('logout')`
  resolve; guest middleware redirects to `login`.
- Gate green: `composer check` (Pint + PHPStan L6 + Pest), `npm run types`, `npm run lint`,
  `npm run build`.
- **Live verification** (run skill / browser): guest hitting `/dashboard` → redirected to login;
  login with `admin@example.com`/`password` → dashboard; theme toggle in the user menu switches
  light/dark and persists; logout → `/` general landing; `/` while authenticated shows the
  "Dashboard" action. No console errors.

## Out of scope (YAGNI)

- Adding new auth features (2FA, social login, API token auth/Sanctum).
- Changing the login form's fields or the `LoginRequest` validation/rate-limit logic.
- Touching the module system internals (`app/Modular/*`) beyond what auto-registration already
  provides.
- Reworking the dashboard content.

## Risks & mitigations

- **`route('login')` resolution breaks** if the name isn't preserved → the module route explicitly
  names it `login`; a guest-redirect test guards it.
- **Theme toggle regression** (only switcher was the deleted page) → Part C adds a toggle to the user
  menu; live verification checks switching + persistence.
- **Dangling references** to removed routes (JS `route()` calls, nav links) → the Part C grep-sweep +
  `npm run build`/`tsc` (a missing `route()` name surfaces at runtime, an import error at build) +
  live smoke.
- **Module test discovery** for `app/Modules/Auth/tests/` may differ from `tests/` → verify during
  planning; fall back to `tests/Feature/Auth/` if module-local tests aren't auto-discovered.
- **`module:make` leftover scaffold** (empty dirs, a stray `permissions.php`) → explicitly delete them
  in the plan; `permission:sync` must stay green with an Auth module that declares none.
