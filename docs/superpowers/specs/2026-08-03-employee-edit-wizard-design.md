# Employee Edit Wizard — Design

**Date:** 2026-08-03
**Module:** `Employee`
**Status:** Approved, ready for planning
**Scope:** Frontend only. No backend changes at all — Employee itself remains a
frontend/localStorage mock, and (revised from an earlier draft of this doc) file uploads stay
mocked too, for consistency with the rest of the feature. No `Employee` model, migration,
`employees.store`/`employees.update` route, or new PHP route of any kind in this pass.

## Problem

"Tambah Karyawan" is a 6-step wizard (`StepForm` + `useForm<EmployeeFormData>`) that only
creates. There is no way to edit an existing row — the "Edit" item in each row's dropdown
menu (`columns.tsx`) is currently a leftover bug: it fires the same toast as "Arsipkan"
("Hapus karyawan belum tersambung ke backend.").

Editing is harder than it looks here because employee data comes from two disconnected
places:

- **20 seed employees** (`resources/js/data/Employee/*.ts`) — a real ERD: `employee`,
  `employeeAssignment` (department/division/position/manager), `employeeBankAccount`,
  `employeeDocument`, `employeeInsurance`, `employmentContract`. Rich, but shaped
  differently from the wizard.
- **Wizard-created employees** (`employee-storage.ts`, localStorage) — only the flat
  `Employee` columns are kept today; everything the wizard collects beyond that
  (education, work experience, department/division, bank, BPJS, job level) is discarded
  at save time.

Two structural gaps exist between the ERD and the Figma-derived wizard, and this design
deliberately does **not** resolve them (explicit decision, see "Accepted gaps" below):

- `employeeDocument` has no start/end date or final score — the wizard's Pendidikan step does.
- There is no work-experience table in the ERD at all.

## Decision: hydrate-then-edit, on the same `StepForm`

Edit does not get a new UI. `StepForm` gains a second mode:

```text
Index.tsx
  editingEmployee: Employee | null   // null = create, set = edit
  openCreate()  → editingEmployee = null,  data = initialEmployeeFormData
  openEdit(row) → editingEmployee = row,   data = hydrateEmployeeFormData(row)
```

`hydrateEmployeeFormData(employee)` tries two sources, in order:

1. **Form overlay** (new, localStorage, keyed by employee id) — a full `EmployeeFormData`
   snapshot written every time a save succeeds (both create and edit). If present, used
   as-is — exact, nothing lost.
2. **Best-effort from the ERD**, only for fields that map *cleanly* — personal info,
   address, department/division (`employeeAssignment`), contract type + join date
   (`employmentContract`), bank account (`employeeBankAccount`), BPJS numbers
   (`employeeInsurance`). Fields with no clean mapping (education, work experience, job
   level, every file) start empty rather than being force-mapped into the wrong shape.

Once a user fills in the fields that started empty and clicks **Perbarui**, the overlay
snapshot remembers them — the next edit of that same employee is exact, not degraded back
to best-effort. This is the whole reason the overlay exists instead of re-deriving from the
ERD every time.

Editing a **seed** employee never mutates `resources/js/data/Employee/*.ts` — those files
stay the static fixtures they are. Changes live in:
- the form overlay (all wizard fields), and
- a separate `employee-overrides.ts` localStorage store, keyed by id, holding just the flat
  `Employee` fields the list/table renders (name, email, phone, status, ...). `Index.tsx`
  merges overrides over the seed array when building `allEmployees`.

Editing a **wizard-created** (local) employee updates its entry in the existing
`loadLocalEmployees()`/localStorage array directly — no separate override store needed since
that record isn't a static import.

### Files

