# Employee Archive (Soft-Hide) — Design

**Date:** 2026-08-05
**Module:** `Employee`
**Status:** Approved, ready for planning
**Scope:** Frontend only. `Employee` remains a frontend/localStorage mock, same as the rest of
this module — no backend changes, no PHP, no new routes.

## Problem

Every employee row's "Arsipkan" dropdown item (`columns.tsx`) is a leftover placeholder:
`toast.info('Hapus karyawan belum tersambung ke backend.')`. There is no way to remove an
employee from the management list without literally deleting their record — which this module
correctly avoids (no delete flow exists at all). The ask is a soft-hide: an `is_archived` flag,
default `false`, that removes a row from every view on the Employee management page without
touching the underlying data.

## Decision: one flag, filtered at the single merge point

`Employee` gains `is_archived: boolean`, added to the 20 seed fixtures (`resources/js/data/
Employee/employee.ts`, all `false`) and to `buildEmployeeFromForm` in `employee-storage.ts`
(also `false` — wizard-created employees start unarchived). It is **not** part of
`EmployeeFormData` — it's never set through Tambah/Edit, only through the dedicated Archive
action.

`Index.tsx` already computes one merged array, `allEmployees` (seed + overrides + local
records), that every other view on the page reads from — the table, and the "Total Karyawan
Aktif / Non Aktif / Baru" overview stats. Filtering happens at that single point:

```ts
const allEmployees = useMemo(
    () => [...employee.map((e) => ({ ...e, ...overrides[e.id] })), ...localEmployees].filter((e) => !e.is_archived),
    [overrides, localEmployees],
);
```

No other file needs to know the flag exists — every downstream view (table rows, stat counts)
is automatically consistent because they all read `allEmployees`.

## Decision: confirm dialog, module-styled (not the shared red `ConfirmDialog`)

Archiving is explicitly non-destructive (data stays, only hidden), so it should not read as
alarming the way `resources/js/components/confirm-dialog.tsx`'s default `destructive` red
button does (that component is already used elsewhere, e.g. `Iam/users/Index.tsx`, for a truly
irreversible `DELETE` — different semantics, shouldn't share styling). Per the approved mockup,
a new small `ArchiveConfirmDialog` local to the Employee module reuses the exact button classes
`StepForm` already established for this module (`resources/js/components/step-form.tsx`):
outline blue "Batal" (`border-[#1980C0] text-[#1980C0] hover:bg-[#1980C0]/5`), solid blue
"Arsipkan" (`bg-[#1980C0] hover:bg-[#1668a0]`), both `rounded-lg`.

Copy (from the approved mockup, capitalization fixed):

- Title: **"Arsipkan Karyawan?"** (mockup said "Pengguna" — corrected to match this module's
  established term for the entity, used everywhere else: toasts, page copy, etc.)
- Description: **"Kamu yakin ingin mengarsipkan karyawan ini? Semua data yang sebelumnya
  terkait tidak lagi terhubung dengan karyawan ini."**
- Buttons: **"Batal"** / **"Arsipkan"**

## Decision: archive action reuses the wizard's existing save branch

`columns.tsx`: `buildEmployeeColumns(onEdit, onArchive)` — the "Arsipkan" item's `onClick`
becomes `() => onArchive(row)`, replacing the placeholder toast. (This branch forked from
`main` before the separate, still-unmerged Employee Detail dialog PR — `buildEmployeeColumns`
here only has `onEdit` today, and the "Detail" item stays exactly as its current placeholder;
out of scope for this feature.) The `toast` import stays — "Detail" still calls
`toast.info(...)`.

`Index.tsx`: new `archiveTarget: Employee | null` state. Confirming the dialog patches
`is_archived: true` via **exactly the same seed-vs-local branch `finish()`'s edit path already
uses** — no new storage function needed:

```ts
const confirmArchive = () => {
    if (!archiveTarget) return;
    if (localEmployees.some((e) => e.id === archiveTarget.id)) {
        setLocalEmployees(updateLocalEmployee(archiveTarget.id, { ...archiveTarget, is_archived: true }));
    } else {
        setOverrides(saveEmployeeOverride(archiveTarget.id, { is_archived: true }));
    }
    toast.success(`${archiveTarget.full_name} berhasil diarsipkan.`);
    setArchiveTarget(null);
};
```

## Out of scope (explicit, per user decision)

- **No restore/unarchive UI.** An archived employee has no way to be viewed or brought back
  through this UI. The data itself is never deleted (still sits in `localStorage`), but nothing
  in this pass exposes a path back to it — that's accepted, not an oversight.
- **No "show archived" filter/toggle** on the list page.
- Reusing or modifying the shared `confirm-dialog.tsx` — a new module-local dialog is used
  instead (see above), so `Iam`'s existing delete-confirmation styling is untouched.

## Edge cases

- An employee archived, then somehow re-referenced (e.g. by id in a URL, if that ever existed)
  would simply not render — same as any row not present in `allEmployees` today. No special
  handling needed since nothing in this module currently deep-links to a single employee.
- Overview stats (`Total Karyawan Aktif` / `Non Aktif` / `Baru`) naturally exclude archived
  employees since they're computed from the already-filtered `allEmployees` — an archived
  employee who was `is_active: true` no longer counts toward "Aktif", which is correct: they're
  fully out of the management view.

## Verification

`npx tsc --noEmit`, `npm run lint`, `npm run build` must all pass (existing frontend gate) — no
PHP changes in this pass, so no Pest run is needed.
