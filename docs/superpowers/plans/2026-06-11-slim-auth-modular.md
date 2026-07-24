# Slim Starter-Kit Scaffolding + Modular Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unused Laravel React starter-kit scaffolding (registration, password reset, email verification, password confirmation, the whole Settings area, the marketing welcome page) and relocate the surviving email+password **login/logout** into a new `app/Modules/Auth/` module.

**Architecture:** Sequence to keep the suite green at every commit. First stand up the `Auth` module and move login/logout into it **without removing the other auth routes** (no route-name collision, existing tests still pass). Then delete the orphaned auth flows, the Settings area, replace the welcome page, move the theme toggle into the user menu, sweep dangling references, and regenerate the endpoint docs. Login/logout keep their URLs (`/login`, `/logout`) and route names (`login`, `logout`), so `AuthenticationTest` and the framework's guest-redirect keep working.

**Tech Stack:** Laravel 12.61, PHP 8.4, Inertia v2 + React 19 + TS, Tailwind v4, shadcn/ui, Pest. Module system in `app/Modular/` (`php artisan module:make`, auto-registration, Inertia pages resolved as `Module::pages/Name`).

**Branch:** `refactor/slim-auth-modular` (exists, spec committed). Land via PR + squash-merge. PR title type: `refactor`.

**Grounded conventions:**
- Module **feature tests live in top-level `tests/Feature/<Module>/`** (the `app/Modules/*/tests/` dirs are empty scaffold). So Auth tests stay in `tests/Feature/Auth/`; delete the empty `app/Modules/Auth/tests/` scaffold.
- Inertia tests: `config(['inertia.testing.ensure_pages_exist' => false])` + `$this->withoutVite()` when asserting components.
- `module.json` shape: `{name, alias, version, description, dependencies}`.
- Run PHP tests `./vendor/bin/pest`; gate `composer check`; JS gate `npm run types` + `npm run lint` + `npm run build`.
- Commit: `git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "<msg>"` (on a feature branch; hook blocks main only; never `--no-verify`).

Reference spec: `docs/superpowers/specs/2026-06-11-slim-auth-modular-design.md`.

---

## File Structure

| Action | Path | Note |
|---|---|---|
| Create | `app/Modules/Auth/` (via `module:make Auth`, then stripped) | Hosts login/logout; no model/permission/migration |
| Move | `AuthenticatedSessionController` → `app/Modules/Auth/Http/Controllers/` | render `Auth::pages/Login`, drop reset props |
| Move | `LoginRequest` → `app/Modules/Auth/Http/Requests/` | namespace update only |
| Move | `resources/js/pages/auth/login.tsx` → `app/Modules/Auth/resources/js/pages/Login.tsx` | trim register/forgot/status |
| Create | `app/Modules/Auth/routes/web.php` | login (guest) + logout (auth) |
| Delete | 7 auth controllers, 5 auth pages, 4 auth tests, `routes/auth.php` | the removed flows |
| Delete | Settings controllers/requests, `routes/settings.php`, settings pages + layout, `delete-user.tsx`, `appearance-tabs.tsx`, 2 Settings tests | the Settings area |
| Replace | `resources/js/pages/welcome.tsx` | neutral landing |
| Modify | `resources/js/components/user-menu-content.tsx` | theme toggle, drop profile link |
| Modify | `routes/web.php` | drop the two `require`s |
| Regenerate | `docs/endpoints.md` | `php artisan app:endpoints` |

---

## Task 1: Create the Auth module and move login/logout into it

Keep all other auth routes intact this task — only login/logout relocate. Suite stays green.

