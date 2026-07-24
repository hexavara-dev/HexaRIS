# Admin Design System — Plan D: Wire Modules + Update Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Refactor the Users / Rbac / Audit module pages onto the design system (AppLayout shell + PageHeader + DataTable + RowActionMenu + ConfirmDialog + FormLayout/FormField + EmptyState), make Roles sortable/filterable like Users, and update the `add-resource` skill + conventions so future modules follow this pattern.

**Architecture:** The **Users Index page (from Plan B)** is the canonical DataTable example — mirror it. Roles gains the QueryBuilder index pattern; Permissions keeps its grouped catalog (just a PageHeader); Audit keeps its custom filter bar but renders rows via DataTable. Forms move to FormLayout/FormField. Native `confirm()` is replaced by `ConfirmDialog` driven by local state.

**Tech Stack:** Laravel 12.61, spatie/laravel-query-builder + laravel-permission + laravel-data, Inertia React TS, Pest.

---

## Canonical references (read these first)
- `app/Modules/Users/resources/js/pages/Index.tsx` — the DataTable usage pattern (columns, AppLayout, header, New button).
- `resources/js/components/{data-table,page-header,row-action-menu,confirm-dialog,empty-state}.tsx` and `resources/js/components/form/{form-layout,form-field}.tsx` — the components to use.
- `app/Modules/Users/Http/Controllers/UserController.php@index` — the QueryBuilder index pattern.

---

## Task 1: Users — RowActionMenu + ConfirmDialog + PageHeader; Form → FormLayout

**Files:** Modify `app/Modules/Users/resources/js/pages/Index.tsx`, `Form.tsx`

- [ ] **Step 1: Index — use PageHeader + RowActionMenu + ConfirmDialog**

In `app/Modules/Users/resources/js/pages/Index.tsx`:
- Import `PageHeader`, `RowActionMenu`, `ConfirmDialog`, `Button`.
- Replace the hand-written header `<div>` with `<PageHeader title="Users" subtitle="Manage accounts & roles" actions={<Button asChild><Link href="/users/create">New user</Link></Button>} />`.
- Replace the `actions` column's inline Edit link + native `confirm()` button with a `RowActionMenu` whose Delete sets local state for a `ConfirmDialog`. Pattern:

```tsx
const [toDelete, setToDelete] = useState<UserRow | null>(null);
// in the actions column render:
render: (u) => (
    <div className="flex justify-end">
        <RowActionMenu
            actions={[
                { label: 'Edit', href: `/users/${u.id}/edit` },
                { label: 'Delete', destructive: true, onClick: () => setToDelete(u) },
            ]}
        />
    </div>
),
// after the DataTable:
<ConfirmDialog
    open={toDelete !== null}
    onOpenChange={(open) => !open && setToDelete(null)}
    title="Delete user?"
    description={toDelete ? `This permanently deletes ${toDelete.name}.` : undefined}
    confirmLabel="Delete"
    onConfirm={() => { if (toDelete) router.delete(`/users/${toDelete.id}`); }}
/>
```
Keep the `DataTable` + columns from Plan B. Remove the now-unused native `confirm()` import usage.

- [ ] **Step 2: Form — use FormLayout + FormField**

In `app/Modules/Users/resources/js/pages/Form.tsx`, wrap the form body in `<FormLayout onSubmit={submit} footer={<Button type="submit" disabled={processing}>Save</Button>}>` and replace each manual `label + input + error` block with `<FormField label="Name" error={errors.name}><Input value={data.name} onChange={...} /></FormField>` (use the shadcn `Input` from `@/components/ui/input`). Keep the role checkboxes as a `FormField label="Roles"` wrapping the existing checkbox grid. Keep `PageHeader` for the title.

- [ ] **Step 3: Lint, build, gate**

