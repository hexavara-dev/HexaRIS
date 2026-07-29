# Company — Struktur Organisasi (Org Structure) — Design

**Date:** 2026-07-28
**Status:** Retrospective — built iteratively against Figma screenshots rather than through the
`feature-brainstorm` → `plan-feature` pipeline. This doc captures the shipped design after the fact,
before the branch's first commit/PR, so the feature has the same spec-doc coverage as every other
feature in `docs/superpowers/specs/`.

## Goal

Give a company admin a page to view and edit the org chart (departments, divisions, staff) at
`/company/structure`, plus a first-run "Atur Struktur" wizard when no structure exists yet.
**Pure front-end mock** for this iteration — no `Company` module, no database, no API. All data is
either hardcoded demo data or user-entered data persisted to `localStorage` only.

## Scope decision

No new bounded context was created. The route is a plain closure in `routes/web.php` returning an
Inertia page — there is no `app/Modules/Company/` module yet. This is intentional for now: the page
has no permissions, no audit trail, and no backend writes, so `create-module` / `add-resource` did
not apply. **This is the main gap to close in a follow-up** (see "Out of scope" below).

## Architecture

### Route

```php
// routes/web.php (inside the auth middleware group)
Route::get('company/structure', function () {
    return Inertia::render('company/structure');
})->name('company.structure');
```

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

### Page (`resources/js/pages/company/structure.tsx`)

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

| Component | Purpose |
|---|---|
| `org-chart/org-chart.tsx` | Tree rendering + shared `OrgTree`/`OrgDepartment`/`OrgMember` types + `ORG_CHART_DEMO`. |
| `empty-state/org-structure-empty-state.tsx` | First-run empty state, `nothing.png` illustration. |
| `pop-up/create-structure-dialog.tsx` | 3-step "Atur Struktur"/"Atur Ulang Struktur" wizard (Departments → Staff → Preview). Seeds from `existingTree` via `draftDepartmentsFromTree()` when re-opened on a saved structure. CEO is hardcoded to "Nicholas Raharja" (matches the static company card) — no CEO input field. |
| `pop-up/add-department-dialog.tsx` | Nested "Tambah Departemen" sub-dialog used from the wizard. Exports the shared `DEPARTMENT_CATALOG` / `DIVISION_CATALOG` lookup lists and `NewDepartmentDraft` type. Add-only (no edit mode). |
| `pop-up/edit-department-dialog.tsx` | Single-department edit dialog opened from the detail panel/table row action. Same interaction pattern as the wizard (functional `Select` dropdowns for department/division name, per-slot `MemberSelect` dropdowns for staff — not the older popover-checkbox picker). |
| `pop-up/department-detail-panel.tsx`, `pop-up/division-detail-panel.tsx` | Sheet-based read panels. |

### Interaction patterns (kept consistent across both dialogs)

- Department name and division name are **functional `Select` dropdowns** (`DEPARTMENT_CATALOG` /
  `DIVISION_CATALOG`), not free-text or a separate pencil-edit affordance.
- Staff assignment is a **per-slot `Select` dropdown** (`PersonSelect` / `MemberSelect`) against a
  fixed name pool, not a popover checkbox list. Once a person is selected, their avatar renders inline.
- Preview steps render each person as a bordered-box row with a gray-caption division label, in a
  2-column grid.

### Persistence

`localStorage['hexaris.company-structure']` holds the last-saved `OrgTree` as JSON. Loaded lazily via
a `useState` initializer in `structure.tsx`; written via a `useEffect` on change. No versioning/schema
migration — acceptable for a mock-only feature with a single shape.

## Known limitations (accepted for this iteration)

- **No backend.** Nothing here is persisted server-side, gated by a permission, or audited. Refreshing
  a different browser/device shows the empty state again.
- **Fixed name pool.** Staff assignment picks from a hardcoded list of 15 people
  (`STAFF_POOL` in `create-structure-dialog.tsx`, `MOCK_EMPLOYEE_POOL` in `edit-department-dialog.tsx`)
  — not real employee records.
- **Fixed catalogs.** Department/division names come from hardcoded `DEPARTMENT_CATALOG` /
  `DIVISION_CATALOG` lists in `add-department-dialog.tsx`, not a configurable taxonomy.
- **Single branch/company.** The table view's "Cabang" column is decorative; there's no multi-branch
  data model yet.

## Out of scope (follow-up work)

- A real `Company` (or similarly named) bounded context: `OrgDepartment`/`OrgDivision`/`OrgMember`
  as Eloquent models, migrations, a `company.structure.view` / `company.structure.update` permission
  pair, `IsAudited` on writes, and an Inertia controller replacing the closure route and the
  `localStorage` persistence.
- Replacing the fixed `STAFF_POOL`/`MOCK_EMPLOYEE_POOL` with a real employee lookup once an
  Employees resource exists.
- Multi-branch support.

## Testing

Front-end only, no backend routes to gate — `npm run types`, `npm run lint`, and `npm run build` are
the applicable gate and are green. No Pest coverage applies until the backend module above exists.