**Files:**
- Create: `app/Modules/Auth/` (scaffold), `app/Modules/Auth/routes/web.php`, `app/Modules/Auth/Http/Controllers/AuthenticatedSessionController.php`, `app/Modules/Auth/Http/Requests/LoginRequest.php`, `app/Modules/Auth/resources/js/pages/Login.tsx`
- Modify: `routes/auth.php` (remove only login + logout), `tests/Feature/Auth/AuthenticationTest.php` (only if a component assertion needs updating — it currently has none)
- Delete: `resources/js/pages/auth/login.tsx`, `app/Http/Controllers/Auth/AuthenticatedSessionController.php`, `app/Http/Requests/Auth/LoginRequest.php`

- [ ] **Step 1: Scaffold the module and strip the unused parts**

```bash
php artisan module:make Auth
```
Then strip what an infra module doesn't need (keep `module.json`, the generated `Providers/AuthServiceProvider.php`, and create `Http/`, `routes/`, `resources/js/pages/`):
```bash
rm -rf app/Modules/Auth/Models app/Modules/Auth/Actions app/Modules/Auth/Services \
       app/Modules/Auth/Policies app/Modules/Auth/Data app/Modules/Auth/Database \
       app/Modules/Auth/tests
rm -f app/Modules/Auth/permissions.php
```
Set `app/Modules/Auth/module.json` to:
```json
{
    "name": "Auth",
    "alias": "auth",
    "version": "1.0.0",
    "description": "Authentication (login/logout)",
    "dependencies": []
}
```
If `module:make` registers `permissions.php` or a migrations path in the provider/manifest, ensure removing them doesn't break boot. Run `php artisan permission:sync` to confirm an Auth module declaring no permissions is fine.

- [ ] **Step 2: Move the controller**

Create `app/Modules/Auth/Http/Controllers/AuthenticatedSessionController.php` (moved + trimmed):
```php
<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Http\Requests\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController
{
    public function create(): Response
    {
        return Inertia::render('Auth::pages/Login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
```
Then `rm app/Http/Controllers/Auth/AuthenticatedSessionController.php`.

- [ ] **Step 3: Move the form request**

Move `app/Http/Requests/Auth/LoginRequest.php` → `app/Modules/Auth/Http/Requests/LoginRequest.php`, changing only the namespace to `App\Modules\Auth\Http\Requests` (keep all validation/rate-limit logic verbatim):
```bash
git mv app/Http/Requests/Auth/LoginRequest.php app/Modules/Auth/Http/Requests/LoginRequest.php
```
Edit the `namespace` line to `namespace App\Modules\Auth\Http\Requests;`. Verify it has no other `App\Http\Requests\Auth` self-references.

- [ ] **Step 4: Module routes**

Create `app/Modules/Auth/routes/web.php`:
```php
<?php

use App\Modules\Auth\Http\Controllers\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
```

- [ ] **Step 5: Remove login/logout from the old auth routes (avoid name collision)**

In `routes/auth.php`, delete the `login` GET, `login` POST, and the `logout` POST route definitions (leave register/forgot/reset in the `guest` group and verify-email/confirm-password in the `auth` group for now — Task 2 deletes those). Remove the now-unused `AuthenticatedSessionController` import from `routes/auth.php`.

- [ ] **Step 6: Move + trim the login page**

Create `app/Modules/Auth/resources/js/pages/Login.tsx`:
```tsx
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean | null | undefined;
}

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3} />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
```
Then `rm resources/js/pages/auth/login.tsx`.

- [ ] **Step 7: Run the gate**

```bash
php artisan optimize:clear
composer check
npm run types && npm run lint && npm run build
```
Expected: all green. `AuthenticationTest` passes unchanged — `/login` GET renders (now `Auth::pages/Login`), `/login` POST authenticates → `dashboard`, `/logout` → `/`. If `test_login_screen_can_be_rendered` fails because the module page isn't resolvable through the test Vite manifest, the build in this step produced the manifest; if it still fails under `ensure_pages_exist`, it's already `false` in that test file — confirm. Verify the route is served by the module:
```bash
php artisan route:list | grep -E "login|logout"
```
Expected: `login`/`logout` actions now point at `App\Modules\Auth\Http\Controllers\AuthenticatedSessionController`.

