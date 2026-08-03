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

### localStorage keys

| Key | Holds |
|---|---|
| `hexaris.employee.local-records` | Employees created through the wizard |
| `hexaris.employee.overrides` | Wizard-editable field patches for edited **seed** employees only |
| `hexaris.employee.form-overlay` | Full `EmployeeFormData` snapshot per employee id, so the next Edit of that employee is exact instead of best-effort |

### Accepted gaps

- **Uploaded files are never actually persisted.** A `File` can't survive
  `JSON.stringify`, so every upload field is discarded on save. `FileFieldFlags`
  (`types/employee-form.ts`) tracks whether a *required* file was attached at the last
  successful save, so Edit doesn't force re-uploading it — but there is no way to view or
  download a previously uploaded document.
- **Pendidikan, Pengalaman Kerja, and Level (in Ketentuan) have no ERD equivalent** — the
  seed fixtures don't model education history, work experience, or a job-level taxonomy
  matching the wizard's Manajer/Direksi/Senior/Junior set. These start empty the first time
  a seed employee is edited; once filled in and saved, the overlay remembers them.
- **`division_id` is only required when the selected department actually has divisions** —
  Operasional, Finance, and the top-level company assignment have none in the seed data, so
  requiring it unconditionally would make Edit/Simpan permanently unsatisfiable for them.

See `docs/superpowers/specs/2026-08-03-employee-edit-wizard-design.md` for the full design
rationale and accepted trade-offs.
