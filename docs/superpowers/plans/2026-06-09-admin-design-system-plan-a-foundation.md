# Admin Design System — Plan A: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the design-system foundation — teal brand token, permission data shared to the frontend, a `can()` hook, a permission-gated sidebar, and the existing module pages wrapped in the app shell.

**Architecture:** Brand color becomes a single CSS token (`--primary`) in `resources/css/app.css`. `HandleInertiaRequests` shares the user's permission names + a super-admin flag + flash; a `usePermissions()` hook reads them so the sidebar (and later, buttons) can gate on `can(permission)`. Module pages are wrapped in `AppLayout` so they get the sidebar shell (deeper refactor is Plan D).

**Tech Stack:** Laravel 12.61, Inertia v2 + React 19 + TypeScript, Tailwind v4, spatie/laravel-permission. Gate: `composer check` + `npm run build`.

---

## Notes from the codebase (verified)
- `resources/css/app.css`: `--radius: 0.5rem` already (keep — moderate). `--primary: hsl(0,0%,9%)` light / `hsl(0,0%,98%)` dark. Also `--ring`, `--sidebar-primary` are monochrome.
- `app/Http/Middleware/HandleInertiaRequests.php` shares only `auth.user`.
- `resources/js/types/index.ts`: `Auth { user }`, `SharedData { name, quote, auth, [key] }`, `NavItem { title, url, icon?, isActive? }`.
- `resources/js/components/app-sidebar.tsx`: hardcoded `[Dashboard]` + starter-kit footer links.
- The dashboard page (`resources/js/pages/dashboard.tsx`) is the canonical example of using the app layout.

---

## Task 1: Teal brand token (light + dark) + docs

**Files:**
- Modify: `resources/css/app.css`
- Modify: `docs/conventions.md`

- [ ] **Step 1: Set the brand to teal in `:root` (light)**

In `resources/css/app.css`, inside the `:root { ... }` block, replace the primary/ring/sidebar-primary values with teal (teal-600 ≈ `hsl(174, 84%, 32%)`):

```css
    --primary: hsl(174, 84%, 32%);
    --primary-foreground: hsl(0, 0%, 100%);
```
and update the ring + sidebar-primary in the same `:root` block to teal:
```css
    --ring: hsl(174, 84%, 32%);
```
```css
    --sidebar-primary: hsl(174, 84%, 32%);
    --sidebar-primary-foreground: hsl(0, 0%, 100%);
```
(Leave every other token untouched; `--radius: 0.5rem` stays.)

- [ ] **Step 2: Set the brand to teal in `.dark`**

In the `.dark { ... }` block, use a slightly lighter teal for contrast on dark surfaces:

```css
    --primary: hsl(172, 66%, 45%);
    --primary-foreground: hsl(0, 0%, 100%);
```
```css
    --ring: hsl(172, 66%, 45%);
```
```css
    --sidebar-primary: hsl(172, 66%, 45%);
    --sidebar-primary-foreground: hsl(0, 0%, 100%);
```

- [ ] **Step 3: Document the brand-swap in `docs/conventions.md`**

Add a short subsection under §5 (Quality gate & workflow) or near the top — a "Theming" note:

```markdown
### Theming / brand color

The brand accent is a single design token. To re-brand, edit `--primary` (and its dark variant) in
`resources/css/app.css` — everything (buttons, active nav, focus rings, badges) derives from it.
Default is teal. `--radius: 0.5rem` controls corner rounding (moderate). Light/dark is handled by
`use-appearance`.
```

- [ ] **Step 4: Build to confirm CSS compiles**

Run: `npm run build`
Expected: succeeds (Tailwind picks up the new token values).

- [ ] **Step 5: Commit**

```bash
git add resources/css/app.css docs/conventions.md
git commit -m "feat(design): set teal brand token (light/dark) and document re-branding"
```

---