- [ ] **Step 8: Commit**

```bash
git add app/Modules/Auth routes/auth.php
git add -A app/Http/Controllers/Auth/AuthenticatedSessionController.php app/Http/Requests/Auth resources/js/pages/auth/login.tsx
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(auth): move login/logout into a modular Auth module"
```

---

## Task 2: Delete the removed auth flows

**Files (delete):**
- `app/Http/Controllers/Auth/RegisteredUserController.php`, `PasswordResetLinkController.php`, `NewPasswordController.php`, `EmailVerificationPromptController.php`, `VerifyEmailController.php`, `EmailVerificationNotificationController.php`, `ConfirmablePasswordController.php`
- `resources/js/pages/auth/register.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `verify-email.tsx`, `confirm-password.tsx`
- `tests/Feature/Auth/RegistrationTest.php`, `PasswordResetTest.php`, `EmailVerificationTest.php`, `PasswordConfirmationTest.php`
- `routes/auth.php` (now reduced to register/reset/verify/confirm only → delete the whole file)
- Modify: `routes/web.php` (remove `require __DIR__.'/auth.php';`)

- [ ] **Step 1: Delete controllers, pages, tests, routes**

```bash
git rm app/Http/Controllers/Auth/RegisteredUserController.php \
       app/Http/Controllers/Auth/PasswordResetLinkController.php \
       app/Http/Controllers/Auth/NewPasswordController.php \
       app/Http/Controllers/Auth/EmailVerificationPromptController.php \
       app/Http/Controllers/Auth/VerifyEmailController.php \
       app/Http/Controllers/Auth/EmailVerificationNotificationController.php \
       app/Http/Controllers/Auth/ConfirmablePasswordController.php \
       resources/js/pages/auth/register.tsx \
       resources/js/pages/auth/forgot-password.tsx \
       resources/js/pages/auth/reset-password.tsx \
       resources/js/pages/auth/verify-email.tsx \
       resources/js/pages/auth/confirm-password.tsx \
       tests/Feature/Auth/RegistrationTest.php \
       tests/Feature/Auth/PasswordResetTest.php \
       tests/Feature/Auth/EmailVerificationTest.php \
       tests/Feature/Auth/PasswordConfirmationTest.php \
       routes/auth.php
