# Reimburse — Design Spec

## Overview

A new "Reimburse" page inside the existing `Payroll` module (`app/Modules/Payroll/`),
reachable from a new "Reimburse" sidebar entry under "Penggajian" (alongside the existing
"Data Gaji" and "Pengaturan Gaji"). Lets an admin browse, add, edit, and delete employee
reimbursement claims, and view/download each claim's proof of payment.

Reference: 7 screenshots (list, empty/filled "Tambah Reimburse" dialog, "Bukti Reimburse"
viewer, row action menu, delete confirmation) plus one partial Figma-exported JSX snippet for
the list page (absolute-positioned per-frame — adapted into real React components, not copied
literally, per the same approach used for Data Gaji/Pengaturan Gaji).

## Architecture

**Resource, not a new module.** `Payroll` already exists as the bounded context (Data Gaji,
Pengaturan Gaji); Reimburse is a third resource inside it, built with the `add-resource` skill.

**100% frontend-mock, matching Data Gaji/Pengaturan Gaji exactly** — this is a deliberate,
repeated departure from `docs/conventions.md`'s canonical real-backend CRUD shape (no
migration, no FormRequest, no mutating HTTP route, no DTO). Every write happens client-side
against a `localStorage` overlay:

- Seed data: `resources/js/data/Payroll/reimburseEntry.ts` — deterministic dummy rows, never
  mutated at runtime.
- Overlay: `app/Modules/Payroll/resources/js/lib/reimburse-storage.ts` — load/save pattern
  copied from `payroll-settings-storage.ts`'s allowance overlay (seed rows + per-id override
  map + locally-created list + deleted-ids list).
- One real route: `GET payroll/reimburse` → `PayrollController::reimburse()` renders
  `Payroll::pages/Reimburse`, gated `can:reimburse.viewAny`. No `store`/`update`/`destroy`
  routes — those stay client-side, same as Tunjangan's add/edit/delete.

**Permissions** (`app/Modules/Payroll/permissions.php`, added to the existing
`payroll.viewAny`/`payroll.update`):

```php
'reimburse.viewAny', 'reimburse.create', 'reimburse.update', 'reimburse.delete',
```

Only `reimburse.viewAny` gates anything (the route middleware) — `create`/`update`/`delete`
are declared for correctness and future backend readiness, matching the precedent already set
by Data Gaji/Pengaturan Gaji and by the Users page (no granular client-side button hiding).

**Nav**: add a `{ title: 'Reimburse', url: '/payroll/reimburse', iconSrc: navReimburse,
inSidebar: true }` entry as the third child of "Penggajian" in `resources/js/lib/navigation.ts`,
using the already-present-but-unused `resources/js/assets/icons/nav-reimburse.png` (currently
untracked; gets committed as part of this feature).

## Data model

```ts
// resources/js/data/Payroll/reimburseEntry.ts
export interface ReimburseEntry {
    id: string;
    employee_id: string;
    branch_id: string; // drives the list's Cabang filter, same field name as PayrollEntry
    tanggal_pengeluaran: string; // ISO date
    tanggal_reimburse: string;   // ISO date
    keperluan: string;
    nominal: number;
    metode_bayar: 'tunai' | 'transfer';
    bukti: StoredFile; // reused from resources/js/components/form/form-field.tsx
}
```

`StoredFile` (`{ name, type, dataUrl }`) already exists and is used the same way in the
Employee module's document uploads — no new file-handling type needed. Seed rows carry a
lightweight placeholder `StoredFile` (empty `dataUrl`) since embedding real base64 images in a
seed file isn't worth the bloat; `FilePreviewDialog` already renders its "file tidak tersedia
untuk pratinjau" fallback for that case.

~15–20 deterministic seed rows spread across the existing `employee`/`branch` data, mirroring
the scale of Tunjangan's ~12 seed rows.

`Karyawan` display ("nama - jabatan", e.g. "Lina Ayu - Finance") is derived the same way
`payroll-row.ts`'s `positionTitleFor` does — via `employeeAssignment` + `jobPosition` — not
stored redundantly on `ReimburseEntry`.

## Pages & components

**List — `app/Modules/Payroll/resources/js/pages/Reimburse.tsx`**
- `AppLayout` (breadcrumb-derived, same as Data Gaji — no `headerTitle`/bell override needed
  here since that's a Dashboard-only pattern, matching Data Gaji's own header).