```bash
npx prettier --write app/Modules/Users/resources/js/pages
npx eslint app/Modules/Users/resources/js/pages/Index.tsx app/Modules/Users/resources/js/pages/Form.tsx
npm run build && composer check
```
Expected: build + 102 tests green (Inertia prop shape unchanged → controller tests still pass).

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Users/resources/js/pages
git commit -m "feat(users): adopt PageHeader, RowActionMenu, ConfirmDialog, and FormLayout"
```

---

## Task 2: Rbac Roles — QueryBuilder index + DataTable + components

**Files:** Modify `app/Modules/Rbac/Http/Controllers/RoleController.php`, `tests/Feature/Rbac/RoleIndexTest.php`; Modify `app/Modules/Rbac/resources/js/pages/roles/Index.tsx`, `roles/Form.tsx`; Test `tests/Feature/Rbac/RoleSortTest.php`

- [ ] **Step 1: Update the existing index test for the paginated shape**

`RoleController::index` currently returns a **collection** as `roles`. We paginate it, so `roles` becomes a paginator (`roles.data`). Update `tests/Feature/Rbac/RoleIndexTest.php` — change the "lists roles" assertions:
```php
->assertInertia(fn (Assert $page) => $page
    ->component('Rbac::pages/roles/Index')
    ->has('roles.data', 1)
    ->where('roles.data.0.name', 'editor')
    ->where('roles.data.0.permissions.0', 'audit.view')
);
```
(Keep the 403 test unchanged.)

- [ ] **Step 2: Add a sort test**

Create `tests/Feature/Rbac/RoleSortTest.php`:
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

it('sorts roles by name', function () {
    Role::findOrCreate('alpha', 'web');
    Role::findOrCreate('zeta', 'web');
    $user = User::factory()->create()->givePermissionTo('roles.viewAny');

    $this->actingAs($user)
        ->get('/rbac/roles?sort=-name')
        ->assertInertia(fn (Assert $page) => $page->where('roles.data.0.name', 'zeta'));
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `vendor/bin/pest tests/Feature/Rbac/RoleIndexTest.php tests/Feature/Rbac/RoleSortTest.php`
Expected: FAIL (roles is still a collection; no sorting).

- [ ] **Step 4: Refactor the controller index**

In `app/Modules/Rbac/Http/Controllers/RoleController.php`, add `use Spatie\QueryBuilder\QueryBuilder;` and `use Illuminate\Http\Request;` (if not present) and replace `index`:

```php
public function index(Request $request): Response
{
    $roles = QueryBuilder::for(Role::class)
        ->allowedSorts('name')
        ->allowedFilters('name')
        ->defaultSort('name')
        ->with('permissions')
        ->paginate($request->integer('per_page', 25))
        ->withQueryString()
        ->through(fn (Role $role) => RoleData::fromModel($role));

    return Inertia::render('Rbac::pages/roles/Index', [
        'roles' => $roles,
        'sort' => $request->string('sort')->toString() ?: null,
        'filters' => (object) $request->input('filter', []),
    ]);
}
```
(`Role` is the module's audited `App\Modules\Rbac\Models\Role`, already imported.)

- [ ] **Step 5: Run — expect PASS**

Run: `vendor/bin/pest tests/Feature/Rbac`
Expected: all Rbac tests pass.

- [ ] **Step 6: Rewrite the Roles index page with DataTable**

Rewrite `app/Modules/Rbac/resources/js/pages/roles/Index.tsx` mirroring the Users Index page: `AppLayout` + `PageHeader` (title "Roles", New button) + `<DataTable>` with columns `name` (sortable+filterable), `permissions` (render `r.permissions.length + ' permissions'`), and an actions column using `RowActionMenu` (Edit → `/rbac/roles/${r.id}/edit`; Delete via `ConfirmDialog`, **hidden for `super-admin`** — only add the Delete action when `r.name !== 'super-admin'`, and don't show Edit for super-admin either since it's protected). Props: `{ roles: Paginated<Role>, sort, filters }`.

- [ ] **Step 7: Form — FormLayout/FormField**

In `app/Modules/Rbac/resources/js/pages/roles/Form.tsx`, wrap in `FormLayout` + use `FormField` for the name input and the grouped permission checkboxes (one `FormField label="Permissions"` around the existing fieldset grid). Keep `PageHeader`.

- [ ] **Step 8: Lint, build, gate, commit**

```bash
npx prettier --write app/Modules/Rbac/resources/js/pages/roles
npx eslint app/Modules/Rbac/resources/js/pages/roles/Index.tsx app/Modules/Rbac/resources/js/pages/roles/Form.tsx
npm run build && composer check
git add app/Modules/Rbac/Http/Controllers/RoleController.php tests/Feature/Rbac app/Modules/Rbac/resources/js/pages/roles
git commit -m "feat(rbac): sortable/filterable roles DataTable + form components"
```

---

## Task 3: Rbac Permissions — PageHeader

**Files:** Modify `app/Modules/Rbac/resources/js/pages/permissions/Index.tsx`

- [ ] **Step 1: Use PageHeader**

In the permissions catalog page, replace the manual `<h1>` + subtitle with `<PageHeader title="Permissions" subtitle="Declared per module, synced via permission:sync. Read-only." />`. Keep the grouped grid (this page is a catalog, not a DataTable). It already sits in `AppLayout` (Plan A).

- [ ] **Step 2: Lint, build, commit**

```bash
npx prettier --write app/Modules/Rbac/resources/js/pages/permissions/Index.tsx
npx eslint app/Modules/Rbac/resources/js/pages/permissions/Index.tsx
npm run build
git add app/Modules/Rbac/resources/js/pages/permissions/Index.tsx
git commit -m "feat(rbac): use PageHeader on the permissions catalog"
```

---

## Task 4: Audit — DataTable rendering + PageHeader

**Files:** Modify `app/Modules/Audit/resources/js/pages/Index.tsx`

- [ ] **Step 1: Render with DataTable + PageHeader, keep the filter bar**

In the Audit Index page: keep the existing event/module/date **filter bar** (it drives the controller's custom filters) but restyle the controls with the shadcn `Input`/`Select` if convenient; replace the hand-written `<table>` with `<DataTable>` over `activities` (a `Paginated<AuditEntry>`). Columns (none sortable/filterable — the page keeps its own filter bar): `createdAt` (render localized date), `event`, `description`, `subject` (render `subjectType ? subjectType#subjectId : '—'`), `causer` (render `causer ?? '—'`), `changes` (render the before/after `<pre>` as today). Wrap in `PageHeader title="Audit log"`. Keep `AppLayout`.

