# Admin Design System (in-code) — Design

**Date:** 2026-06-09
**Status:** Approved (design phase)

## 1. Goal

An in-code admin design system + dashboard layer for the template: a consistent visual identity
(configurable brand token, light/dark), a proper dashboard shell with permission-gated navigation,
a reusable component library, and a server-side **sortable/filterable** DataTable — then wire the
existing Audit/Rbac/Users module pages onto it. This also closes the known UI gaps (module pages not
using the app layout, no nav links, no pagination).

**Visual direction (locked during brainstorming):** soft & comfortable with **moderate rounding**
(~0.5rem, not heavy), soft shadows, default accent **teal** exposed as a **single configurable
token**, table footer pagination.

## 2. Foundation already present (build on, don't rebuild)

- Tailwind + **shadcn/ui** components in `resources/js/components/ui/*` (button, card, badge, dialog,
  dropdown-menu, input, select, sidebar, sheet, skeleton, tooltip, …). **Missing: `table`.**
- Layouts in `resources/js/layouts/` incl. `app/app-sidebar-layout.tsx`.
- `use-appearance` (light/dark) and ~101 CSS design tokens in `resources/css/app.css`.
- Inertia shares `auth.user` only — **not** permissions (`app/Http/Middleware/HandleInertiaRequests.php`).
- Sidebar nav (`resources/js/components/app-sidebar.tsx`) is hardcoded to `[Dashboard]` + starter-kit
  footer links.

## 3. Decomposition — one spec, four sequential plans (each a PR)

### Plan A — Foundation: tokens + shell + nav + permissions
- **Design tokens:** set the brand `--primary` (and accent-related tokens) to **teal** in `app.css`
  for light and dark; settle a **moderate radius** scale (~0.5rem) and soft-shadow tokens. Document
  in `docs/conventions.md`: "change the brand = edit the one `--primary` token (+ dark variant)."
- **Permission exposure:** `HandleInertiaRequests::share()` adds
  `auth.permissions` = `$user?->getPermissionNames()` (array of names; spatie-cached) and
  `auth.isSuperAdmin` = `$user?->hasRole('super-admin')`. Extend the `Auth`/`SharedData` TS types.
- **`can()` hook:** `resources/js/hooks/use-permissions.ts` exposing `can(permission: string)` →
  `isSuperAdmin || permissions.includes(permission)`.
- **Shell + nav:** module pages render inside `AppSidebarLayout`. Rewrite `app-sidebar.tsx` nav to
  Dashboard + Users (`users.viewAny`) + Roles (`roles.viewAny`) + Permissions (`permissions.viewAny`)
  + Audit (`audit.view`), each shown only when `can(...)`. Replace the starter-kit footer links with
  project-appropriate ones (or remove).

### Plan B — DataTable + server-side query (`spatie/laravel-query-builder`)
- Add **`spatie/laravel-query-builder`** (the Laravel best practice for safe, whitelisted
  sort/filter from query params).
- Add the shadcn **`table`** primitive (currently missing).
- Build `resources/js/components/data-table.tsx` (`<DataTable>`) + `resources/js/components/pagination.tsx`:
  - Columns declare `{ key, label, sortable?, filterable?, render? }`.
  - Header click toggles sort (`?sort=col` ⇄ `?sort=-col`); per-column filter input sets
    `?filter[col]=value` (text filters **debounced** ~300ms); push via
    `router.get(path, { sort, filter, page }, { preserveState: true, preserveScroll: true, replace: true })`.
  - Reads current `sort`/`filters` from props to render active state; footer shows
    `from–to of total` + Prev/Next from the Laravel paginator (`links`/`meta`).
- **Index controller convention:**
  ```php
  $rows = QueryBuilder::for(Model::class)
      ->allowedSorts(['name', 'email', 'created_at'])
      ->allowedFilters(['name', 'email', AllowedFilter::exact('role')])
      ->with([...])
      ->paginate($request->integer('per_page', 25))
      ->withQueryString()
      ->through(fn ($m) => XData::fromModel($m));
  // return ['rows' => $rows, 'sort' => $request->input('sort'), 'filters' => $request->input('filter', [])]
  ```
  Whitelisting = security: unknown sort/filter params are ignored, never 500.