- Custom toolbar row (Cabang `Select` filter + `DataTable`'s own `search`), same layout as Data
  Gaji's Index.tsx — Cabang filter is a plain client-side `branch_id` match, not a DataTable
  built-in filter, since it needs to sit to the *left* of Search rather than the toolbar's
  default right-aligned filter slot.
- `DataTable` (`variant="design-system"`) — columns ID / Karyawan / Tgl Pengeluaran / Tgl
  Reimburse / Keperluan / Nominal / Met. Bayar / Bukti, plus the row-actions column (Edit /
  Hapus dropdown, continuous divider — reusing the `cellClassName` addition already made for
  Tunjangan's table).
- "Bukti" column renders a "Lihat Bukti" link (styled like Tunjangan's link cells) that opens
  the Bukti Reimburse dialog for that row.
- "+ Reimburse" button opens the Tambah/Edit dialog in create mode.

**Tambah/Edit dialog — `.../pages/reimburse/reimburse-form-dialog.tsx`**
- Karyawan: `SelectField` populated from `employee` (options labelled `"{full_name} - {jabatan}"`).
- Keperluan: `TextField`.
- Tgl Pengeluaran / Tgl Reimburse: `TextField type="date"` (same convention as Employee's
  `birth_date`/`join_date` fields).
- Nominal: `TextField`, Rp-formatted live input (same `formatRupiahInput` pattern used in
  Tunjangan/Potongan/Lembur this session).
- Metode Bayar: `SelectField`, options Tunai/Transfer.
- Upload Bukti: `FileUploadField` (reused as-is — drag-drop, file-type icon, size badge, trash
  button, 2MB cap — matches the "KTP.png · 0.8 Mb" reference exactly).
- Footer: Batal/Simpan, outside-click cancels (same fix already applied to Tunjangan's dialog),
  toast `'Berhasil Disimpan'` on save (same unified copy as the rest of Payroll).

**Bukti Reimburse viewer — `.../pages/reimburse/reimburse-bukti-dialog.tsx`**
- Opened by the list's "Lihat Bukti" link, receives the clicked row.
- Renders the "FORM REIMBURSEMENT" layout from the reference, but bound to that row's real
  data: Tanggal = `tanggal_reimburse`, Nama/Nomor ID/Departemen/Jabatan = the row's employee
  (via the same `employeeAssignment`/`jobPosition` lookup used elsewhere), a single rincian line
  (Deskripsi = `keperluan`, Tanggal = `tanggal_pengeluaran`, Jumlah = `nominal`, Bukti
  Pembayaran = the uploaded file's name), Total Pengeluaran = `nominal`.
- Download button downloads the row's uploaded `bukti` file (an `<a href={dataUrl} download>`
  off the existing `StoredFile`) — it does not generate a new PDF/export; that's out of scope
  for a frontend-mock module with no backend to render one.

**Delete — reuse `ConfirmDialog`** with the exact copy already established for Tunjangan:
title "Hapus Reimburse?", description "Anda akan menghapus data Reimburse ini secara
permanen. Tindakan ini tidak dapat dibatalkan dan seluruh informasi terkait akan hilang.",
`confirmLabel="Hapus"`, `cancelLabel="Batal"`.

## Out of scope

- No approval workflow (Pending/Approved/Rejected) — every reference screenshot shows a flat
  admin-managed CRUD list, confirmed with the user.
- No PDF generation for the "Bukti Reimburse" form — Download serves the originally uploaded
  file.
- No real backend persistence — matches the rest of this Payroll module today; if/when Data
  Gaji's module gets a real backend, Reimburse migrates alongside it, not ahead of it.

## Testing

- `tests/Feature/Payroll/PayrollReimburseTest.php` — 403 without `reimburse.viewAny`, happy path
  render with it (same shape as `PayrollSettingsTest.php`).
- No frontend test framework in this repo beyond `tsc`/`eslint`/`build` — verification is the
  same gate already used for Data Gaji/Pengaturan Gaji (`composer check`, `tsc --noEmit`,
  `npm run lint`, `npm run build`), plus a manual smoke pass since no browser-automation tool is
  available in this environment.
