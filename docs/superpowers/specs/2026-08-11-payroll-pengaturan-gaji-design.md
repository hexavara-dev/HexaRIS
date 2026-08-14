# Pengaturan Gaji (Payroll Settings) — Design

**Date:** 2026-08-11
**Module:** `Payroll` (existing bounded context, extended — not a new module)
**Status:** Approved, ready for planning
**Scope:** Frontend only, same shape as Data Gaji: no DB migrations, no mutating HTTP routes.
Branch: `feat/payroll-pengaturan-gaji`, built on top of `feat/payroll-data-gaji` (PR #33, not yet
merged) since it needs that branch's `Payroll` module scaffold, seed data, and `payroll-row.ts`
helpers.

## Problem

The sidebar already has a `Penggajian → Pengaturan Gaji` entry (`/payroll/settings`, icon already
committed) but no route/page exists behind it. The `payroll.update` permission was declared when
the `Payroll` module was scaffolded but nothing gates on it yet — this feature is what finally
uses it. The user supplied 4 reference screenshots (Umum, Tunjangan, Potongan, Lembur tabs) plus
JSX code for the first two tabs.

## Decision: this wires into Data Gaji, not just a standalone settings page

Explicitly decided with the user (not the initial recommendation, which was "settings only") after
discussion: values configured here should visibly change what Data Gaji displays, so the app reads
as one coherent product even without a real backend. The wiring is **display-time recomputation**,
not a rewrite of the seed data:

- `payrollEntry.ts` (the 57-row generated seed) is untouched — it stays the deterministic base
  input (base salary, and a set of presence flags/amounts used as recompute inputs below).
- `payroll-row.ts` gains recompute functions that read the *current* settings (merged from
  `localStorage`, same overlay pattern as everywhand else in this module) and override what the
  seed generated, at render time. Table and dialog both go through these functions instead of
  reading `entry.earnings`/`entry.deductions` directly.
- **BPJS Kesehatan / Ketenagakerjaan**: `round(base_salary * settings.persentaseKaryawan / 100)`
  — was a hardcoded 1%/2%, now reads the configured percentage.
- **PPh 21**: the seed's generated nominal is kept as "the calculated tax" (computing real TER /
  annual tax brackets is out of scope) but `aktif` and `pajakDitanggung` are honored: if
  `pajakDitanggung === 'perusahaan'`, the employee's PPh21 deduction displays as 0.
  If `aktif === false`, same.
- **Alpha / Terlambat**: the seed only encodes *presence* (an employee's generated `alpha`/`late`
  value is either `0` or a nonzero placeholder — there is no per-minute attendance data to
  recompute from). Recompute rule: `settings.aktif && seed.alpha > 0 ? settings.nominal : 0` (same
  shape for `terlambat`, using `nominalPer30Menit` as a flat per-incident amount). This is a
  deliberate, documented simplification — not a real attendance engine.