- **Tests:** Pest feature tests — an allowed sort orders results; a disallowed sort is ignored; a
  filter narrows results; pagination metadata present.

### Plan C — Component library (pure frontend)
New components in `resources/js/components/`:
- `page-header.tsx` — title + optional subtitle + actions slot.
- `empty-state.tsx` — icon + message + optional action (shown when a table has no rows).
- `form-layout.tsx` + `form-field.tsx` — consistent form container + label/input/error wrapper.
- `confirm-dialog.tsx` — replaces native `confirm()` for destructive actions (uses shadcn `dialog`).
- `use-flash.ts` + `toaster.tsx` — surface Inertia flash (`success`/`error`) as toasts; wire flash
  into `HandleInertiaRequests` shared props (`flash.success` / `flash.error`).
- `search-input.tsx` — debounced search box (drives a table's global/text filter).
- `row-action-menu.tsx` — per-row Edit/Delete dropdown (uses shadcn `dropdown-menu`).
- Semantic `badge` variants — status/role badges (extend the existing shadcn `badge`).

### Plan D — Wire modules + update the build skill
- Refactor the React pages of **Audit**, **Rbac**, **Users** onto: `AppSidebarLayout` + `PageHeader`
  + `DataTable` (sortable/filterable) + `RowActionMenu` + `ConfirmDialog` + `EmptyState`; forms onto
  `FormLayout`/`FormField`. Replace ad-hoc tables and native `confirm()`.
- Switch their index controllers to the QueryBuilder pattern (allowedSorts/allowedFilters) and return
  `sort`/`filters` state. The Audit viewer's existing filters fold into this dialect.
- Update the **`add-resource`** skill + `docs/conventions.md` §3 (CRUD shape) so future modules
  generate: QueryBuilder index + `DataTable` page + `FormLayout` form + `ConfirmDialog` deletes +
  `PageHeader`, with sort/filter tests.
- Keep all existing 403/CRUD tests green; add sort/filter tests for at least the Users module.

## 4. Data flow

```
HandleInertiaRequests.share → auth.permissions / auth.isSuperAdmin / flash
        → usePermissions().can()  gates sidebar nav items + action buttons
DataTable → router.get(?sort, ?filter[col], ?page)
        → QueryBuilder (allowedSorts/allowedFilters, whitelisted)
        → Laravel paginator → XData DTO → Inertia props
        → DataTable renders rows + active sort/filter + pagination footer
action (delete/update) → redirect with flash → useFlash → Toast
```

## 5. Error handling

- Unknown/invalid `sort`/`filter` params: ignored by QueryBuilder's whitelist — no error.
- Empty result set: `EmptyState` instead of a bare table.
- Server flash errors / validation: surfaced via `Toast`; field errors via `FormField`.
- Permission changes: nav/buttons reflect `can()`; server still enforces `can:` middleware (defence
  in depth — the FE gating is UX only, never the security boundary).

## 6. Testing

- **Backend (Pest):** sort/filter feature tests per the QueryBuilder convention; existing module
  tests (403 per mutation + CRUD) stay green. `auth.permissions` shared-prop test.
- **Frontend:** components verified via `npm run build` + manual; controller Inertia-prop tests
  assert `rows`/`sort`/`filters` shape.
- **Gate:** `composer check` (Pint + PHPStan level 6 + Pest) and `npm run build` green at the end of
  each plan.

## 7. Out of scope (YAGNI)

- Client-side table libraries (TanStack) — server-side QueryBuilder is the chosen approach.
- Dashboard analytics/StatCards with real metrics (no data source yet) — the shell is built but
  metric widgets are deferred.
- A Figma design system / token export — in-code only, per decision.
- Multi-theme switching beyond light/dark; per-user theme persistence beyond the existing
  `use-appearance`.

## 8. Acceptance (per plan)

- **A:** module pages render inside the app shell; sidebar shows only permitted sections;
  `can()` hook works; brand token is teal and documented as swappable; gate green.
- **B:** `<DataTable>` sorts and filters via the server (whitelisted), paginates; sort/filter Pest
  tests pass; gate green.
- **C:** the listed components exist, are used at least once, build clean; flash toasts work.
- **D:** Users/Rbac/Audit use the shell + DataTable + components; their indexes are
  sortable/filterable; `add-resource` skill + conventions updated; all tests green; `npm run build`
  green.
