# Employee

Self-contained `Employee` module.

## Permissions

| Permission | Purpose |
|---|---|
| `employees.viewAny` | List employees |
| `employees.create` | Create an employee |
| `employees.update` | Update an employee |
| `employees.delete` | Delete an employee |

Run `php artisan permission:sync` after changing `permissions.php`.

## Routes

| Method | URI | Name | Permission |
|---|---|---|---|
| `GET` | `employees` | `employees.index` | `employees.viewAny` |

The remaining CRUD routes (`create`/`store`/`edit`/`update`/`destroy`) are
scaffolded but commented out in `routes/web.php` and in the controller until the
Employee model, migration, FormRequests, and DTO exist. Uncomment each one —
together with its `can:` middleware — as it is implemented.

## Frontend wizard (Tambah Karyawan / Edit Karyawan)

No `Employee` model or `employees.store`/`employees.update` route exists yet — the
"Tambah Karyawan" / "Edit Karyawan" wizard on `/employees` is entirely frontend-mocked,
backed by `localStorage`. Both modes reuse the same `StepForm` shell; `Index.tsx` tracks
`editingEmployee: Employee | null` (`null` = create) and switches the dialog title and the
last step's button label (`"Simpan"` vs `"Perbarui"`) accordingly.

### Key files

| File | Responsibility |
|---|---|
| `resources/js/lib/validate-employee-form.ts` | Required-field validation (client-side stand-in — there is no backend to validate against) |
| `resources/js/lib/employee-storage.ts` | Create/update wizard-created employees; a separate override store for edits to the 20 seed employees, which are never mutated directly |
| `resources/js/lib/employee-form-overlay.ts` | Hydrates the form on Edit — exact, from a prior save through the wizard, or best-effort from the real ERD fixtures (`resources/js/data/Employee/*.ts`) for an employee never edited before |
| `resources/js/lib/employee-org.ts` | Resolves an employee's department/division id from `employeeAssignment` + `organization` |
| `resources/js/pages/columns.tsx` | `buildEmployeeColumns(onEdit)` — list columns; Cabang/Departemen/Divisi fall back to the form overlay when no ERD assignment exists (wizard-created or previously-edited employees) |
| `resources/js/components/detail/` | Read-only "Detail" dialog (row action) — six tabs mirroring the wizard's steps, sourced from the same `hydrateEmployeeFormData` Edit uses |

### localStorage keys

| Key | Holds |
|---|---|
| `hexaris.employee.local-records` | Employees created through the wizard |
| `hexaris.employee.overrides` | Wizard-editable field patches for edited **seed** employees only |
| `hexaris.employee.form-overlay` | Full `EmployeeFormData` snapshot per employee id, so the next Edit of that employee is exact instead of best-effort |

### Accepted gaps

- **Uploaded files persist as base64 (`StoredFile`, capped at 2MB each), not real storage.**
  `saveFormOverlay` converts any freshly picked `File` via `FileReader` before writing to
  `localStorage` — Edit and the row's "Detail" dialog can both preview a previously uploaded
  file (eye icon) without needing to re-attach it. This is a stronger mock, not real
  persistence: there is still no backend, `localStorage` has only ~5-10MB of headroom per
  origin, and a save that would exceed it drops the file fields with a toast rather than
  losing the rest of the form (see `employee-form-overlay.ts`'s `withoutFiles`).
- **Pendidikan, Pengalaman Kerja, and Level (in Ketentuan) have no ERD equivalent** — the
  seed fixtures don't model education history, work experience, or a job-level taxonomy
  matching the wizard's Manajer/Direksi/Senior/Junior set. These start empty the first time
  a seed employee is edited; once filled in and saved, the overlay remembers them.
- **`division_id` is only required when the selected department actually has divisions** —
  Operasional, Finance, and the top-level company assignment have none in the seed data, so
  requiring it unconditionally would make Edit/Simpan permanently unsatisfiable for them.

See `docs/superpowers/specs/2026-08-03-employee-edit-wizard-design.md` for the full design
rationale and accepted trade-offs.