> The Audit controller is unchanged — it already returns a paginator (`activities`) + `filters` + `events`. `DataTable` just renders `activities`; the page passes no `sort`/`filterable` columns, so it won't fight the existing filter bar.

- [ ] **Step 2: Lint, build, gate, commit**

```bash
npx prettier --write app/Modules/Audit/resources/js/pages/Index.tsx
npx eslint app/Modules/Audit/resources/js/pages/Index.tsx
npm run build && composer check
git add app/Modules/Audit/resources/js/pages/Index.tsx
git commit -m "feat(audit): render the audit log with DataTable + PageHeader"
```

---

## Task 5: Update the `add-resource` skill + conventions

**Files:** Modify `.claude/skills/add-resource/SKILL.md`, `docs/conventions.md`

- [ ] **Step 1: Update the skill**

In `.claude/skills/add-resource/SKILL.md`, update the controller + page steps to the new standard:
- Index controller uses `QueryBuilder::for(Model::class)->allowedSorts(...)->allowedFilters(...)->defaultSort('-created_at')->paginate()->withQueryString()->through(...)` and returns `rows` + `sort` + `filters`.
- The React Index page uses `AppLayout` + `PageHeader` + `<DataTable columns rows sort filters>` with a `RowActionMenu` actions column + `ConfirmDialog` for deletes; empty handled by `DataTable`/`EmptyState`.
- The Form page uses `FormLayout` + `FormField`.
- Add a line: every list endpoint is sortable/filterable via the whitelist; add a `sort`/`filter` Pest test per the Users example.

- [ ] **Step 2: Update conventions §3 (CRUD shape)**

In `docs/conventions.md` §3, add a short "List pages use `DataTable` + QueryBuilder" subsection referencing `app/Modules/Users` and the components, and that mutations confirm via `ConfirmDialog` and flash via toasts.

- [ ] **Step 3: Verify + commit**

```bash
grep -q 'DataTable' .claude/skills/add-resource/SKILL.md && grep -q 'QueryBuilder' .claude/skills/add-resource/SKILL.md && echo OK
git add .claude/skills/add-resource/SKILL.md docs/conventions.md
git commit -m "docs(skills): add-resource generates DataTable + QueryBuilder indexes"
```

---

## Task 6: Final verification

- [ ] **Step 1: Gates**

Run: `composer check` → green (report test count; expect ≥104 with the new Roles sort test).
Run: `npm run build` → succeeds; all module pages compile.
Run: `npx eslint app/Modules/*/resources/js/pages` → clean.

- [ ] **Step 2: Routes + live sanity**

Run: `php artisan route:list --name=users.index --name=rbac.roles.index --name=audit.index 2>/dev/null || php artisan route:list | grep -E 'users|rbac|audit'`
Expected: the three index routes present.

---

## Self-Review

**Spec coverage (Plan D):**
- Users page onto shell + DataTable + RowActionMenu + ConfirmDialog + FormLayout → Task 1 ✅
- Roles sortable/filterable DataTable + QueryBuilder + components + tests → Task 2 ✅
- Permissions PageHeader → Task 3 ✅
- Audit DataTable + PageHeader → Task 4 ✅
- `add-resource` skill + conventions updated → Task 5 ✅

**Placeholder scan:** backend code (Roles controller) + test changes are exact; React page changes are specified by mirroring the canonical Users page (Plan B) with explicit columns/actions — not placeholders, but pattern-references to existing committed code.

**Type consistency:** Roles page uses `Paginated<Role>` + `Column<Role>` (Plan B types); `RoleData` shape unchanged (id/name/permissions). The controller returns `roles`/`sort`/`filters` matching the page props, mirroring Users. `RowAction`/`ConfirmDialog` props match Plan C.

**Regression watch:** `RoleIndexTest` updated for the paginated shape (Task 2 Step 1); all other module tests unaffected (controllers' prop names for create/store/edit/update/destroy unchanged).