| File | Action |
|---|---|
| `app/Modules/Employee/resources/js/lib/employee-form-overlay.ts` | **New.** `loadFormOverlay()`, `saveFormOverlay(id, data)`, `hydrateEmployeeFormData(employee)`. |
| `app/Modules/Employee/resources/js/lib/employee-storage.ts` | **Extend.** Add `updateLocalEmployee(id, employee)` and the seed-override store (`loadEmployeeOverrides`/`saveEmployeeOverride`). |
| `app/Modules/Employee/resources/js/pages/Index.tsx` | **Extend.** `editingEmployee` state, `openEdit`, branch `finish()` create vs update, merge overrides into `allEmployees`. |
| `resources/js/components/step-form.tsx` | **Extend.** `finishLabel` prop (default `"Simpan"`) so the last-step button can read `"Perbarui"`. |
| `app/Modules/Employee/resources/js/pages/columns.tsx` | **Fix.** Wire the "Edit" item to call `onEdit(row)` instead of the leftover delete toast; `employeeColumns` becomes a factory `buildEmployeeColumns(onEdit)` so `Index.tsx` can pass the callback in. |

## File uploads: still mocked — a "had one before" flag, not real storage

`File` objects cannot survive in localStorage (or a reload) — that was already true for
creates today, silently. Revised decision: rather than add the one real backend piece in an
otherwise fully-mocked feature, files stay exactly as unpersisted as they already are.
`FileUploadField` and every `File | null` field on `EmployeeFormData` are **unchanged**.

Instead, the form overlay stores a small companion flag per *required* file field —
`FileFieldFlags = { ktp: boolean; contract: boolean; educationCertificate: boolean }` — set
from whether that field was non-null at the moment a save last succeeded. (`npwp` and each
work experience's `reference_letter` are optional fields already, so they need no flag.)

- Saving an overlay snapshot always writes the file fields as `null` (a `File` can't be
  `JSON.stringify`'d meaningfully) and separately records `FileFieldFlags` alongside it.
- `hydrateEmployeeFormData` returns `{ data, fileFlags }`. For a seed employee with no prior
  overlay, `fileFlags` is still best-effort where the ERD actually proves a document exists —
  `employeeDocument` for `educationCertificate`, `employmentContract.legal_document_path` for
  `contract` — `ktp` has no ERD equivalent at all, so it stays `false` (a fresh employee
  edited for the first time genuinely has no KTP on file and should be asked for one).
- `validateEmployeeForm(data, fileFlags)` treats a required file field as satisfied if either
  a fresh `File` was picked this session (`data.ktp !== null`) **or** `fileFlags.ktp` is true
  — so editing doesn't force re-uploading a document just because the raw bytes were never
  actually kept anywhere.

This is honest about the limitation rather than hiding it: Edit will never let a user
*see or re-download* a previously uploaded document, only proceed without being forced to
re-attach one. Real file persistence is future work, alongside the rest of Employee's move
off localStorage.

## Edge cases

- Cancelling an edit (Batal, or closing the dialog) never touches the overlay, the override
  store, or the seed/local employee record — `reset()` (already existing) discards whatever
  was typed, same as create today.
- The "Tambah Karyawan" trigger button and each row's "Edit" item both open the same dialog;
  since it's a modal `Dialog`, only one can be open at a time — no conflict between an
  in-progress create and clicking Edit on a row.
- Validation (`validateEmployeeForm`) is unchanged in edit mode, except the three required
  file fields also pass if `fileFlags` says one existed before — not just a freshly-picked
  `File` (see "File uploads" above).

## Out of scope (this pass)

- Real `Employee` Eloquent model, migration, `employees.store`/`employees.update` routes,
  and any DB-backed persistence of employee data itself (still localStorage/mock).
- Resolving the ERD-vs-wizard field gap (education dates/score, work experience) — accepted,
  not fixed, per explicit decision during design.
- Real file persistence (upload/download/delete against actual storage) — files remain
  session-only exactly as they are today, per the revised decision above.

## Verification

`npx tsc --noEmit`, `npm run lint`, `npm run build` must all pass (existing gate) — no PHP
changes in this pass, so no Pest run is needed for this feature.
