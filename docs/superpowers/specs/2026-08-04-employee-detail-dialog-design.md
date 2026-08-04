# Employee Detail Dialog + Real File Preview — Design

**Date:** 2026-08-04
**Module:** `Employee`
**Status:** Approved, ready for planning
**Scope:** Frontend only. No backend changes — `Employee` remains a frontend/localStorage
mock, same as the wizard it builds on (see
[2026-08-03-employee-edit-wizard-design.md](./2026-08-03-employee-edit-wizard-design.md)).

## Problem

The list page's row menu has a "Detail" item that has always been a placeholder toast
(`toast.info(...'belum tersedia.')`). There's also a dead stub component,
`components/steps/detail-dialog.tsx`, that renders nothing. Clicking Detail should open a
read-only dialog: a profile header (photo, name, position) and a tabbed view of the
employee's full biodata — Personal, Pendidikan, Pengalaman, Ketentuan, Gaji & Bank, and a new
Dokumen Pendukung tab — mirroring the wizard's own steps but read-only and freely
tab-switchable (no next/back).

Building the Dokumen Pendukung tab surfaced a second, pre-existing gap worth closing in the
same pass: uploaded files (`ktp`, `npwp`, `contract`, education `certificate`, each work
experience's `reference_letter`) are **never actually persisted** — `employee-form-overlay.ts`
nulls every file field before saving (see the edit-wizard design's "File uploads: still
mocked" section). That means Detail's documents tab would have nothing real to preview, and
Edit already can't show what was uploaded last time either. This design fixes both at once:
files get persisted (as base64), and both the wizard's `FileUploadField` and the new Detail
dialog gain a real preview popup.

## Decision: `StoredFile` (base64) replaces "null it out"

```ts
type StoredFile = { name: string; type: string; dataUrl: string };
```

`EmployeeFormData`'s file-shaped fields change type from `File | null` to
`File | StoredFile | null`:

- A **freshly picked** file (user just clicked the dropzone) is a live `File` — shown via the
  existing `useFilePreviewUrl` object-URL mechanism, no conversion needed to display it.
- Anything **hydrated** from the form overlay (a prior save) or freshly saved this session is a
  `StoredFile` — `dataUrl` is used directly as the preview `src`/`href`, no object URL needed.

On save (`saveFormOverlay`), any live `File` is converted to `StoredFile` via `FileReader`
(`readAsDataURL`) and that's what's written to `localStorage` — replacing today's
`sanitizeForStorage`, which nulled these fields out. `saveFormOverlay` becomes async
(`Promise<void>`); `Index.tsx`'s `finish()` awaits it before closing the dialog.

**Size guard:** reject a file over **2MB** at selection time (toast error, selection
rejected) — `localStorage` has roughly 5-10MB of headroom total per origin and this app has no
backend to offload to yet. This is a new, explicitly documented accepted gap (README), not a
real quota solution.

`FileFieldFlags` (`ktp`/`contract`/`educationCertificate` booleans) stays as-is — it's still
used by `validateEmployeeForm` to know a required file was satisfied, computed the same way
(`data.ktp !== null` — true for both a live `File` and a hydrated `StoredFile`).

## Decision: eye + trash on every uploaded-file row

`FileUploadField`'s "uploaded" state currently wraps the whole row in an `<a>` (click-to-open)
plus a trash button. That changes to:

```
[icon] filename.pdf                              (eye)  (trash)
       2.4 Mb
```

- Row content (`FileTypeIcon` + name/size) becomes a plain non-interactive `div` — clicking it
  does nothing.
- **Eye button** — opens a new shared `FilePreviewDialog` (a `Dialog`) with the resolved
  preview source: `<img>` for `image/*`, `<iframe>` for `application/pdf`, otherwise a "buka di
  tab baru" fallback link (some types genuinely can't render inline).
- **Trash button** — unchanged, calls `onRemove`.
- Size is only known for a live `File` (`file.size`); a hydrated `StoredFile` shows just the
  name, no size line.

`FilePreviewDialog` lives in `resources/js/components/form/` (alongside `form-field.tsx`) so
both the wizard's `FileUploadField` and the new Detail dialog's documents tab share one
implementation.

## Decision: Detail dialog reuses `hydrateEmployeeFormData`

The Detail dialog's data source is exactly what Edit already uses —
`hydrateEmployeeFormData(employee)` (overlay-first, ERD-fallback) — so Detail and Edit can
never drift apart. A few fields Detail needs aren't in `EmployeeFormData` at all (they're
`Employee`-only, or resolved via lookups); those come straight from the `Employee` row and
`employee-org.ts`.

### Component layout

New folder `app/Modules/Employee/resources/js/components/detail/` (the existing empty
`components/steps/detail-dialog.tsx` stub is deleted — it's not a wizard step):

| File | Responsibility |
|---|---|
| `detail-dialog.tsx` | Dialog shell: header (avatar, name, position) + `TabBar` + active tab's content. No footer buttons, just the dialog's own close (X). |
| `tab-bar.tsx` | Pill-style tab bar — `{ tabs: string[], active: number, onChange }`. Active = solid blue pill, white text; inactive = white pill, gray border, black text. Freely clickable, not a linear stepper (does **not** reuse `Stepper`, which is numbered/linear and visually different). |
| `detail-field.tsx` | `DetailField({ label, value })` — read-only `"Label : value"` row, the repeated primitive every tab is built from (matches the screenshots' plain list layout). |
| `personal-tab.tsx` | Nama Lengkap, Jenis Kelamin, Tgl Lahir, Status (Menikah/Lajang from `is_married`), Nomor WA (`phone_number`), Agama, Kab/Kota (regency name from `regency_id`), Full Address. Plus, since the ask is "biodata lengkap": Nomor Induk Karyawan, Email Perusahaan, Email Pribadi, No. KTP (`identity_number`), NPWP (`npwp_number`), Golongan Darah, Kewarganegaraan — these seven are `Employee`-only fields with no wizard-form equivalent. |
| `education-tab.tsx` | Pendidikan Terakhir (level), Nama Institusi, Jurusan, Waktu Mulai, Waktu Lulus, Nilai Akhir, plus a certificate preview row (eye button if a `StoredFile` exists, "Belum ada" otherwise). |
| `experience-tab.tsx` | One card per `work_experiences` entry: Perusahaan, Tipe, Posisi, Periode, Lokasi Kerja, Gaji Terakhir, Deskripsi, reference-letter preview row. Empty state "Belum ada riwayat pengalaman kerja." when the array is the untouched single empty entry. |
| `provision-tab.tsx` | Cabang, Level, Departemen (resolved name), Divisi (resolved name), Kontrak (label from `contractOptions`), Tgl Gabung. |
| `financial-tab.tsx` | Bank (label from `bankOptions`), Nama Pemilik Rekening, No Rekening, Gaji Pokok (formatted as IDR), BPJS Kesehatan, BPJS Ketenagakerjaan. |
| `documents-tab.tsx` | KTP / NPWP / Kontrak / Sertifikat Pendidikan / each work experience's Surat Referensi — each row: `FileTypeIcon` + name + eye button (via `FilePreviewDialog`) when a `StoredFile` exists, else a "Belum ada" badge. Legacy ERD `employeeDocument` rows (fake `document_path` values, no real bytes) are **not** shown here — out of scope, see below. |

### New lookup: `positionTitle`

`employee-org.ts` gains `positionTitle(employeeId): string` — resolves
`employeeAssignment.job_position_id → jobPosition.title`. For employees with no ERD
assignment (wizard-created, or a seed employee only ever edited through the wizard), falls
back to the overlay's `job_level` (capitalized, e.g. `"Senior"`) via `peekFormOverlay`, else
`'-'` — same fallback shape already used by `branchName`/`departmentName`/`divisionName` in
`columns.tsx`.

### Wiring

- `columns.tsx`: `buildEmployeeColumns(onEdit, onDetail)` — the "Detail" item's `onClick`
  becomes `() => onDetail(row)`, replacing the placeholder toast.
- `Index.tsx`: new `detailEmployee: Employee | null` state, `openDetail`/`closeDetail`, and a
  second `<Dialog>` (independent of the create/edit one — a user can't have both open at once
  since each row action opens its own, but nothing requires that; two separate `Dialog`s is the
  simplest correct thing) rendering `<DetailDialog employee={detailEmployee} onClose={closeDetail} />`
  when non-null.

## Edge cases

- Employee never touched by the wizard (fresh seed employee, first time viewing Detail): same
  gaps as Edit's first hydrate — education/experience/job level tabs show their empty states;
  Personal/Ketentuan/Gaji & Bank are filled from the ERD best-effort mapping.
- No `profile_picture_path` → `Avatar` shows initials fallback (existing shadcn pattern, e.g.
  `AvatarFallback` with the first letters of `full_name`).
- A `StoredFile` saved before this change doesn't exist for any employee yet (this is new) — no
  migration needed, hydrate just returns `null` for every file field as it does today until a
  save happens through the updated wizard.
- Selecting a file over 2MB: toast error, the previous selection (if any) is left untouched.
- `localStorage.setItem` throwing `QuotaExceededError` on save (many large files across many
  employees): caught, toast error, the rest of the form data still saves via the existing
  non-file `localStorage` writes — only the file-bearing write is skipped, so a save never
  silently loses the non-file fields.

## Out of scope (this pass)

- Real backend file storage (S3/MinIO/disk) — `StoredFile.dataUrl` is a base64 blob in
  `localStorage`, not a real upload. This is explicitly a stronger mock, not a fix for "files
  aren't really persisted" (that still requires a backend, tracked as future work same as the
  rest of Employee's move off localStorage).
- Wiring preview to the legacy ERD `employeeDocument` fixtures (`Bambang Wijaya`'s "Ijazah S1",
  etc.) — those `document_path` values were never real files and previewing them would 404 or
  need to be faked; the Documents tab only covers what this app can actually persist.
- Any new permission or route — Detail is a client-side-only view over data `employees.viewAny`
  already gates via the list page.

## Verification

`npx tsc --noEmit`, `npm run lint`, `npm run build` must all pass (existing frontend gate) — no
PHP changes in this pass, so no Pest run is needed.
