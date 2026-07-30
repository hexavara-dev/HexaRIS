# Company — Struktur Organisasi (Org Structure) — Design

**Date:** 2026-07-28 (updated after PR #9 review)
**Status:** Retrospective — built iteratively against Figma screenshots rather than through the
`feature-brainstorm` → `plan-feature` pipeline. This doc captures the shipped design after the fact,
so the feature has the same spec-doc coverage as every other feature in `docs/superpowers/specs/`.

## Goal

Give a company admin a page to view and edit the org chart (departments, divisions, staff) at
`/company/structure`, plus a first-run "Atur Struktur" wizard when no structure exists yet. **The
page now lives in its own `app/Modules/Company/` bounded context**, but the feature itself is still
**pure front-end mock** for this iteration — no models, no migrations, no API. All data is either
hardcoded demo data or user-entered data persisted to `localStorage` only.

## Scope decision

A `Company` bounded context now exists (scaffolded via `php artisan module:make Company`), holding
the page and its route/controller. It intentionally has **no models, migrations, or permissions
yet** — the page has no server-side writes to gate or audit, so those pieces of the module stay
empty until a real backend is built. **This is the main gap to close in a follow-up** (see "Out of
scope" below).

## Architecture

### Module & route

```
app/Modules/Company/
  module.json
  permissions.php              # empty — no permission-gated writes yet
  routes/web.php
  Providers/CompanyServiceProvider.php
  Http/Controllers/CompanyStructureController.php
  resources/js/pages/Structure.tsx
```

```php
// app/Modules/Company/routes/web.php
Route::middleware('auth')->prefix('company')->name('company.')->group(function () {
    Route::get('structure', CompanyStructureController::class)->name('structure');
});
```

```php
// app/Modules/Company/Http/Controllers/CompanyStructureController.php
class CompanyStructureController
{
    public function __invoke(): Response
    {
        return Inertia::render('Company::pages/Structure');
    }
}
```

No permission gate on the route — matches `dashboard`'s own precedent (an authenticated-user page,
not a permission-scoped admin CRUD resource). Add a `company.structure.view`-style permission when
real data/writes exist and gating actually matters.

### Data model (`resources/js/components/design-system/org-chart/org-chart.tsx`)

```ts
type OrgMember = { name: string; role: string };
type OrgDivision = { name: string; head: OrgMember; members: OrgMember[] };
type OrgDepartment = {
    name: string;
    hasDivisions: boolean;
    head?: OrgMember;          // set only when hasDivisions === true
    divisions?: OrgDivision[]; // set only when hasDivisions === true
    members?: OrgMember[];     // set only when hasDivisions === false; members[0] is the head
};
type OrgTree = { ceo: OrgMember | null; departments: OrgDepartment[] };
```

**Dual head-storage quirk (by design, not a bug):** a department *with* divisions stores its head in
the separate `head` field; a department *without* divisions stores its head as `members[0]` by
convention. Every component that reads or writes an `OrgDepartment` (`edit-department-dialog.tsx`,
`create-structure-dialog.tsx`) has to respect this split explicitly. `ORG_CHART_DEMO` in
`org-chart.tsx` is exported demo data, kept for reference/dev use but no longer the page's default
state.

### Page (`app/Modules/Company/resources/js/pages/Structure.tsx`)

- Default state is **empty** (`ceo: null, departments: []`), loaded via `loadStoredStructure()` from
  `localStorage` (key `hexaris.company-structure`) on first render.
- Renders `OrgStructureEmptyState` (empty-state illustration + "Atur Struktur" CTA) when
  `!hasStructure`; otherwise renders the org chart / table tabs.
- `CreateStructureDialog` is opened either from the empty state ("Atur Struktur") or from an existing
  structure ("Atur Ulang Struktur"), passing `existingTree={hasStructure ? {ceo, departments} : null}`
  so re-opening the wizard on top of a saved structure seeds it instead of wiping it.
- Any successful wizard save or single-department edit writes back to `localStorage` and shows a
  success toast.

### Components

Shared, presentational components stay in the root `resources/js/components/design-system/` tree
(same pattern the `Iam` module uses — e.g. `users/Index.tsx` imports `@/components/data-table` from
root) rather than moving inside `app/Modules/Company/`. Only the *page* lives in the module.

| Component | Purpose |
|---|---|
| `org-chart/org-chart.tsx` | Tree rendering + shared `OrgTree`/`OrgDepartment`/`OrgMember` types + `ORG_CHART_DEMO`. |
| `empty-state/org-structure-empty-state.tsx` | First-run empty state, `nothing.png` illustration. |
| `pop-up/create-structure-dialog.tsx` | 3-step "Atur Struktur"/"Atur Ulang Struktur" wizard (Departments → Staff → Preview). Seeds from `existingTree` via `draftDepartmentsFromTree()` when re-opened on a saved structure. CEO is hardcoded to "Nicholas Raharja" (matches the static company card) — no CEO input field. |
| `pop-up/add-department-dialog.tsx` | Nested "Tambah Departemen" sub-dialog used from the wizard. Exports the shared `DEPARTMENT_CATALOG` / `DIVISION_CATALOG` lookup lists and `NewDepartmentDraft` type. Add-only (no edit mode). |
| `pop-up/edit-department-dialog.tsx` | Single-department edit dialog opened from the detail panel/table row action. Same interaction pattern as the wizard (functional `Select` dropdowns for department/division name — filtered against sibling department/division names so two departments can't collide — and per-slot `PersonSelect` dropdowns for staff, not the older popover-checkbox picker). Exports `shortName()`, reused by the page for the sibling-name filter. |
| `pop-up/person-select.tsx` | Shared person-picker dropdown used by both `CreateStructureDialog` and `EditDepartmentDialog` (see "Shared building blocks" below), plus the single canonical `STAFF_POOL`. |
| `pop-up/department-detail-panel.tsx`, `pop-up/division-detail-panel.tsx` | Sheet-based read panels (pre-existing files, untouched naming). |

### Shared building blocks (extracted after PR #9 review)

The `@claude /review` pass on PR #9 flagged four pieces duplicated near-identically between
`CreateStructureDialog` and `EditDepartmentDialog`. All four have since been extracted:

- **`PersonSelect`** (`pop-up/person-select.tsx`) — one generic dropdown replacing the wizard's old
  `PersonSelect` (id-keyed) and the edit dialog's old `MemberSelect` (name-keyed). Takes a
  `getKey(person) => string` prop (defaults to `person.id`; the edit dialog passes `(p) => p.name`)
  and an `initials(name) => string` prop so each call site's original avatar-fallback text is
  preserved exactly (the wizard used `name.slice(0,2).toUpperCase()`; the edit dialog used
  first-letter-of-first-two-words — both preserved as-is via the `initials` prop, not unified).
- **`filterAvailable(catalog, current, taken)`** (`lib/utils.ts`) — replaces the
  `catalog.filter(name => name === current || !taken.has(name))` pattern that was hand-written at
  6 call sites across the three dialog files.
- **`STAFF_POOL`** (`pop-up/person-select.tsx`) — one canonical list replacing the two previously
  separate mock pools (`STAFF_POOL` in the wizard, `MOCK_EMPLOYEE_POOL` in the edit dialog). It's the
  **union** of both former lists (17 people, not 15) so no name pickable in either dialog before this
  change disappeared — a small, deliberate, additive side effect: 2 names that were previously
  edit-dialog-only ("Putri Wulandari", "Bagas Saputra") are now also selectable from the wizard, and 2
  that were wizard-only ("Bastian Ari", "Anggoro Putra") are now also selectable from the edit dialog.
  This does **not** fix the cross-dialog "taken" dedup gap noted below — that needs shared state, not
  just a shared data source.
- **`ORG_STRUCTURE_STEPS`** (`stepper/stepper.tsx`) — the `Stepper` component itself was already
  shared before this change; only the `[{label:'Struktur'},{label:'Staff'},{label:'Preview'}]` array
  literal was duplicated in both files. Now a single exported constant.

Not extracted (deliberately): unifying `CreateStructureDialog` and `EditDepartmentDialog` into one
generic dialog. Their draft state shapes (`DraftDepartment`, id-referenced vs `EditableDepartment`,
`OrgMember`-embedded) still differ, and forcing one shape now would mean guessing at a backend
contract that doesn't exist yet — deferred to when the real `Company` backend module is built.

File naming: the seven component files above (new to this feature) briefly used `PascalCase.tsx`
per an earlier request in the PR #9 review thread, but were reverted back to `kebab-case.tsx` to
match the idiom used by every other file under `resources/js/components/**` (including sibling
files in the same `pop-up/` folder, e.g. `division-detail-panel.tsx`). PascalCase is reserved for
*page* components (`Structure.tsx`, `Index.tsx`) resolved via the `Module::pages/...` Inertia
convention, not for presentational components.

### Interaction patterns (kept consistent across both dialogs)

- Department name and division name are **functional `Select` dropdowns** (`DEPARTMENT_CATALOG` /
  `DIVISION_CATALOG`), not free-text or a separate pencil-edit affordance. Both dialogs filter out
  names already taken by a sibling department/division, so two departments (or two divisions in the
  same department) can never end up with the same name — `EditDepartmentDialog` takes a
  `siblingDepartmentNames` prop from the page for this.
- Staff assignment is a **per-slot `Select` dropdown** (`PersonSelect` / `MemberSelect`) against a
  fixed name pool, not a popover checkbox list. Once a person is selected, their avatar renders inline.
- Preview steps render each person as a bordered-box row with a gray-caption division label, in a
  2-column grid.

### Persistence

`localStorage['hexaris.company-structure']` holds the last-saved `OrgTree` as JSON. Loaded lazily via
a `useState` initializer in `Structure.tsx`; written via a `useEffect` on change. No versioning/schema
migration — acceptable for a mock-only feature with a single shape.

## Known limitations (accepted for this iteration)

- **No backend persistence.** Nothing here is written server-side, gated by a permission, or audited.
  Refreshing on a different browser/device shows the empty state again.
- **Fixed name pool, still not deduplicated *across dialogs* at the "taken" level.** `STAFF_POOL` is
  now a single shared list (see "Shared building blocks" above), but each dialog still only tracks
  its own "taken" set — the wizard checks cross-department within its own draft, the edit dialog
  checks only within the single department being edited. A person already assigned via the wizard can
  still be picked again through "Edit Departemen" in a different department without warning, since
  neither dialog knows about the other's assignments. Fixing this needs shared "taken" state (lifted
  to `Structure.tsx` and threaded into both dialogs), not just a shared pool — left as an explicit
  follow-up (flagged as Warning #3 in the `@claude /review` pass on PR #9).
- **Fixed catalogs.** Department/division names come from hardcoded `DEPARTMENT_CATALOG` /
  `DIVISION_CATALOG` lists in `add-department-dialog.tsx`, not a configurable taxonomy.
- **Single branch/company.** The table view's "Cabang" column is decorative; there's no multi-branch
  data model yet.

## Out of scope (follow-up work)

- Real persistence: `OrgDepartment`/`OrgDivision`/`OrgMember` as Eloquent models + migrations in
  `app/Modules/Company/Database/Migrations/`, a `company.structure.view` / `company.structure.update`
  permission pair in `app/Modules/Company/permissions.php`, `IsAudited` on writes, and a real
  `store`/`update` action on `CompanyStructureController` (or a split controller) replacing
  `localStorage`.
- Once the backend + a real employee type exist: unify `CreateStructureDialog` and
  `EditDepartmentDialog` into one generic dialog (`mode: 'create' | 'edit' | 'add'`). Not done now —
  their draft data shapes (`DraftDepartment` vs `EditableDepartment`) would need to converge on the
  real API contract first, and doing it earlier risks premature abstraction. (The safe, presentation-
  only pieces — `PersonSelect`, `filterAvailable`, one pool, shared step labels — were already
  extracted; see "Shared building blocks" above.)
- Lift "taken" tracking out of each dialog into `Structure.tsx` and share it across both, so a person
  assigned in one dialog is correctly excluded in the other (closes the Warning #3 gap above).
- Replacing `STAFF_POOL` with a real employee lookup once an Employees resource exists.
- Multi-branch support.

## Testing

- `npm run types`, `npm run lint`, `npm run build` — green.
- `vendor/bin/pint --test` and `composer stan` — green (this module's PHP surface is a single
  invokable controller + route file, no business logic to unit test yet).
- No Feature/Pest tests added: the controller has no branching logic (a single unconditional
  `Inertia::render`) and the route requires only `auth`, matching the untested `dashboard` route's
  own precedent. Add a `CompanyStructureIndexTest` (200 authenticated / redirect guest) once the
  controller does more than render a static page.