## Task 2: Share permissions + super-admin flag + flash (backend)

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Test: `tests/Feature/SharedAuthPropsTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/SharedAuthPropsTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
});

it('shares the user permissions and super-admin flag', function () {
    Permission::findOrCreate('users.viewAny', 'web');
    $user = User::factory()->create()->givePermissionTo('users.viewAny');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.isSuperAdmin', false)
            ->where('auth.permissions', fn ($perms) => in_array('users.viewAny', (array) $perms, true))
        );
});

it('flags super-admin users', function () {
    \Spatie\Permission\Models\Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->assignRole('super-admin');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->where('auth.isSuperAdmin', true));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `vendor/bin/pest tests/Feature/SharedAuthPropsTest.php`
Expected: FAIL — `auth.permissions` / `auth.isSuperAdmin` not shared yet.

- [ ] **Step 3: Update the share() method**

In `app/Http/Middleware/HandleInertiaRequests.php`, replace the returned array's `auth` entry and add `flash`. The `$request->user()` is type-narrowed to `App\Models\User` for PHPStan:

```php
public function share(Request $request): array
{
    [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

    $user = $request->user();

    return array_merge(parent::share($request), [
        ...parent::share($request),
        'name' => config('app.name'),
        'quote' => ['message' => trim($message), 'author' => trim($author)],
        'auth' => [
            'user' => $user,
            'permissions' => $user instanceof \App\Models\User ? $user->getPermissionNames() : [],
            'isSuperAdmin' => $user instanceof \App\Models\User && $user->hasRole('super-admin'),
        ],
        'flash' => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
        ],
    ]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `vendor/bin/pest tests/Feature/SharedAuthPropsTest.php`
Expected: PASS (2 passed).

- [ ] **Step 5: Full gate**

Run: `composer check`
Expected: green (Pint + PHPStan level 6 + Pest). The `$user instanceof \App\Models\User` guard satisfies PHPStan.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Middleware/HandleInertiaRequests.php tests/Feature/SharedAuthPropsTest.php
git commit -m "feat(auth): share permissions, super-admin flag, and flash to Inertia"
```

---

## Task 3: TS types + `usePermissions()` hook

**Files:**
- Modify: `resources/js/types/index.ts`
- Create: `resources/js/hooks/use-permissions.ts`

- [ ] **Step 1: Extend the types**

In `resources/js/types/index.ts`, update `Auth` and `SharedData`, and add `permission` to `NavItem`:

```typescript
export interface Auth {
    user: User;
    permissions: string[];
    isSuperAdmin: boolean;
}
```
```typescript
export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: string;
}
```
```typescript
export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: { success: string | null; error: string | null };
    [key: string]: unknown;
}
```

- [ ] **Step 2: Create the hook**

Create `resources/js/hooks/use-permissions.ts`:

```typescript
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    const can = (permission: string): boolean => auth.isSuperAdmin || auth.permissions.includes(permission);

    return { can, isSuperAdmin: auth.isSuperAdmin, permissions: auth.permissions };
}
```

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint resources/js/hooks/use-permissions.ts resources/js/types/index.ts`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/types/index.ts resources/js/hooks/use-permissions.ts
git commit -m "feat(design): add usePermissions() hook and shared-prop types"
```

---

## Task 4: Permission-gated sidebar nav

**Files:**
- Modify: `resources/js/components/app-sidebar.tsx`

- [ ] **Step 1: Rewrite the sidebar nav**

Replace `resources/js/components/app-sidebar.tsx` with:

```tsx
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { KeyRound, LayoutGrid, ScrollText, Shield, Users } from 'lucide-react';
import AppLogo from './app-logo';

const navItems: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
    { title: 'Users', url: '/users', icon: Users, permission: 'users.viewAny' },
    { title: 'Roles', url: '/rbac/roles', icon: Shield, permission: 'roles.viewAny' },
    { title: 'Permissions', url: '/rbac/permissions', icon: KeyRound, permission: 'permissions.viewAny' },
    { title: 'Audit log', url: '/audit', icon: ScrollText, permission: 'audit.view' },
];