```
Remove the `require __DIR__.'/auth.php';` line from `routes/web.php`.

- [ ] **Step 2: Check for dangling references**

```bash
grep -rn "RegisteredUserController\|PasswordResetLinkController\|NewPasswordController\|EmailVerification\|VerifyEmailController\|ConfirmablePasswordController\|password.request\|password.reset\|password.email\|password.store\|password.confirm\|verification\.\|route('register')" app/ resources/js/ routes/ tests/
```
Expected: no hits (login.tsx already trimmed in Task 1; any remaining hit must be fixed). If `app/Models/User.php` still has the commented `MustVerifyEmail` import, leave it (already commented, harmless) — or remove the dead comment line for cleanliness.

- [ ] **Step 3: Gate + commit**

```bash
composer check && npm run types && npm run lint && npm run build
git add -A
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(auth): remove registration, password reset, email verification, password confirmation"
```
Expected: green. The remaining `tests/Feature/Auth/AuthenticationTest.php` still passes.

---

## Task 3: Delete the Settings area

**Files (delete):**
- `app/Http/Controllers/Settings/ProfileController.php`, `PasswordController.php`; any `app/Http/Requests/Settings/*` (e.g. `ProfileUpdateRequest.php`)
- `routes/settings.php`
- `resources/js/pages/settings/profile.tsx`, `password.tsx`, `appearance.tsx`
- The settings layout: `resources/js/layouts/settings/*` and/or `resources/js/layouts/settings-layout.tsx`
- `resources/js/components/delete-user.tsx`, `resources/js/components/appearance-tabs.tsx`
- `tests/Feature/Settings/ProfileUpdateTest.php`, `PasswordUpdateTest.php`
- Modify: `routes/web.php` (remove `require __DIR__.'/settings.php';`)

- [ ] **Step 1: Discover exact settings layout path**

```bash
ls resources/js/layouts | grep -i settings; ls resources/js/layouts/settings 2>/dev/null; ls app/Http/Requests/Settings 2>/dev/null
```
Note the exact files to delete.

- [ ] **Step 2: Delete**

```bash
git rm app/Http/Controllers/Settings/ProfileController.php \
       app/Http/Controllers/Settings/PasswordController.php \
       routes/settings.php \
       resources/js/pages/settings/profile.tsx \
       resources/js/pages/settings/password.tsx \
       resources/js/pages/settings/appearance.tsx \
       resources/js/components/delete-user.tsx \
       resources/js/components/appearance-tabs.tsx \
       tests/Feature/Settings/ProfileUpdateTest.php \
       tests/Feature/Settings/PasswordUpdateTest.php
```
Also `git rm` the settings layout file(s) found in Step 1 and any `app/Http/Requests/Settings/*`. Remove the `require __DIR__.'/settings.php';` line from `routes/web.php`.

- [ ] **Step 3: Check for dangling references (excluding the user menu, fixed in Task 4)**

```bash
grep -rn "ProfileController\|PasswordController\|delete-user\|appearance-tabs\|settings/\|profile.edit\|profile.update\|profile.destroy\|password.edit\|password.update\|route('appearance')" app/ resources/js/ routes/ tests/
```
Expected: the only remaining hit is `resources/js/components/user-menu-content.tsx` (`route('profile.edit')`), addressed next task. Fix any others.

- [ ] **Step 4: Gate + commit** (the user menu still references `profile.edit`, so `tsc`/build pass — `route()` is runtime — but to avoid shipping a broken commit, do Task 4 before the live app is exercised; the gate here is still green since the reference is a runtime `route()` call, not a build-time import)

```bash
composer check
git add -A
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(settings): remove self-service profile, password, and appearance pages"
```

---

## Task 4: Move the theme toggle into the user menu

The deleted appearance page was the only theme switcher. Add light/dark/system items to the user-menu dropdown and drop the dead `profile.edit` link.

**Files:**
- Modify: `resources/js/components/user-menu-content.tsx`

- [ ] **Step 1: Replace the component**

Replace `resources/js/components/user-menu-content.tsx` with:
```tsx
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useAppearance } from '@/hooks/use-appearance';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();

    const themeOptions = [
        { value: 'light' as const, label: 'Light', icon: Sun },
        { value: 'dark' as const, label: 'Dark', icon: Moon },
        { value: 'system' as const, label: 'System', icon: Monitor },
    ];

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {themeOptions.map(({ value, label, icon: Icon }) => (
                    <DropdownMenuItem key={value} onClick={() => updateAppearance(value)}>
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                        {appearance === value && <span className="text-muted-foreground ml-auto text-xs">●</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
```
(Verify `useAppearance` returns `{ appearance, updateAppearance }` and that `updateAppearance` accepts `'light' | 'dark' | 'system'` — confirmed in `resources/js/components/appearance-dropdown.tsx`.)

- [ ] **Step 2: Gate + commit**

```bash
npm run types && npm run lint && npm run build
git add resources/js/components/user-menu-content.tsx
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(nav): replace settings link with a theme toggle in the user menu"
```

---

## Task 5: Replace the welcome page with a neutral landing

**Files:**
- Replace: `resources/js/pages/welcome.tsx`

- [ ] **Step 1: Confirm shared types/components**

```bash
grep -n "auth" resources/js/types/index.d.ts | head; ls resources/js/components/app-logo-icon.tsx
```
Confirm `SharedData` exposes `auth.user` and `app-logo-icon` has a default export (`AppLogoIcon`). Adjust the import in Step 2 if the names differ.

- [ ] **Step 2: Replace the page**

Replace the entire contents of `resources/js/pages/welcome.tsx` with:
```tsx
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

    return (
        <>
            <Head title="Welcome" />
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-xl">
                        <AppLogoIcon className="h-8 w-8 fill-current" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
                        <p className="text-muted-foreground text-sm">A modular Laravel + Inertia starter.</p>
                    </div>
                </div>
                <Button asChild>
                    {auth.user ? <Link href={route('dashboard')}>Go to dashboard</Link> : <Link href={route('login')}>Log in</Link>}
                </Button>
            </div>
        </>
    );
}
```

- [ ] **Step 3: Gate + commit**

```bash
npm run types && npm run lint && npm run build
git add resources/js/pages/welcome.tsx
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "refactor(welcome): replace marketing page with a neutral landing"
```

---

## Task 6: Sweep, regenerate endpoint docs, full gate

**Files:**
- Possibly delete now-empty dirs; modify `docs/endpoints.md` (regenerated)

- [ ] **Step 1: Remove empty directories left by the moves/deletes**

```bash
for d in app/Http/Controllers/Auth app/Http/Controllers/Settings app/Http/Requests/Auth \
         app/Http/Requests/Settings resources/js/pages/auth resources/js/pages/settings \
         resources/js/layouts/settings tests/Feature/Settings; do
  [ -d "$d" ] && [ -z "$(ls -A "$d")" ] && rmdir "$d" && echo "removed empty $d"
done
```

- [ ] **Step 2: Full dangling-reference sweep**

```bash
grep -rn "App\\\\Http\\\\Controllers\\\\Auth\|App\\\\Http\\\\Controllers\\\\Settings\|App\\\\Http\\\\Requests\\\\Auth\|App\\\\Http\\\\Requests\\\\Settings\|auth/login\|pages/settings\|pages/auth" app/ resources/js/ routes/ tests/ bootstrap/
```
Expected: no hits. Fix anything found (e.g. a stray `Inertia::render('auth/login')`, a `bootstrap/app.php` reference — there should be none since auth/settings were required from `web.php`).

- [ ] **Step 3: Regenerate the endpoint inventory**

```bash
php artisan optimize:clear
php artisan app:endpoints
```
Verify `docs/endpoints.md` now lists only: `/` (home), `dashboard`, `docs/routes`, `login`, `logout`, `users.*`, `rbac.*`, `audit`. No register/reset/verify/confirm/settings rows.

- [ ] **Step 4: Full gate**

```bash
composer check && npm run types && npm run lint && npm run build
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "chore: prune empty dirs and regenerate endpoint inventory"
```

---

## Task 7: Strengthen the Auth module tests

`AuthenticationTest` covers the happy path. Add a guest-redirect test (the framework relies on `route('login')`) and a login-screen component assertion to lock the module page resolution.

**Files:**
- Modify: `tests/Feature/Auth/AuthenticationTest.php`

- [ ] **Step 1: Add the failing tests**

Add these methods to `tests/Feature/Auth/AuthenticationTest.php` (keep the existing 4):
```php
    public function test_login_screen_renders_the_module_page_component()
    {
        config(['inertia.testing.ensure_pages_exist' => false]);
        $this->withoutVite();

        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->component('Auth::pages/Login'));
    }

    public function test_guests_are_redirected_to_login_from_a_protected_route()
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
    }
```

- [ ] **Step 2: Run to verify they pass (login already served by the module)**

```bash
./vendor/bin/pest tests/Feature/Auth/AuthenticationTest.php
```
Expected: 6 pass. (These assert already-true behavior — they guard against regressions in the module page namespace and the `login` route name.)

- [ ] **Step 3: Gate + commit**

```bash
composer check
git add tests/Feature/Auth/AuthenticationTest.php
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "test(auth): assert module login page + guest redirect to login"
```

---

## Task 8: Docs, live verification, finish

**Files:**
- Modify: `README.md`, `docs/getting-started.md`, `docs/conventions.md` (only where they reference removed scaffolding)

- [ ] **Step 1: Update docs that mention removed scaffolding**

```bash
grep -rn "register\|forgot-password\|reset-password\|verify-email\|settings/profile\|settings/password\|settings/appearance\|Settings" README.md docs/getting-started.md docs/conventions.md
```
For each real reference to a removed feature, update or remove it. Add a one-line note (README "Built-in modules" or stack section) that **Auth** is now a module (`app/Modules/Auth`) hosting login/logout, and that the template ships without public registration / self-service settings by design. Do not touch `docs/superpowers/specs` or `plans`.

- [ ] **Step 2: Live verification (run skill)**

Drive the real app in Chrome (built assets + `php artisan serve` + playwright-core/Chrome, installed transiently and removed after; `php artisan migrate --seed` for the admin). Verify:
1. Guest visiting `/dashboard` → redirected to `/login`.
2. `/login` renders (module page) inside the auth layout; login as `admin@example.com` / `password` → lands on `/dashboard`.
3. User-menu dropdown shows Light/Dark/System; switching toggles the theme and persists across a reload.
4. Logout → `/` shows the neutral landing with a "Log in" button; while authenticated, `/` shows "Go to dashboard".
5. `/users`, `/rbac/roles`, `/audit`, `/docs/routes` still render. No console errors.

Screenshot each key state. Then clean up: kill the server, `npm uninstall playwright-core`, `git checkout package.json package-lock.json`, confirm `git status` clean.

- [ ] **Step 3: Final gate + commit docs**

```bash
composer check && npm run types && npm run lint && npm run build
git add README.md docs/getting-started.md docs/conventions.md
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "docs: reflect modular auth + removed starter-kit scaffolding"
```

- [ ] **Step 4: Finish**

Invoke the `finish-feature` skill: verify the gate, push `refactor/slim-auth-modular`, open a PR titled **`refactor: slim starter-kit scaffolding and modularize auth`**, ensure CI (Quality gate + PR title) is green, squash-merge, sync `main`.

---

## Self-Review

**Spec coverage:**
- Remove registration / password-reset / email-verification / password-confirmation → Task 2. ✓
- Remove Settings (profile/password/appearance, layout, delete-user, tests) → Task 3. ✓
- Preserve theme toggle (move to user menu) → Task 4. ✓
- Welcome → general landing → Task 5. ✓
- Modularize login/logout via `module:make Auth` then strip; keep route name `login` → Task 1. ✓
- Ripple cleanup (drop requires, empty dirs, sweep, regen endpoints) → Tasks 2/3/6. ✓
- Tests (rewrite/strengthen Auth, delete obsolete) → Tasks 2/3/7. ✓
- Docs + live verify + finish → Task 8. ✓

**Placeholder scan:** Deletion steps give exact `git rm` lists; modified/new files show complete code; Step-1 discovery commands (settings layout path, shared types) are grounded look-ups, not placeholders. ✓

**Type/name consistency:** Module namespace `App\Modules\Auth\Http\Controllers` / `...\Http\Requests` used consistently across controller, request, routes. Inertia component `Auth::pages/Login` used in controller render + Task 7 assertion + matches the page at `app/Modules/Auth/resources/js/pages/Login.tsx`. Route names `login`/`logout` preserved (Task 1 routes, Task 7 redirect assertion, user-menu `route('logout')`, welcome `route('login')`). ✓

**Ordering safety:** Login/logout move (Task 1) precedes any deletion; old auth routes keep working until Task 2; the user-menu `profile.edit` reference is removed (Task 4) before live exercise (Task 8). Suite green at each commit. ✓