- **Lembur**: back-derive an assumed hours count from the seed value and the rate that was baked
  into the generator (`DEFAULT_LEMBUR_RATE`, exported from `payrollOvertimeSettings.ts` so both
  the generator's original constant and the recompute share one source), then
  `displayedOvertime = round(seed.overtime / DEFAULT_LEMBUR_RATE) * settings.nominalPerJam`.
  Changing the configured rate rescales every row's Lembur figure proportionally. Verified this
  divides cleanly: `payrollEntry.ts`'s generator computes `overtime = 100_000 + (0..7) * 50_000`
  — both the fixed offset and the step are multiples of `50_000`, so
  `DEFAULT_LEMBUR_RATE = 50_000` always yields a whole "assumed hours" count (2 to 11) with no
  remainder. This is not a coincidence to preserve carelessly — if `payrollEntry.ts`'s overtime
  formula ever changes, `DEFAULT_LEMBUR_RATE` must be re-derived to still divide it cleanly.
- **Tunjangan**: replaces the 3 fixed PENDAPATAN rows (Tunjangan Jabatan/Makan/Transport) in the
  **detail dialog only** with one row per **active** `PayrollAllowance` entry, applied uniformly
  to every employee (no per-employee assignment concept exists). The **table's** "Tunjangan"
  column is already a single summed value and needs no change — it just sums whatever the dialog
  would show. `Gaji Pokok` and `Lembur` stay their own fixed rows, not part of this list.

## Route & Permission

`GET /payroll/settings` → `PayrollController::settings()` → `Inertia::render('Payroll::pages/Settings')`,
gated `can:payroll.update` (the permission declared in Task 1 of the Data Gaji plan, unused until
now). No new permission needed.

## Data Model (dummy, localStorage-overlaid — same pattern as `payroll-storage.ts`)

New files under `resources/js/data/Payroll/`:

```ts
// payrollGeneralSettings.ts
interface PayrollGeneralSettings { jenis_gaji: 'bulanan' | 'harian'; tanggal_pembayaran: number; mata_uang: 'IDR' }
export const payrollGeneralSettings: PayrollGeneralSettings = { jenis_gaji: 'bulanan', tanggal_pembayaran: 25, mata_uang: 'IDR' };

// payrollAllowance.ts (Tunjangan)
interface PayrollAllowance { id: string; nama: string; nominal: number; periode: 'bulanan' | 'harian' | 'sekali'; aktif: boolean }
export const payrollAllowance: PayrollAllowance[] = [ /* ~12 dummy rows: Tunjangan Makan, Transport, Jabatan, Kesehatan, ... */ ];

// payrollDeductionSettings.ts (Potongan)
interface PayrollDeductionSettings {
  alpha: { aktif: boolean; nominal: number };
  terlambat: { aktif: boolean; toleransi_menit: number; nominal_per_30_menit: number };
  bpjs_kesehatan: { aktif: boolean; persentase_karyawan: number; persentase_perusahaan: number };
  bpjs_ketenagakerjaan: { aktif: boolean; persentase_karyawan: number; persentase_perusahaan: number };
  pph21: { aktif: boolean; metode: 'ter' | 'tahunan'; pajak_ditanggung: 'karyawan' | 'perusahaan' };
}
export const payrollDeductionSettings: PayrollDeductionSettings = { /* matches current generator's 1%/2%/2.5% defaults */ };

// payrollOvertimeSettings.ts (Lembur)
export const DEFAULT_LEMBUR_RATE = 50_000; // the rate payrollEntry.ts's generator was already implicitly using
interface PayrollOvertimeSettings { hitungan: 'jam'; nominal_per_jam: number }
export const payrollOvertimeSettings: PayrollOvertimeSettings = { hitungan: 'jam', nominal_per_jam: DEFAULT_LEMBUR_RATE };
```

### Persistence (`app/Modules/Payroll/resources/js/lib/payroll-settings-storage.ts`)

Four independent `localStorage` keys, one per tab:
- `hexaris.payroll.settings.general` — `Partial<PayrollGeneralSettings>` overlay, merged onto the
  seed default (same `load*`/`save*` shape as `payroll-storage.ts`).
- `hexaris.payroll.settings.deductions` — `Partial<PayrollDeductionSettings>` overlay.
- `hexaris.payroll.settings.overtime` — `Partial<PayrollOvertimeSettings>` overlay.
- `hexaris.payroll.settings.allowances.overrides` — `Record<id, Partial<PayrollAllowance>>`, edits
  to existing seed rows.
- `hexaris.payroll.settings.allowances.created` — `PayrollAllowance[]`, rows added via "+
  Tunjangan" (same local-create pattern as `employee-storage.ts`'s `saveLocalEmployee`).
- `hexaris.payroll.settings.allowances.deleted` — `string[]` of removed ids (same pattern as
  `payroll-storage.ts`'s `markPayrollDeleted`).

## File Structure

```
app/Modules/Payroll/
  Http/Controllers/PayrollController.php        # + settings() method
  routes/web.php                                 # + GET payroll/settings
  resources/js/pages/
    Settings.tsx                                 # tab shell: AppLayout + Tabs (variant matches ref design)
    settings/
      umum-panel.tsx                              # Jenis Gaji radio, Tanggal Pembayaran, Mata Uang, Simpan
      tunjangan-panel.tsx                          # DataTable + search + "+ Tunjangan" + add/edit dialog + delete confirm
      tunjangan-columns.tsx                        # ID/Nama/Nominal/Periode/Status badge/Aksi dropdown (Detail/Edit/Hapus — Hapus active)
      tunjangan-form-dialog.tsx                    # shared add + edit dialog (create when no target, edit when one is passed)
      potongan-panel.tsx                           # Absensi / BPJS / PPh21 sections, toggle-gated sub-fields, Simpan
      lembur-panel.tsx                             # Hitungan Lembur select, Nominal, Simpan
  resources/js/lib/
    payroll-settings-storage.ts                   # load/save for all 4 tabs
resources/js/data/Payroll/
  payrollGeneralSettings.ts
  payrollAllowance.ts
  payrollDeductionSettings.ts
  payrollOvertimeSettings.ts
```

Modified (already-shipped, from the Data Gaji branch):
- `app/Modules/Payroll/resources/js/lib/payroll-row.ts` — add `computeEarnings`/`computeDeductions`
  recompute functions; existing `allowanceTotal`/`deductionTotal`/`totalEarnings`/`thp` change to
  accept the recomputed shape (or gain recompute-aware variants — decided at plan time).
- `app/Modules/Payroll/resources/js/pages/columns.tsx` — Tunjangan/Potongan/Lembur/THP columns route
  through the recompute functions.
- `app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx` — PENDAPATAN section's
  Tunjangan rows become a `.map()` over active allowances instead of 3 fixed `earningsView` entries.

## Per-Tab UI

- **Umum**: reuses `TextField`/`SelectField` (`@/components/form/form-field`) and `RadioGroup`/`RadioGroupItem`
  (`@/components/ui/radio-group`, already in the codebase). Single record, no list.
- **Tunjangan**: reuses `DataTable` (`variant="design-system"`, client mode, with `search`), a
  `DropdownMenu`-based row action column matching the Detail/Edit/Hapus pattern already built for
  Data Gaji's `columns.tsx` — **Hapus is active here** (unlike Data Gaji, this is a genuine
  CRUD list, not generated rows), gated behind the shared `ConfirmDialog`. "+ Tunjangan" opens the
  same add/edit dialog with no target (create mode).
- **Potongan**: reuses `Switch` (`@/components/ui/switch`) for every toggle; each toggle's
  dependent sub-fields (nominal, persentase, toleransi) are disabled/dimmed when its toggle is off,
  matching the reference screenshot's visual hierarchy. Single record, no list, one "Simpan" for
  the whole tab.
- **Lembur**: `SelectField` (unit — only "Jam" for now, no other option needed) + `TextField`
  (nominal), one "Simpan".
- **Tab shell**: `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (`@/components/ui/tabs`, already in
  the codebase from the Company module's document editor) with a **new custom className** on
  `TabsList`/`TabsTrigger` matching the reference's bordered-box-with-left-accent look (none of the
  three existing `variant`s — `line`/`button`/`pill` — match it exactly; pass custom `className`
  alongside the existing primitives rather than adding a 4th CVA variant, since this look is
  specific to this one page).

## Edge cases

- A Tunjangan row created via "+ Tunjangan" and later toggled inactive still counts toward
  `Total Semua Tunjangan` history but is excluded from the PENDAPATAN recompute (only `aktif:
  true` rows are summed) — matches the "Status: Aktif" badge's implied meaning.
- All 4 settings tabs' `localStorage` reads use the same defensive `try/catch → seed default`
  pattern as `payroll-storage.ts`, so a corrupted/missing key never blanks the page.
- If every Tunjangan is inactive/deleted, the dialog's PENDAPATAN section shows just `Gaji Pokok`
  and `Lembur` — no empty-state message needed, an empty allowance list is a valid state.
- Percentage inputs (BPJS) are stored as plain numbers (e.g. `1` for 1%), validated to be
  non-negative on change (strip non-digit input, same `toNumber` helper style as
  `payroll-detail-dialog.tsx`).

## Out of scope (this pass)

- Real PPh21 tax-bracket calculation (TER/annual methods) — the toggle and payer setting are
  honored, the tax nominal itself is not recalculated.
- Per-employee Tunjangan assignment (which employees get which allowance) — applied uniformly.
- Real attendance-driven Alpha/Terlambat/Lembur tracking — presence-flag/rate-rescale
  simplifications only, documented above.
- Any backend persistence, migration, or mutating route — identical constraint to Data Gaji.

## Verification

`npx tsc --noEmit`, `npm run lint`, `npm run build` (frontend gate). `composer check` must stay
green since `PayrollController`/`routes/web.php` change, even though the added method is a thin
Inertia render with no business logic.
