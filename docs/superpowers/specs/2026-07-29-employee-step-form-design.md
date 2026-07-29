# Employee Step Form (Wizard) — Design

**Date:** 2026-07-29
**Module:** `Employee`
**Status:** Approved, ready for planning
**Scope:** Frontend only. No Model, migration, endpoint, or test in this pass.

## Problem

Adding an employee means collecting far more data than one screen can hold: personal
identity, education, work history, terms, salary and bank details. The design calls for a
six-step wizard in a dialog, opened from the "Tambah Karyawan" button in the employee
table's toolbar.

Four component stubs exist under `app/Modules/Employee/resources/js/components/step-forms/`.
`StepForm.tsx` is not valid TypeScript; `StepHeader.tsx`, `StepIndicator.tsx`, and
`StepNavigation.tsx` are empty. `pages/Index.tsx` currently does not compile — it renders
`Dialog`, `Button`, and `StepFOrm` without importing any of them.

## Decision: composition, not configuration

Steps are data; the fields inside a step are JSX.

```tsx
export interface WizardStep {
    label: string;       // rendered in the Stepper
    content: ReactNode;  // arbitrary JSX, written by the caller
}
```

A schema-driven alternative was designed and rejected. Driving field layout from data
requires re-inventing `colSpan`, nested groups, per-grid column counts, and a `render`
escape hatch — rebuilding JSX inside JSON, and losing to JSX on every axis. Two concrete
requirements settled it:

- **Nested columns.** "One row, two columns, the right one split in two again" is
  `<div className="grid grid-cols-2">` in JSX. In a schema it needs a recursive field type.
- **Cascading selects.** Kabupaten options depend on the selected provinsi. In JSX this is
  an ordinary expression over `data`. In a schema it needs cross-field reactivity.

Config is the right tool where things are uniform, composition where they vary. The step
list *is* uniform — every step is a label plus a body — so it stays an array. Field layout
is not, so it does not. The boundary sits exactly where uniformity ends.

This mirrors the existing split in the codebase: `DataTable` is config-driven
(`Column[]`, `FilterConfig[]`) because every column genuinely behaves alike, while its
`actions` and `rowActions` props take caller-supplied JSX for the parts that vary.

## Architecture

`StepForm` is a presentational shell. It owns exactly one piece of state — the active step
index — and knows nothing about fields, validation, or data shape.

```text
employee-wizard.tsx          owns useForm(); builds the steps array
  └── step-form.tsx          shell: header + Stepper + body + footer
        └── personal-step.tsx   step 1 fields (receives the form bag)
```

Form state lives in the caller via Inertia `useForm`, matching the convention in
`app/Modules/Iam/resources/js/pages/users/Form.tsx`. No context and no render props are
needed: because `content` is written inline, ordinary closures reach `data` and `setData`.

### Files

| File | Action |
|---|---|
| `resources/js/components/step-form.tsx` | **New.** Generic shell, shared across modules. |
| `resources/js/components/design-system/stepper/stepper.tsx` | **Reuse as-is.** Already matches the design; currently unused. |
| `app/Modules/Employee/resources/js/components/employee-wizard.tsx` | **New.** `useForm` + step assembly. |
| `app/Modules/Employee/resources/js/components/steps/personal-step.tsx` | **New.** Step 1 fields. |
| `app/Modules/Employee/resources/js/components/step-forms/` (4 files) | **Delete.** Superseded. |
| `app/Modules/Employee/resources/js/pages/Index.tsx` | **Fix.** Missing imports; wire up the dialog. |

File names are kebab-case, matching every other file under `resources/js/components/`.
The existing stubs are PascalCase, which is the inconsistency this design corrects.
PascalCase applies only to Inertia page files, where casing must match the string passed to
`Inertia::render()`.

`StepIndicator.tsx` is intentionally not created — `design-system/stepper/stepper.tsx`
already does exactly that job.

### `StepForm` API

```tsx
interface StepFormProps {
    steps: WizardStep[];
    title: string;
    onCancel: () => void;
    onFinish: () => void;
    processing?: boolean;
}
```

Layout: title and `Stepper` in a header row; the active step's `content` in a scrollable
body; a footer with "Batal" on the left and "Sebelumnya"/"Selanjutnya" on the right.
"Selanjutnya" becomes "Simpan" on the final step.

The host `DialogContent` needs explicit sizing — its default `sm:max-w-lg` is far too narrow
for a two-column wizard, and a six-step body will overflow a short viewport. It gets a wider
max width and a capped height with a scrollable body, so the header and footer stay fixed
while only the step content scrolls.

Navigation is unguarded in this pass — any step can advance. Per-step validation gating is
deferred until a backend exists to define the rules.

`FormLayout` is deliberately not used: it hardcodes `max-w-xl`, too narrow for a two-column
dialog. `StepForm` renders its own `<form>`.

## Step 1 — Personal

Fields, in the order they appear in the design, using the components already exported from
`resources/js/components/form/form-field.tsx`:

| Field | Component | Notes |
|---|---|---|
| Full Nama | `TextField` | required |
| Nomor WA | `TextField` | required, `inputMode="numeric"` |
| Jenis Kelamin | `SelectField` | required; `Gender` = `L` \| `P` |
| Agama | `SelectField` | required; `Religion` enum |
| Tgl Lahir | `TextField type="date"` | required |
| Provinsi + Kab/kota | two `SelectField` in a nested grid | cascade |
| Status | `SelectField` | required; Menikah \| Lajang → `is_married` |
| Alamat Lengkap | `TextField` | required |
| Upload KTP | `FileUploadField` | required, full width |
| Upload NPWP | `FileUploadField` | optional, full width |
| Upload Kontrak | `FileUploadField` | required, full width |

No new field components are introduced. The project has no date picker and none is added:
`TextField` already forwards its `type` prop, so `type="date"` yields a native date input.

Enum option lists derive from the types in `resources/js/data/Employee/employee.ts`
(`Gender`, `Religion`). The cascade reads `province` and `regency` from
`resources/js/data/Region/`, filtering `regency` by `province_id` against the selected
province `id`.

Layout is plain Tailwind: a two-column grid, with `col-span-2` on the address and the three
upload fields. Nesting is an ordinary nested `<div className="grid grid-cols-2">`.

## Remaining steps

Pendidikan, Pengalaman, Ketentuan, Gaji & Bank, and Pratinjau appear as labels in the
Stepper with placeholder bodies. They are navigable so the wizard's flow can be exercised
end to end.

## Out of scope

Deliberately excluded from this pass, each pending its own decision:

- Employee model, migration, DTO, `StoreEmployeeRequest`, and the `employees.store` route
- Submitting the form — "Simpan" performs no request
- Per-step validation gating
- File upload handling (Inertia's `forceFormData`, persisting `File` objects across steps)
- Feature tests, which have no endpoint to exercise

`docs/conventions.md` requires a `can:` gate and a 403 test on every mutating route. Both
apply when `employees.store` is implemented; neither is relevant while no route exists.

## Verification

`npx tsc --noEmit`, `npm run lint`, and `npm run build` must all pass. The build gate is
what forces the `Index.tsx` compile failure to be fixed as part of this work.

Both broken files are resolved by this work: `step-forms/StepForm.tsx` is deleted, and
`pages/Index.tsx` gets its missing `Dialog`, `Button`, and wizard imports.

Note that `tsc` currently reports only the `StepForm.tsx` parse error. A syntax error
anywhere aborts the whole semantic pass, so `Index.tsx`'s missing-import errors are hidden
behind it and will only surface once `StepForm.tsx` is gone. Expect a second round of errors
after the deletion — that is the checker catching up, not new breakage.