export function AppSidebar() {
    const { can } = usePermissions();
    const items = navItems.filter((item) => !item.permission || can(item.permission));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
```

(The starter-kit `NavFooter` external links are removed; `NavUser` stays.)

- [ ] **Step 2: Type-check, lint, format, build**

Run: `npx tsc --noEmit && npx eslint resources/js/components/app-sidebar.tsx`
Expected: no errors. (If `NavFooter` import is now unused elsewhere, eslint will pass since we removed it from this file.)

Run: `npx prettier --write resources/js/components/app-sidebar.tsx && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/app-sidebar.tsx
git commit -m "feat(design): permission-gated sidebar navigation"
```

---

## Task 5: Wrap module pages in the app shell

**Files:**
- Modify: `app/Modules/Users/resources/js/pages/Index.tsx`, `Form.tsx`
- Modify: `app/Modules/Rbac/resources/js/pages/roles/Index.tsx`, `roles/Form.tsx`, `permissions/Index.tsx`
- Modify: `app/Modules/Audit/resources/js/pages/Index.tsx`

- [ ] **Step 1: Inspect the canonical layout usage**

Read `resources/js/pages/dashboard.tsx` to see exactly how it imports and uses the layout (the import path, and whether it passes `breadcrumbs`). Mirror that pattern. It uses `import AppLayout from '@/layouts/app-layout';` and wraps content in `<AppLayout breadcrumbs={breadcrumbs}>…</AppLayout>`.

- [ ] **Step 2: Wrap each module page**

For each of the 6 pages, wrap the existing returned `<div className="p-6">…</div>` in `AppLayout`. Add the import at the top and a `breadcrumbs` array. Example for `app/Modules/Users/resources/js/pages/Index.tsx` — add:

```tsx
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/users' }];
```
and change the return from `return ( <div className="p-6"> … </div> );` to:
```tsx
return (
    <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-6"> … </div>
    </AppLayout>
);
```
Apply the same wrap to the other five pages with appropriate breadcrumbs:
- `Users/Form.tsx` → `[{ title: 'Users', href: '/users' }, { title: user ? 'Edit' : 'New', href: '#' }]`
- `Rbac/roles/Index.tsx` → `[{ title: 'Roles', href: '/rbac/roles' }]`
- `Rbac/roles/Form.tsx` → `[{ title: 'Roles', href: '/rbac/roles' }, { title: role ? 'Edit' : 'New', href: '#' }]`
- `Rbac/permissions/Index.tsx` → `[{ title: 'Permissions', href: '/rbac/permissions' }]`
- `Audit/Index.tsx` → `[{ title: 'Audit log', href: '/audit' }]`

Keep the existing `<Head>` and content as-is inside the wrapper. Confirm the import path `@/layouts/app-layout` resolves from a module page (the `@` alias maps to `resources/js`, so it works from anywhere).

- [ ] **Step 3: Format, lint, build**

```bash
npx prettier --write app/Modules/*/resources/js/pages
npx eslint app/Modules/*/resources/js/pages/**/*.tsx app/Modules/*/resources/js/pages/*.tsx
npm run build
```
Expected: all pass; the pages now render inside the sidebar shell. Vite manifest still lists each module page.

- [ ] **Step 4: PHP gate unaffected**

Run: `composer check`
Expected: green (the controller Inertia-prop tests still pass — wrapping the page doesn't change props).

- [ ] **Step 5: Commit**

```bash
git add app/Modules
git commit -m "feat(design): wrap module pages in the app sidebar shell"
```

---

## Task 6: Final verification

- [ ] **Step 1: Full gates**

Run: `composer check` → green.
Run: `npm run build` → succeeds.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 2: Sanity the shared props live**

Run:
```bash
php artisan tinker --execute='$u=\App\Models\User::where("email","admin@example.com")->first(); echo $u? $u->getPermissionNames()->count()." perms; super=".($u->hasRole("super-admin")?"yes":"no") : "no admin (run migrate --seed)";'
```
Expected: prints permission count + super=yes (if seeded), confirming the data the middleware shares.

---

## Self-Review

**Spec coverage (Plan A scope):**
- Design tokens (teal, documented) → Task 1 ✅ (radius already 0.5rem — left as-is, documented)
- Permission exposure (permissions, isSuperAdmin, flash) → Task 2 ✅
- `usePermissions()`/`can()` hook + types → Task 3 ✅
- Permission-gated sidebar → Task 4 ✅
- Module pages in the shell → Task 5 ✅

**Placeholder scan:** every step has concrete code/commands. No TBD.

**Type consistency:** `Auth.permissions: string[]`, `Auth.isSuperAdmin: boolean`, `SharedData.flash`, `NavItem.permission?` are defined in Task 3 and consumed identically in Tasks 3–4. The backend share keys (`auth.permissions`, `auth.isSuperAdmin`, `flash.success/error`) match the TS types. The `usePermissions().can()` signature matches its use in the sidebar.

**Out of scope (later plans):** DataTable/query-builder (Plan B), component library (Plan C), full module-page refactor + add-resource update (Plan D).
