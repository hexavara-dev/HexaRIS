# Pengaturan Gaji (Payroll Settings) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `Pengaturan Gaji` page at `/payroll/settings` (4 tabs: Umum, Tunjangan,
Potongan, Lembur), and wire its values into Data Gaji's displayed numbers via a display-time
recompute layer, so changing a setting visibly changes what Data Gaji shows without touching the
underlying generated seed data.

**Architecture:** Extends the existing `Payroll` module (no new module, no migrations, no mutating
HTTP routes — same frontend-mock shape as Data Gaji). All 4 tabs' data is dummy + `localStorage`-
overlaid, same pattern as `payroll-storage.ts`. A new `recomputeRow()` function in `payroll-row.ts`
sits between the seed data and every place that displays it (Index.tsx's row list, the detail
dialog), replacing generator-baked earnings/deductions with values derived from current settings.

**Tech Stack:** Laravel 12 (one new Inertia route, no business logic), React + TypeScript,
`@/components/ui/tabs`, `@/components/ui/switch`, `@/components/ui/radio-group` (all already in
the codebase), `DataTable`, `ConfirmDialog`, `@/components/form/form-field`.

## Global Constraints

- No DB migrations, no new mutating HTTP routes. `GET /payroll/settings` is the only new route,
  gated `can:payroll.update` (already declared, unused until this plan).
- No `Math.random()` in any new seed data file — deterministic, hand-authored arrays.
- Every frontend task ends with `npx tsc --noEmit` showing no new errors. No JS/TS unit test
  runner in this repo — frontend "tests" means `tsc` + the final manual browser verification task.
- Every PHP task ends green on the relevant `./vendor/bin/pest` run. Full gate (`composer check`,
  `tsc`, `lint`, `build`) green at the end.
- **Recompute precedence:** once this ships, Data Gaji's detail dialog no longer lets you edit
  Tunjangan line items, Lembur, Alpha, Terlambat, BPJS Kesehatan/Ketenagakerjaan, or PPh21 per
  employee — those become read-only, settings-driven display values (edit them in Pengaturan
  Gaji instead). Only **Gaji Pokok**, **Status**, **Tanggal Bayar**, and **Metode Bayar** remain
  editable per employee. This is a deliberate, necessary consequence of wiring settings in: a
  per-employee edit and a global setting can't both "win" without override-precedence tracking
  that was explicitly not asked for — see the design spec's "Decision: this wires into Data Gaji"
  section.
- **Continuity defaults:** `payrollDeductionSettings.ts`'s BPJS percentages (1% / 2%) and
  `payrollOvertimeSettings.ts`'s `nominal_per_jam` (`50_000`, matching `DEFAULT_LEMBUR_RATE`)
  are chosen so Data Gaji's numbers are **unchanged** immediately after this ships, until someone
  actually edits a setting. Alpha (`300_000`) and Terlambat (`10_000`/30 menit) defaults come from
  the reference screenshots — these **will** visibly change existing Data Gaji Alpha/Terlambat
  figures on first load (an accepted, documented simplification from the spec — the seed never
  tracked a real per-minute lateness figure to preserve).
- Spec: `docs/superpowers/specs/2026-08-11-payroll-pengaturan-gaji-design.md` — read it if any
  task here seems to contradict it; this plan should match it exactly.

---

### Task 1: Route, controller method, and permission-gated Feature test

**Files:**
- Modify: `app/Modules/Payroll/Http/Controllers/PayrollController.php`
- Modify: `app/Modules/Payroll/routes/web.php`
- Create: `tests/Feature/Payroll/PayrollSettingsTest.php`

**Interfaces:**
- Produces: route `payroll.settings.index` → `GET /payroll/settings`, gated
  `can:payroll.update`, renders Inertia component `'Payroll::pages/Settings'` (created in Task 7).

- [ ] **Step 1: Add the controller method**

Open `app/Modules/Payroll/Http/Controllers/PayrollController.php`. Replace its entire contents with:

```php
<?php

namespace App\Modules\Payroll\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController
{
    public function index(Request $request): Response
    {
        return Inertia::render('Payroll::pages/Index');
    }

    public function settings(Request $request): Response
    {
        return Inertia::render('Payroll::pages/Settings');
    }
}
```

- [ ] **Step 2: Wire the route**

Open `app/Modules/Payroll/routes/web.php`. Replace its entire contents with:

```php
<?php

use App\Modules\Payroll\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('payroll/data', [PayrollController::class, 'index'])
        ->name('payroll.data.index')->middleware('can:payroll.viewAny');
    Route::get('payroll/settings', [PayrollController::class, 'settings'])
        ->name('payroll.settings.index')->middleware('can:payroll.update');
});
```

- [ ] **Step 3: Write the Feature test**

Create `tests/Feature/Payroll/PayrollSettingsTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('payroll.update', 'web');
});

it('forbids users without payroll.update', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/payroll/settings')->assertForbidden();
});

it('renders the payroll settings page for users with payroll.update', function () {
    $admin = User::factory()->create()->givePermissionTo('payroll.update');

    $this->actingAs($admin)
        ->get('/payroll/settings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payroll::pages/Settings'));
});
```

- [ ] **Step 4: Run the test**

Run: `./vendor/bin/pest tests/Feature/Payroll`
Expected: all 4 tests pass (2 existing `PayrollIndexTest` + 2 new `PayrollSettingsTest`).
`Payroll::pages/Settings` doesn't exist as a file yet — fine, `ensure_pages_exist` is disabled.

- [ ] **Step 5: Style/static-analysis check**

Run: `./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --memory-limit=512M`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Payroll/Http/Controllers/PayrollController.php app/Modules/Payroll/routes/web.php tests/Feature/Payroll/PayrollSettingsTest.php
git commit -m "feat(payroll): add a permission-gated /payroll/settings route"
```

---

### Task 2: Dummy data — Umum settings and Tunjangan (allowance) list

**Files:**
- Create: `resources/js/data/Payroll/payrollGeneralSettings.ts`
- Create: `resources/js/data/Payroll/payrollAllowance.ts`

**Interfaces:**
- Produces: `PayrollGeneralSettings { jenis_gaji: 'bulanan' | 'harian'; tanggal_pembayaran: number;
  mata_uang: 'IDR' }`, `payrollGeneralSettings: PayrollGeneralSettings`. `PayrollAllowance { id:
  string; nama: string; nominal: number; periode: 'bulanan' | 'harian' | 'sekali'; aktif: boolean
  }`, `payrollAllowance: PayrollAllowance[]`. Consumed by Task 4 (storage), Task 5 (recompute),
  Task 8 (Umum panel), Task 9 (Tunjangan panel).

- [ ] **Step 1: Create `payrollGeneralSettings.ts`**

Create `resources/js/data/Payroll/payrollGeneralSettings.ts`:

```ts
export interface PayrollGeneralSettings {
    jenis_gaji: 'bulanan' | 'harian';
    tanggal_pembayaran: number;
    mata_uang: 'IDR';
}

export const payrollGeneralSettings: PayrollGeneralSettings = {
    jenis_gaji: 'bulanan',
    tanggal_pembayaran: 25,
    mata_uang: 'IDR',
};
```

- [ ] **Step 2: Create `payrollAllowance.ts`**

Create `resources/js/data/Payroll/payrollAllowance.ts`:

```ts
export interface PayrollAllowance {
    id: string;
    nama: string;
    nominal: number;
    periode: 'bulanan' | 'harian' | 'sekali';
    aktif: boolean;
}

// Applied uniformly to every employee in Data Gaji's recompute (Task 5) — there is no
// per-employee allowance-assignment concept in this dummy dataset.
export const payrollAllowance: PayrollAllowance[] = [
    { id: 'allowance-makan', nama: 'Tunjangan Makan', nominal: 400_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-transport', nama: 'Tunjangan Transport', nominal: 300_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-jabatan', nama: 'Tunjangan Jabatan', nominal: 500_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-komunikasi', nama: 'Tunjangan Komunikasi', nominal: 150_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-kesehatan', nama: 'Tunjangan Kesehatan', nominal: 250_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-lembur-harian', nama: 'Tunjangan Lembur Harian', nominal: 50_000, periode: 'harian', aktif: false },
    { id: 'allowance-thr', nama: 'Tunjangan Hari Raya', nominal: 1_000_000, periode: 'sekali', aktif: false },
    { id: 'allowance-rumah', nama: 'Tunjangan Perumahan', nominal: 600_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-anak', nama: 'Tunjangan Anak', nominal: 200_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-jabatan-struktural', nama: 'Tunjangan Jabatan Struktural', nominal: 750_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-shift', nama: 'Tunjangan Shift Malam', nominal: 100_000, periode: 'harian', aktif: false },
    { id: 'allowance-pulsa', nama: 'Tunjangan Pulsa', nominal: 100_000, periode: 'bulanan', aktif: false },
];
```

(4 active by default — Makan/Transport/Jabatan/Komunikasi — the rest inactive so the Tunjangan tab
has a realistic mix of Aktif/Nonaktif rows to demonstrate the list and its filtering.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive, nothing imports these yet).

- [ ] **Step 4: Commit**

```bash
git add resources/js/data/Payroll/payrollGeneralSettings.ts resources/js/data/Payroll/payrollAllowance.ts
git commit -m "feat(payroll): add dummy Umum settings and Tunjangan seed data"
```

---

### Task 3: Dummy data — Potongan and Lembur settings

**Files:**
- Create: `resources/js/data/Payroll/payrollDeductionSettings.ts`
- Create: `resources/js/data/Payroll/payrollOvertimeSettings.ts`

**Interfaces:**
- Produces: `PayrollDeductionSettings` (shape below), `payrollDeductionSettings:
  PayrollDeductionSettings`. `PayrollOvertimeSettings { hitungan: 'jam'; nominal_per_jam: number
  }`, `payrollOvertimeSettings: PayrollOvertimeSettings`, `DEFAULT_LEMBUR_RATE: number`. Consumed
  by Task 4, Task 5, Task 11, Task 12.

- [ ] **Step 1: Create `payrollDeductionSettings.ts`**

Create `resources/js/data/Payroll/payrollDeductionSettings.ts`:

```ts
export interface PayrollDeductionSettings {
    alpha: { aktif: boolean; nominal: number };
    terlambat: { aktif: boolean; toleransi_menit: number; nominal_per_30_menit: number };
    bpjs_kesehatan: { aktif: boolean; persentase_karyawan: number; persentase_perusahaan: number };
    bpjs_ketenagakerjaan: { aktif: boolean; persentase_karyawan: number; persentase_perusahaan: number };
    pph21: { aktif: boolean; metode: 'ter' | 'tahunan'; pajak_ditanggung: 'karyawan' | 'perusahaan' };
}

// bpjs_kesehatan/bpjs_ketenagakerjaan's persentase_karyawan match the 1%/2% already hardcoded in
// resources/js/data/Payroll/payrollEntry.ts's generator, so Data Gaji's BPJS figures don't change
// the moment this ships — only when someone actually edits this settings tab.
export const payrollDeductionSettings: PayrollDeductionSettings = {
    alpha: { aktif: true, nominal: 300_000 },
    terlambat: { aktif: true, toleransi_menit: 15, nominal_per_30_menit: 10_000 },
    bpjs_kesehatan: { aktif: true, persentase_karyawan: 1, persentase_perusahaan: 4 },
    bpjs_ketenagakerjaan: { aktif: true, persentase_karyawan: 1, persentase_perusahaan: 2 },
    pph21: { aktif: true, metode: 'ter', pajak_ditanggung: 'karyawan' },
};
```

- [ ] **Step 2: Create `payrollOvertimeSettings.ts`**

Create `resources/js/data/Payroll/payrollOvertimeSettings.ts`:

```ts
// payrollEntry.ts's generator computes overtime as `100_000 + (0..7) * 50_000` — every possible
// value is a whole multiple of 50_000 (the fixed offset is 2 * 50_000, the step is exactly
// 50_000), so this rate divides every seed overtime value into a whole "assumed hours" count with
// no remainder. If payrollEntry.ts's overtime formula ever changes, re-derive this constant so it
// still divides the new formula cleanly.
export const DEFAULT_LEMBUR_RATE = 50_000;

export interface PayrollOvertimeSettings {
    hitungan: 'jam';
    nominal_per_jam: number;
}

export const payrollOvertimeSettings: PayrollOvertimeSettings = {
    hitungan: 'jam',
    nominal_per_jam: DEFAULT_LEMBUR_RATE,
};
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/data/Payroll/payrollDeductionSettings.ts resources/js/data/Payroll/payrollOvertimeSettings.ts
git commit -m "feat(payroll): add dummy Potongan and Lembur settings data"
```

---

### Task 4: `payroll-settings-storage.ts` — localStorage overlay for all 4 tabs

**Files:**
- Create: `app/Modules/Payroll/resources/js/lib/payroll-settings-storage.ts`

**Interfaces:**
- Consumes: `PayrollGeneralSettings`/`payrollGeneralSettings` (Task 2),
  `PayrollAllowance`/`payrollAllowance` (Task 2), `PayrollDeductionSettings`/
  `payrollDeductionSettings` (Task 3), `PayrollOvertimeSettings`/`payrollOvertimeSettings` (Task 3).
- Produces: `loadGeneralSettings(): PayrollGeneralSettings`, `saveGeneralSettings(patch:
  Partial<PayrollGeneralSettings>): PayrollGeneralSettings`, `loadDeductionSettings():
  PayrollDeductionSettings`, `saveDeductionSettings(patch: Partial<PayrollDeductionSettings>):
  PayrollDeductionSettings`, `loadOvertimeSettings(): PayrollOvertimeSettings`,
  `saveOvertimeSettings(patch: Partial<PayrollOvertimeSettings>): PayrollOvertimeSettings`,
  `loadAllowances(): PayrollAllowance[]`, `saveAllowanceOverride(id: string, patch:
  Partial<PayrollAllowance>): void`, `createAllowance(data: Omit<PayrollAllowance, 'id'>):
  PayrollAllowance`, `deleteAllowance(id: string): void`. All consumed by Task 5 and every panel
  (Tasks 8, 9, 10, 11, 12).

- [ ] **Step 1: Create the file**

Create `app/Modules/Payroll/resources/js/lib/payroll-settings-storage.ts`:

```ts
import { type PayrollAllowance, payrollAllowance } from '@/data/Payroll/payrollAllowance';
import { type PayrollDeductionSettings, payrollDeductionSettings } from '@/data/Payroll/payrollDeductionSettings';
import { type PayrollGeneralSettings, payrollGeneralSettings } from '@/data/Payroll/payrollGeneralSettings';
import { type PayrollOvertimeSettings, payrollOvertimeSettings } from '@/data/Payroll/payrollOvertimeSettings';

const GENERAL_KEY = 'hexaris.payroll.settings.general';
const DEDUCTIONS_KEY = 'hexaris.payroll.settings.deductions';
const OVERTIME_KEY = 'hexaris.payroll.settings.overtime';
const ALLOWANCE_OVERRIDES_KEY = 'hexaris.payroll.settings.allowances.overrides';
const ALLOWANCE_CREATED_KEY = 'hexaris.payroll.settings.allowances.created';
const ALLOWANCE_DELETED_KEY = 'hexaris.payroll.settings.allowances.deleted';

function loadJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function saveJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Quota exceeded or storage disabled — this write is lost; the next successful save
        // starts from the last persisted state, not from this one.
    }
}

export function loadGeneralSettings(): PayrollGeneralSettings {
    return { ...payrollGeneralSettings, ...loadJson<Partial<PayrollGeneralSettings>>(GENERAL_KEY, {}) };
}

export function saveGeneralSettings(patch: Partial<PayrollGeneralSettings>): PayrollGeneralSettings {
    const next = { ...loadGeneralSettings(), ...patch };
    saveJson(GENERAL_KEY, next);
    return next;
}

export function loadDeductionSettings(): PayrollDeductionSettings {
    return { ...payrollDeductionSettings, ...loadJson<Partial<PayrollDeductionSettings>>(DEDUCTIONS_KEY, {}) };
}

export function saveDeductionSettings(patch: Partial<PayrollDeductionSettings>): PayrollDeductionSettings {
    const next = { ...loadDeductionSettings(), ...patch };
    saveJson(DEDUCTIONS_KEY, next);
    return next;
}

export function loadOvertimeSettings(): PayrollOvertimeSettings {
    return { ...payrollOvertimeSettings, ...loadJson<Partial<PayrollOvertimeSettings>>(OVERTIME_KEY, {}) };
}

export function saveOvertimeSettings(patch: Partial<PayrollOvertimeSettings>): PayrollOvertimeSettings {
    const next = { ...loadOvertimeSettings(), ...patch };
    saveJson(OVERTIME_KEY, next);
    return next;
}

function loadAllowanceOverrides(): Record<string, Partial<PayrollAllowance>> {
    return loadJson<Record<string, Partial<PayrollAllowance>>>(ALLOWANCE_OVERRIDES_KEY, {});
}

function loadCreatedAllowances(): PayrollAllowance[] {
    return loadJson<PayrollAllowance[]>(ALLOWANCE_CREATED_KEY, []);
}

function loadDeletedAllowanceIds(): string[] {
    return loadJson<string[]>(ALLOWANCE_DELETED_KEY, []);
}

/** Seed rows (with any saved override applied) plus locally-created rows, minus deleted ids — the single source every Tunjangan panel/recompute reads from. */
export function loadAllowances(): PayrollAllowance[] {
    const overrides = loadAllowanceOverrides();
    const deleted = loadDeletedAllowanceIds();
    const seeded = payrollAllowance.map((a) => ({ ...a, ...overrides[a.id] }));
    return [...seeded, ...loadCreatedAllowances()].filter((a) => !deleted.includes(a.id));
}

/** Edit path for a seed allowance — never mutates payrollAllowance.ts, only this overlay. */
export function saveAllowanceOverride(id: string, patch: Partial<PayrollAllowance>): void {
    const overrides = loadAllowanceOverrides();
    saveJson(ALLOWANCE_OVERRIDES_KEY, { ...overrides, [id]: { ...overrides[id], ...patch } });
}

/** Edit path for a locally-created allowance — replaces it in place in the created list. */
function updateCreatedAllowance(id: string, patch: Partial<PayrollAllowance>): void {
    const created = loadCreatedAllowances();
    saveJson(
        ALLOWANCE_CREATED_KEY,
        created.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
}

/** Dispatches to the override overlay or the created-list, whichever owns this id. */
export function updateAllowance(id: string, patch: Partial<PayrollAllowance>): void {
    if (loadCreatedAllowances().some((a) => a.id === id)) {
        updateCreatedAllowance(id, patch);
    } else {
        saveAllowanceOverride(id, patch);
    }
}

export function createAllowance(data: Omit<PayrollAllowance, 'id'>): PayrollAllowance {
    const created: PayrollAllowance = { ...data, id: `allowance-local-${crypto.randomUUID()}` };
    saveJson(ALLOWANCE_CREATED_KEY, [...loadCreatedAllowances(), created]);
    return created;
}

export function deleteAllowance(id: string): void {
    const deleted = loadDeletedAllowanceIds();
    if (!deleted.includes(id)) {
        saveJson(ALLOWANCE_DELETED_KEY, [...deleted, id]);
    }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/lib/payroll-settings-storage.ts
git commit -m "feat(payroll): add the localStorage overlay for all 4 settings tabs"
```

---

### Task 5: `recomputeRow` in `payroll-row.ts` — wire settings into Data Gaji's displayed numbers

**Files:**
- Modify: `app/Modules/Payroll/resources/js/lib/payroll-row.ts`

**Interfaces:**
- Consumes: `PayrollAllowance` (Task 2), `PayrollDeductionSettings` (Task 3),
  `PayrollOvertimeSettings`/`DEFAULT_LEMBUR_RATE` (Task 3).
- Produces: `AllowanceItem { id: string; nama: string; nominal: number }`. `RecomputedPayrollRow
  extends PayrollRow { allowance_items: AllowanceItem[] }`. `recomputeRow(row: PayrollRow,
  settings: { allowances: PayrollAllowance[]; deductions: PayrollDeductionSettings; overtime:
  PayrollOvertimeSettings }): RecomputedPayrollRow`. `allowanceTotal`'s and `totalEarnings`'s
  parameter types change (see below) — **breaking change**, every caller must now pass a
  `RecomputedPayrollRow`, not a raw `PayrollRow`/`PayrollEntry`. Consumed by Task 6 (Index.tsx,
  columns.tsx, payroll-detail-dialog.tsx).

- [ ] **Step 1: Add the new types and `recomputeRow`, and change `allowanceTotal`/`totalEarnings`**

Open `app/Modules/Payroll/resources/js/lib/payroll-row.ts`. Find:

```ts
import { type Employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { branch } from '@/data/Payroll/branch';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { jobPosition } from '@/data/Position/jobPosition';
```

Replace with:

```ts
import { type Employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { branch } from '@/data/Payroll/branch';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { type PayrollDeductionSettings } from '@/data/Payroll/payrollDeductionSettings';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { type PayrollOvertimeSettings, DEFAULT_LEMBUR_RATE } from '@/data/Payroll/payrollOvertimeSettings';
import { jobPosition } from '@/data/Position/jobPosition';
```

Find:

```ts
export function allowanceTotal(row: Pick<PayrollEntry, 'earnings'>): number {
    return row.earnings.position_allowance + row.earnings.meal_allowance + row.earnings.transport_allowance;
}

export function deductionTotal(row: Pick<PayrollEntry, 'deductions'>): number {
    return row.deductions.alpha + row.deductions.late + row.deductions.bpjs_health + row.deductions.bpjs_employment + row.deductions.pph21;
}

export function totalEarnings(row: Pick<PayrollEntry, 'base_salary' | 'earnings'>): number {
    return row.base_salary + allowanceTotal(row) + row.earnings.overtime;
}

export function thp(row: Pick<PayrollEntry, 'base_salary' | 'earnings' | 'deductions'>): number {
    return totalEarnings(row) - deductionTotal(row);
}
```

Replace with:

```ts
export interface AllowanceItem {
    id: string;
    nama: string;
    nominal: number;
}

export interface RecomputedPayrollRow extends PayrollRow {
    allowance_items: AllowanceItem[];
}

/**
 * Overrides a seed PayrollRow's earnings/deductions with values derived from the current Pengaturan
 * Gaji settings, so a settings change is visible in Data Gaji without regenerating payrollEntry.ts.
 * See docs/superpowers/specs/2026-08-11-payroll-pengaturan-gaji-design.md for the per-field rules.
 */
export function recomputeRow(
    row: PayrollRow,
    settings: { allowances: PayrollAllowance[]; deductions: PayrollDeductionSettings; overtime: PayrollOvertimeSettings },
): RecomputedPayrollRow {
    const allowance_items: AllowanceItem[] = settings.allowances
        .filter((a) => a.aktif)
        .map((a) => ({ id: a.id, nama: a.nama, nominal: a.nominal }));

    const assumedHours = Math.round(row.earnings.overtime / DEFAULT_LEMBUR_RATE);
    const overtime = assumedHours * settings.overtime.nominal_per_jam;

    const { deductions } = settings;
    const bpjs_health = deductions.bpjs_kesehatan.aktif
        ? Math.round((row.base_salary * deductions.bpjs_kesehatan.persentase_karyawan) / 100)
        : 0;
    const bpjs_employment = deductions.bpjs_ketenagakerjaan.aktif
        ? Math.round((row.base_salary * deductions.bpjs_ketenagakerjaan.persentase_karyawan) / 100)
        : 0;
    const alpha = deductions.alpha.aktif && row.deductions.alpha > 0 ? deductions.alpha.nominal : 0;
    const late = deductions.terlambat.aktif && row.deductions.late > 0 ? deductions.terlambat.nominal_per_30_menit : 0;
    const pph21 = deductions.pph21.aktif && deductions.pph21.pajak_ditanggung === 'karyawan' ? row.deductions.pph21 : 0;

    return {
        ...row,
        earnings: { ...row.earnings, overtime },
        deductions: { alpha, late, bpjs_health, bpjs_employment, pph21 },
        allowance_items,
    };
}

export function allowanceTotal(row: Pick<RecomputedPayrollRow, 'allowance_items'>): number {
    return row.allowance_items.reduce((sum, item) => sum + item.nominal, 0);
}

export function deductionTotal(row: Pick<PayrollEntry, 'deductions'>): number {
    return row.deductions.alpha + row.deductions.late + row.deductions.bpjs_health + row.deductions.bpjs_employment + row.deductions.pph21;
}

export function totalEarnings(row: Pick<RecomputedPayrollRow, 'base_salary' | 'allowance_items' | 'earnings'>): number {
    return row.base_salary + allowanceTotal(row) + row.earnings.overtime;
}

export function thp(row: Pick<RecomputedPayrollRow, 'base_salary' | 'allowance_items' | 'earnings' | 'deductions'>): number {
    return totalEarnings(row) - deductionTotal(row);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: **several errors**, all in files this task doesn't touch —
`app/Modules/Payroll/resources/js/pages/Index.tsx`, `app/Modules/Payroll/resources/js/pages/columns.tsx`,
`app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx` — because
`allowanceTotal`/`totalEarnings`/`thp` are now called with plain `PayrollRow` values that lack
`allowance_items`. This is expected; Task 6 fixes it. Confirm the errors are exactly in those
three files and nothing else — if there's any other error, stop and investigate before continuing.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/lib/payroll-row.ts
git commit -m "feat(payroll): add recomputeRow, wiring settings into displayed earnings/deductions"
```

---

### Task 6: Rewire Data Gaji (Index.tsx, columns.tsx, payroll-detail-dialog.tsx) onto `RecomputedPayrollRow`

**Files:**
- Modify: `app/Modules/Payroll/resources/js/pages/Index.tsx`
- Modify: `app/Modules/Payroll/resources/js/pages/columns.tsx`
- Modify: `app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx`

**Interfaces:**
- Consumes: `recomputeRow`, `RecomputedPayrollRow`, `AllowanceItem` (Task 5);
  `loadAllowances`, `loadDeductionSettings`, `loadOvertimeSettings` (Task 4).
- Produces: `Index.tsx`'s row list is now `RecomputedPayrollRow[]`; `buildPayrollColumns` and
  `PayrollDetailDialog` are typed against `RecomputedPayrollRow`, not `PayrollRow`. This resolves
  the `tsc` errors Task 5 left.

- [ ] **Step 1: Recompute in `Index.tsx`'s `allRows`**

Open `app/Modules/Payroll/resources/js/pages/Index.tsx`. Find:

```ts
import { formatCurrency, thp, toPayrollRow, type PayrollRow } from '../lib/payroll-row';
import { loadDeletedPayrollIds, loadPayrollOverrides, markPayrollDeleted, savePayrollOverride } from '../lib/payroll-storage';
```

Replace with:

```ts
import { formatCurrency, recomputeRow, thp, toPayrollRow, type RecomputedPayrollRow } from '../lib/payroll-row';
import { loadAllowances, loadDeductionSettings, loadOvertimeSettings } from '../lib/payroll-settings-storage';
import { loadDeletedPayrollIds, loadPayrollOverrides, markPayrollDeleted, savePayrollOverride } from '../lib/payroll-storage';
```

Find every occurrence of `PayrollRow` in this file (there are several: `editingRow`'s state type,
`onStatusChange`'s parameter, `onDelete`'s parameter) and replace each with `RecomputedPayrollRow`.
Concretely, find:

```ts
    const [editingRow, setEditingRow] = useState<PayrollRow | null>(null);
```

Replace with:

```ts
    const [editingRow, setEditingRow] = useState<RecomputedPayrollRow | null>(null);
```

Find:

```ts
    const [deleteTarget, setDeleteTarget] = useState<PayrollRow | null>(null);
```

Replace with:

```ts
    const [deleteTarget, setDeleteTarget] = useState<RecomputedPayrollRow | null>(null);
```

Find:

```ts
    const allRows = useMemo(
        () =>
            payrollEntry
                .map((entry) => toPayrollRow({ ...entry, ...overrides[entry.id] }, employeeById))
                .filter((row) => !deletedIds.includes(row.id)),
        [overrides, employeeById, deletedIds],
    );
```

Replace with:

```ts
    const settings = useMemo(
        () => ({ allowances: loadAllowances(), deductions: loadDeductionSettings(), overtime: loadOvertimeSettings() }),
        [],
    );

    const allRows = useMemo(
        () =>
            payrollEntry
                .map((entry) => toPayrollRow({ ...entry, ...overrides[entry.id] }, employeeById))
                .filter((row) => !deletedIds.includes(row.id))
                .map((row) => recomputeRow(row, settings)),
        [overrides, employeeById, deletedIds, settings],
    );
```

Find:

```ts
    const openDetail = useCallback((row: PayrollRow) => {
```

Replace with:

```ts
    const openDetail = useCallback((row: RecomputedPayrollRow) => {
```

Find:

```ts
    const openEdit = useCallback((row: PayrollRow) => {
```

Replace with:

```ts
    const openEdit = useCallback((row: RecomputedPayrollRow) => {
```

Find:

```ts
    const onStatusChange = useCallback((row: PayrollRow, status: PayrollRow['status']) => {
```

Replace with:

```ts
    const onStatusChange = useCallback((row: RecomputedPayrollRow, status: RecomputedPayrollRow['status']) => {
```

Find:

```ts
    const onDelete = useCallback((row: PayrollRow) => setDeleteTarget(row), []);
```

Replace with:

```ts
    const onDelete = useCallback((row: RecomputedPayrollRow) => setDeleteTarget(row), []);
```

(`settings` is loaded once per mount with an empty `useMemo` dependency array — same "load once,
merge overlay at read time" approach every other localStorage-backed value in this page already
uses. It does not need to react to a settings change made in a different tab/page during this same
session; a full navigation back to Data Gaji re-reads it.)

- [ ] **Step 2: Update `columns.tsx` to the new row type**

Open `app/Modules/Payroll/resources/js/pages/columns.tsx`. Find:

```ts
import { allowanceTotal, deductionTotal, formatCurrency, STATUS_COLOR, STATUS_LABEL, thp, type PayrollRow } from '../lib/payroll-row';

function StatusCell({ row, onStatusChange }: { row: PayrollRow; onStatusChange: (row: PayrollRow, status: PayrollStatus) => void }) {
```

Replace with:

```ts
import { allowanceTotal, deductionTotal, formatCurrency, STATUS_COLOR, STATUS_LABEL, thp, type RecomputedPayrollRow } from '../lib/payroll-row';

function StatusCell({
    row,
    onStatusChange,
}: {
    row: RecomputedPayrollRow;
    onStatusChange: (row: RecomputedPayrollRow, status: PayrollStatus) => void;
}) {
```

Find:

```ts
export function buildPayrollColumns(
    onDetail: (row: PayrollRow) => void,
    onEdit: (row: PayrollRow) => void,
    onStatusChange: (row: PayrollRow, status: PayrollStatus) => void,
    onDelete: (row: PayrollRow) => void,
): Column<PayrollRow>[] {
```

Replace with:

```ts
export function buildPayrollColumns(
    onDetail: (row: RecomputedPayrollRow) => void,
    onEdit: (row: RecomputedPayrollRow) => void,
    onStatusChange: (row: RecomputedPayrollRow, status: PayrollStatus) => void,
    onDelete: (row: RecomputedPayrollRow) => void,
): Column<RecomputedPayrollRow>[] {
```

- [ ] **Step 3: Update `payroll-detail-dialog.tsx` — type, dynamic Tunjangan rows, read-only edit mode**

Open `app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx`. Find:

```ts
import { deductionTotal, formatCurrency, formatDate, STATUS_COLOR, STATUS_LABEL, thp, totalEarnings, type PayrollRow } from '../lib/payroll-row';
```

Replace with:

```ts
import { deductionTotal, formatCurrency, formatDate, STATUS_COLOR, STATUS_LABEL, thp, totalEarnings, type RecomputedPayrollRow } from '../lib/payroll-row';
```

Find every remaining occurrence of the standalone type `PayrollRow` in this file and replace with
`RecomputedPayrollRow` — there are three: `toEditableFields`'s parameter, `toTotalsInput`'s (no
change needed, it doesn't reference `PayrollRow`), and the props interface plus the component
signature. Concretely, find:

```ts
function toEditableFields(row: PayrollRow): EditableFields {
```

Replace with:

```ts
function toEditableFields(row: RecomputedPayrollRow): EditableFields {
```

Find:

```ts
interface PayrollDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: PayrollRow | null;
    onSaved: (entryId: string, patch: Partial<PayrollEntry>) => void;
    initialMode: 'view' | 'edit';
}

export function PayrollDetailDialog({ open, onOpenChange, row, onSaved, initialMode }: PayrollDetailDialogProps) {
```

Replace with:

```ts
interface PayrollDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: RecomputedPayrollRow | null;
    onSaved: (entryId: string, patch: Partial<PayrollEntry>) => void;
    initialMode: 'view' | 'edit';
}

export function PayrollDetailDialog({ open, onOpenChange, row, onSaved, initialMode }: PayrollDetailDialogProps) {
```

Now make the Tunjangan rows dynamic and the edit-mode PENDAPATAN/POTONGAN sections read-only for
everything except Gaji Pokok (per the Global Constraints' "Recompute precedence" rule). Find:

```ts
    const earningsView = [
        { label: 'Gaji Pokok', amount: row.base_salary },
        { label: 'Tunjangan Jabatan', amount: row.earnings.position_allowance },
        { label: 'Tunjangan Makan', amount: row.earnings.meal_allowance },
        { label: 'Tunjangan Transport', amount: row.earnings.transport_allowance },
        { label: 'Lembur', amount: row.earnings.overtime },
    ];
```

Replace with:

```ts
    const earningsView = [
        { label: 'Gaji Pokok', amount: row.base_salary },
        ...row.allowance_items.map((item) => ({ label: item.nama, amount: item.nominal })),
        { label: 'Lembur', amount: row.earnings.overtime },
    ];
```

Find the entire edit-mode PENDAPATAN/POTONGAN block:

```tsx
                                {mode === 'view' ? (
                                    <div className="flex w-full flex-col items-start gap-[18px]">
                                        <SalarySectionView title="PENDAPATAN" items={earningsView} total={totalEarningsView} totalLabel="Total Pendapatan" />
                                        <SalarySectionView title="POTONGAN" items={deductionsView} total={totalDeductionsView} totalLabel="Total Potongan" />
                                    </div>
                                ) : (
                                    <div className="flex w-full flex-col items-start gap-[18px]">
                                        <SalarySectionEdit
                                            title="PENDAPATAN"
                                            rows={[
                                                { label: 'Gaji Pokok', key: 'base_salary' },
                                                { label: 'Tunjangan Jabatan', key: 'position_allowance' },
                                                { label: 'Tunjangan Makan', key: 'meal_allowance' },
                                                { label: 'Tunjangan Transport', key: 'transport_allowance' },
                                                { label: 'Lembur', key: 'overtime' },
                                            ]}
                                            fields={fields}
                                            setField={setField}
                                        />
                                        <SalarySectionEdit
                                            title="POTONGAN"
                                            rows={[
                                                { label: 'Alpha', key: 'alpha' },
                                                { label: 'Terlambat', key: 'late' },
                                                { label: 'BPJS Kesehatan', key: 'bpjs_health' },
                                                { label: 'BPJS Ketenagakerjaan', key: 'bpjs_employment' },
                                                { label: 'PPh 21', key: 'pph21' },
                                            ]}
                                            fields={fields}
                                            setField={setField}
                                        />
                                    </div>
                                )}
```

Replace with:

```tsx
                                {mode === 'view' ? (
                                    <div className="flex w-full flex-col items-start gap-[18px]">
                                        <SalarySectionView title="PENDAPATAN" items={earningsView} total={totalEarningsView} totalLabel="Total Pendapatan" />
                                        <SalarySectionView title="POTONGAN" items={deductionsView} total={totalDeductionsView} totalLabel="Total Potongan" />
                                    </div>
                                ) : (
                                    <div className="flex w-full flex-col items-start gap-[18px]">
                                        {/* Only Gaji Pokok stays editable per employee here — every other PENDAPATAN/POTONGAN
                                            line is now settings-driven (see Pengaturan Gaji) and would silently revert on
                                            next render if edited here, so it's read-only instead of misleadingly editable. */}
                                        <SalarySectionEdit title="PENDAPATAN" rows={[{ label: 'Gaji Pokok', key: 'base_salary' }]} fields={fields} setField={setField} />
                                        <SalarySectionView title="" items={earningsView.slice(1)} total={totalEarningsView} totalLabel="Total Pendapatan" />
                                        <SalarySectionView title="POTONGAN" items={deductionsView} total={totalDeductionsView} totalLabel="Total Potongan" />
                                    </div>
                                )}
```

(The second `SalarySectionView` reuses the same read-only row component for the now-uneditable
Tunjangan/Lembur rows, with an empty `title` — `SalarySectionView` renders the title `<p>` even
when empty, but an empty string collapses to no visible text with no extra spacing since it's still
a normal flex child; this is acceptable, not worth a new prop for.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors — this resolves every error Task 5 left.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/Index.tsx app/Modules/Payroll/resources/js/pages/columns.tsx app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx
git commit -m "feat(payroll): rewire Data Gaji onto RecomputedPayrollRow"
```

---

### Task 7: `Settings.tsx` tab shell

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/Settings.tsx`

**Interfaces:**
- Consumes: `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (`@/components/ui/tabs`), `AppLayout`
  (`@/layouts/app-layout`). Panels created in Tasks 8, 9, 11, 12 (`UmumPanel`, `TunjanganPanel`,
  `PotonganPanel`, `LemburPanel`) — this task creates the shell with **placeholder `<div>Coming in
  a later task</div>` panels** so the route is fully wired and visually testable before every panel
  exists; each panel task swaps its own placeholder for the real component.
- Produces: default export `Settings()` — the page component `PayrollController::settings`
  renders as `'Payroll::pages/Settings'`.

- [ ] **Step 1: Create the file**

Create `app/Modules/Payroll/resources/js/pages/Settings.tsx`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

const TAB_LIST_CLASS = 'flex items-start rounded-lg border border-[#E7E7E7] w-full h-[45px]';

function tabTriggerClass(active: boolean) {
    return active
        ? 'flex h-full w-full items-center justify-center rounded-lg border-l-4 border-l-[#1980C0] bg-[#E9F2F9] py-3 px-4 font-poppins text-sm font-semibold text-[#1980C0]'
        : 'flex h-full w-full items-center justify-center rounded-lg py-3 px-4 font-poppins text-sm font-semibold text-[#5C5C5C]';
}

export default function Settings() {
    return (
        <AppLayout>
            <div className="flex flex-col items-start gap-[19px] p-6">
                <Tabs defaultValue="umum" className="w-full">
                    <TabsList className={TAB_LIST_CLASS}>
                        <TabsTrigger value="umum" variant="button" className={tabTriggerClass(true)}>
                            Umum
                        </TabsTrigger>
                        <TabsTrigger value="tunjangan" variant="button" className={tabTriggerClass(false)}>
                            Tunjangan
                        </TabsTrigger>
                        <TabsTrigger value="potongan" variant="button" className={tabTriggerClass(false)}>
                            Potongan
                        </TabsTrigger>
                        <TabsTrigger value="lembur" variant="button" className={tabTriggerClass(false)}>
                            Lembur
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="umum" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="tunjangan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="potongan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="lembur" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
```

Note: `tabTriggerClass(true)` is hardcoded onto the "Umum" trigger only, matching the reference
screenshot's default-active tab — Radix's `Tabs` handles the actual active/inactive switching via
its own internal state and `data-[state=active]` styling isn't used here since this page's
bordered-box-with-left-accent look doesn't match any of `tabs.tsx`'s 3 built-in CVA variants (see
the design spec). This is a known cosmetic gap (the static `tabTriggerClass(true)`/`(false)` won't
visually update which tab looks "active" when you click a different one) that Task 8 fixes once
state-driven active tracking is wired in — flagging it explicitly rather than leaving it silently
wrong: **this task's placeholder styling is intentionally incomplete,** the real interactive
active-tab styling arrives in Task 8's rewrite of this same file.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/Settings.tsx
git commit -m "feat(payroll): add the Pengaturan Gaji tab shell with placeholder panels"
```

---

### Task 8: Umum panel — wire real active-tab tracking + the Umum form

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/settings/umum-panel.tsx`
- Modify: `app/Modules/Payroll/resources/js/pages/Settings.tsx`

**Interfaces:**
- Consumes: `loadGeneralSettings`, `saveGeneralSettings` (Task 4); `TextField`, `SelectField`
  (`@/components/form/form-field`); `RadioGroup`, `RadioGroupItem` (`@/components/ui/radio-group`).
- Produces: `UmumPanel()` — no props, self-contained (loads/saves its own state). Fixes Task 7's
  known active-tab-styling gap by switching `Settings.tsx` to Radix-state-driven `data-[state=active]`
  styling instead of the hardcoded `tabTriggerClass(true/false)`.

- [ ] **Step 1: Create `umum-panel.tsx`**

Create `app/Modules/Payroll/resources/js/pages/settings/umum-panel.tsx`:

```tsx
import { SelectField, TextField } from '@/components/form/form-field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type PayrollGeneralSettings } from '@/data/Payroll/payrollGeneralSettings';
import { useState } from 'react';
import { toast } from 'sonner';
import { loadGeneralSettings, saveGeneralSettings } from '../../lib/payroll-settings-storage';

export function UmumPanel() {
    const [settings, setSettings] = useState<PayrollGeneralSettings>(loadGeneralSettings);
    const [tanggalInput, setTanggalInput] = useState(String(settings.tanggal_pembayaran));

    const save = () => {
        const tanggal = Number(tanggalInput.replace(/\D/g, '')) || settings.tanggal_pembayaran;
        const next = saveGeneralSettings({ ...settings, tanggal_pembayaran: tanggal });
        setSettings(next);
        setTanggalInput(String(next.tanggal_pembayaran));
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <div className="flex w-full flex-col items-start gap-3">
                <p className="font-poppins text-sm font-semibold text-black">Jenis Gaji</p>
                <RadioGroup
                    value={settings.jenis_gaji}
                    onValueChange={(value) => setSettings((current) => ({ ...current, jenis_gaji: value as PayrollGeneralSettings['jenis_gaji'] }))}
                    className="flex flex-col items-start gap-3"
                >
                    <label className="flex items-center gap-2.5">
                        <RadioGroupItem value="bulanan" />
                        <span className="font-poppins text-sm font-medium text-[#121212]">Bulanan</span>
                    </label>
                    <label className="flex items-center gap-2.5">
                        <RadioGroupItem value="harian" />
                        <span className="font-poppins text-sm font-medium text-[#121212]">Harian</span>
                    </label>
                </RadioGroup>
            </div>

            <TextField
                label="Tanggal Pembayaran"
                htmlFor="tanggal_pembayaran"
                value={tanggalInput}
                onChange={(value) => setTanggalInput(value.replace(/\D/g, ''))}
            />

            <SelectField
                label="Mata Uang"
                htmlFor="mata_uang"
                value={settings.mata_uang}
                onValueChange={() => {}}
                options={[{ value: 'IDR', label: 'Rupiah (IDR)' }]}
            />

            <div className="flex w-full justify-end pt-4">
                <button
                    type="button"
                    onClick={save}
                    className="font-poppins cursor-pointer rounded-lg bg-[#1980C0] px-8 py-3 text-sm font-semibold text-white"
                >
                    Simpan
                </button>
            </div>
        </div>
    );
}
```

(`Mata Uang` has a fixed single option — no currencies table exists yet in this codebase, matching
`employeeCompensation.ts`'s own "only Rupiah for now" comment — so its `onValueChange` is a no-op;
`SelectField` still needs one to satisfy its required prop.)

- [ ] **Step 2: Wire it into `Settings.tsx`, switching to state-driven active-tab styling**

Open `app/Modules/Payroll/resources/js/pages/Settings.tsx`. Replace its entire contents with:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { UmumPanel } from './settings/umum-panel';

const TAB_LIST_CLASS = 'flex items-start rounded-lg border border-[#E7E7E7] w-full h-[45px]';
const TAB_TRIGGER_CLASS =
    'flex h-full w-full items-center justify-center rounded-lg py-3 px-4 font-poppins text-sm font-semibold text-[#5C5C5C] data-[state=active]:border-l-4 data-[state=active]:border-l-[#1980C0] data-[state=active]:bg-[#E9F2F9] data-[state=active]:text-[#1980C0]';

export default function Settings() {
    const [tab, setTab] = useState('umum');

    return (
        <AppLayout>
            <div className="flex flex-col items-start gap-[19px] p-6">
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className={TAB_LIST_CLASS}>
                        <TabsTrigger value="umum" variant="button" className={TAB_TRIGGER_CLASS}>
                            Umum
                        </TabsTrigger>
                        <TabsTrigger value="tunjangan" variant="button" className={TAB_TRIGGER_CLASS}>
                            Tunjangan
                        </TabsTrigger>
                        <TabsTrigger value="potongan" variant="button" className={TAB_TRIGGER_CLASS}>
                            Potongan
                        </TabsTrigger>
                        <TabsTrigger value="lembur" variant="button" className={TAB_TRIGGER_CLASS}>
                            Lembur
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="umum" className="w-full pt-[19px]">
                        <UmumPanel />
                    </TabsContent>
                    <TabsContent value="tunjangan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="potongan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="lembur" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/settings/umum-panel.tsx app/Modules/Payroll/resources/js/pages/Settings.tsx
git commit -m "feat(payroll): add the Umum settings panel and state-driven tab styling"
```

---

### Task 9: Tunjangan columns + panel (list, search, add dialog wiring point)

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/settings/tunjangan-columns.tsx`
- Create: `app/Modules/Payroll/resources/js/pages/settings/tunjangan-panel.tsx`
- Modify: `app/Modules/Payroll/resources/js/pages/Settings.tsx`

**Interfaces:**
- Consumes: `loadAllowances`, `deleteAllowance` (Task 4); `DataTable` (`@/components/data-table`);
  `ConfirmDialog` (`@/components/confirm-dialog`); `DropdownMenu` family
  (`@/components/ui/dropdown-menu`).
- Produces: `buildTunjanganColumns(onEdit: (row: PayrollAllowance) => void, onDelete: (row:
  PayrollAllowance) => void): Column<PayrollAllowance>[]`. `TunjanganPanel()` — self-contained,
  renders the list + search + "+ Tunjangan" button (wired to open the add dialog in Task 10) +
  delete confirm. The add/edit dialog itself is `TunjanganFormDialog`, built in Task 10 — this
  task's `TunjanganPanel` renders a `formOpen`/`formTarget` state and a **placeholder** `{formOpen
  && <div>Form dialog arrives in Task 10</div>}` so the list/search/delete parts are independently
  testable first.

- [ ] **Step 1: Create `tunjangan-columns.tsx`**

Create `app/Modules/Payroll/resources/js/pages/settings/tunjangan-columns.tsx`:

```tsx
import { type Column } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../lib/payroll-row';

const PERIODE_LABEL: Record<PayrollAllowance['periode'], string> = { bulanan: 'Bulanan', harian: 'Harian', sekali: 'Sekali' };

export function buildTunjanganColumns(
    onEdit: (row: PayrollAllowance) => void,
    onDelete: (row: PayrollAllowance) => void,
): Column<PayrollAllowance>[] {
    return [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'nama', label: 'Nama Tunjangan', sortable: true },
        { key: 'nominal', label: 'Nominal', sortable: true, render: (row) => formatCurrency(row.nominal) },
        { key: 'periode', label: 'Periode', render: (row) => PERIODE_LABEL[row.periode] },
        {
            key: 'aktif',
            label: 'Status',
            render: (row) => (
                <span
                    className={
                        row.aktif
                            ? 'inline-flex items-center rounded-[32px] border border-[#46B52B] bg-[#F7FBFE] px-2 py-0.5 font-poppins text-xs text-[#46B52B]'
                            : 'inline-flex items-center rounded-[32px] border border-[#ACACAC] bg-[#F7FBFE] px-2 py-0.5 font-poppins text-xs text-[#ACACAC]'
                    }
                >
                    {row.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            align: 'right',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <MoreVertical className="cursor-pointer size-3.5 text-[#1B1B1B]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[#E84A39] focus:text-[#E84A39] text-red-500" onClick={() => onDelete(row)}>
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}
```

(No "Detail" item — unlike Data Gaji, a Tunjangan row has no separate read-only detail view worth
showing; Edit already shows every field. Per the earlier design discussion, Hapus is **active**
here, not hidden — this is a genuine CRUD list.)

- [ ] **Step 2: Create `tunjangan-panel.tsx`**

Create `app/Modules/Payroll/resources/js/pages/settings/tunjangan-panel.tsx`:

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type SearchConfig } from '@/components/data-table';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { deleteAllowance, loadAllowances } from '../../lib/payroll-settings-storage';
import { buildTunjanganColumns } from './tunjangan-columns';

const search: SearchConfig = { keys: ['nama'], placeholder: 'Search' };

export function TunjanganPanel() {
    const [allowances, setAllowances] = useState<PayrollAllowance[]>(loadAllowances);
    const [formOpen, setFormOpen] = useState(false);
    const [formTarget, setFormTarget] = useState<PayrollAllowance | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PayrollAllowance | null>(null);

    const refresh = useCallback(() => setAllowances(loadAllowances()), []);

    const openCreate = () => {
        setFormTarget(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((row: PayrollAllowance) => {
        setFormTarget(row);
        setFormOpen(true);
    }, []);

    const onDelete = useCallback((row: PayrollAllowance) => setDeleteTarget(row), []);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        deleteAllowance(deleteTarget.id);
        refresh();
        toast.success(`${deleteTarget.nama} berhasil dihapus.`);
        setDeleteTarget(null);
    };

    const columns = buildTunjanganColumns(openEdit, onDelete);

    return (
        <div className="flex w-full flex-col items-start gap-4">
            <DataTable
                columns={columns}
                data={allowances}
                search={search}
                variant="design-system"
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="font-poppins flex cursor-pointer items-center gap-2 rounded-lg bg-[#1980C0] px-4 py-2 text-xs text-white"
                    >
                        <Plus className="size-4" />
                        Tunjangan
                    </button>
                }
            />

            {formOpen && <div>Form dialog arrives in Task 10</div>}

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus Tunjangan?"
                description={deleteTarget ? `Tunjangan "${deleteTarget.nama}" akan dihapus. Tindakan ini tidak bisa dibatalkan.` : undefined}
                confirmLabel="Hapus"
            />
        </div>
    );
}
```

Unlike Data Gaji's page (which builds its own custom search/filter row because its Search box and
Cabang/Periode dropdowns sit *above* 3 KPI cards, ahead of where `DataTable`'s own toolbar would
render), this tab has no KPI cards — its search box and "+ Tunjangan" button sit directly above the
table with nothing in between, exactly where `DataTable`'s built-in toolbar already renders both
`search` and `actions` together in one row (see `data-table.tsx`'s `DataTableView`: the toolbar row
renders `search` on the left and `actions` inside a `ml-auto` wrapper on the right — the same
pattern `app/Modules/Employee/resources/js/pages/Index.tsx` already uses for its "Tambah Karyawan"
button). So this panel uses `DataTable`'s `search`/`actions` props directly instead of a hand-rolled
row, matching the reference screenshot's single search+button row with no extra markup needed.

- [ ] **Step 3: Wire it into `Settings.tsx`**

Open `app/Modules/Payroll/resources/js/pages/Settings.tsx`. Find:

```tsx
import { UmumPanel } from './settings/umum-panel';
```

Replace with:

```tsx
import { TunjanganPanel } from './settings/tunjangan-panel';
import { UmumPanel } from './settings/umum-panel';
```

Find:

```tsx
                    <TabsContent value="tunjangan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
```

Replace with:

```tsx
                    <TabsContent value="tunjangan" className="w-full pt-[19px]">
                        <TunjanganPanel />
                    </TabsContent>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/settings/tunjangan-columns.tsx app/Modules/Payroll/resources/js/pages/settings/tunjangan-panel.tsx app/Modules/Payroll/resources/js/pages/Settings.tsx
git commit -m "feat(payroll): add the Tunjangan list panel (search, delete, columns)"
```

---

### Task 10: Tunjangan add/edit form dialog

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/settings/tunjangan-form-dialog.tsx`
- Modify: `app/Modules/Payroll/resources/js/pages/settings/tunjangan-panel.tsx`

**Interfaces:**
- Consumes: `createAllowance`, `updateAllowance` (Task 4).
- Produces: `TunjanganFormDialog({ open, onOpenChange, target, onSaved }: { open: boolean;
  onOpenChange: (open: boolean) => void; target: PayrollAllowance | null; onSaved: () => void })`
  — `target === null` means create mode, otherwise edit mode.

- [ ] **Step 1: Create `tunjangan-form-dialog.tsx`**

Create `app/Modules/Payroll/resources/js/pages/settings/tunjangan-form-dialog.tsx`:

```tsx
import { SelectField, TextField } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createAllowance, updateAllowance } from '../../lib/payroll-settings-storage';

const PERIODE_OPTIONS = [
    { value: 'bulanan', label: 'Bulanan' },
    { value: 'harian', label: 'Harian' },
    { value: 'sekali', label: 'Sekali' },
];

interface FormState {
    nama: string;
    nominal: string;
    periode: PayrollAllowance['periode'];
    aktif: boolean;
}

const EMPTY_FORM: FormState = { nama: '', nominal: '', periode: 'bulanan', aktif: true };

function toFormState(target: PayrollAllowance | null): FormState {
    if (!target) return EMPTY_FORM;
    return { nama: target.nama, nominal: String(target.nominal), periode: target.periode, aktif: target.aktif };
}

interface TunjanganFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: PayrollAllowance | null;
    onSaved: () => void;
}

export function TunjanganFormDialog({ open, onOpenChange, target, onSaved }: TunjanganFormDialogProps) {
    const [form, setForm] = useState<FormState>(() => toFormState(target));

    useEffect(() => {
        if (open) setForm(toFormState(target));
    }, [open, target]);

    const save = () => {
        const nominal = Number(form.nominal.replace(/\D/g, '')) || 0;
        if (target) {
            updateAllowance(target.id, { nama: form.nama, nominal, periode: form.periode, aktif: form.aktif });
            toast.success(`${form.nama} berhasil diperbarui.`);
        } else {
            createAllowance({ nama: form.nama, nominal, periode: form.periode, aktif: form.aktif });
            toast.success(`${form.nama} berhasil ditambahkan.`);
        }
        onSaved();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">
                        {target ? 'Edit Tunjangan' : 'Tambah Tunjangan'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <TextField label="Nama Tunjangan" htmlFor="nama" required value={form.nama} onChange={(v) => setForm((f) => ({ ...f, nama: v }))} />
                    <TextField
                        label="Nominal"
                        htmlFor="nominal"
                        required
                        value={form.nominal}
                        onChange={(v) => setForm((f) => ({ ...f, nominal: v.replace(/\D/g, '') }))}
                        placeholder="Rp 0"
                    />
                    <SelectField
                        label="Periode"
                        htmlFor="periode"
                        required
                        value={form.periode}
                        onValueChange={(v) => setForm((f) => ({ ...f, periode: v as PayrollAllowance['periode'] }))}
                        options={PERIODE_OPTIONS}
                    />
                    <SelectField
                        label="Status"
                        htmlFor="aktif"
                        required
                        value={form.aktif ? 'aktif' : 'nonaktif'}
                        onValueChange={(v) => setForm((f) => ({ ...f, aktif: v === 'aktif' }))}
                        options={[
                            { value: 'aktif', label: 'Aktif' },
                            { value: 'nonaktif', label: 'Nonaktif' },
                        ]}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={save} disabled={!form.nama.trim()}>
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Wire it into `tunjangan-panel.tsx`**

Open `app/Modules/Payroll/resources/js/pages/settings/tunjangan-panel.tsx`. Find:

```ts
import { deleteAllowance, loadAllowances } from '../../lib/payroll-settings-storage';
import { buildTunjanganColumns } from './tunjangan-columns';
```

Replace with:

```ts
import { deleteAllowance, loadAllowances } from '../../lib/payroll-settings-storage';
import { buildTunjanganColumns } from './tunjangan-columns';
import { TunjanganFormDialog } from './tunjangan-form-dialog';
```

Find:

```tsx
            {formOpen && <div>Form dialog arrives in Task 10</div>}
```

Replace with:

```tsx
            <TunjanganFormDialog open={formOpen} onOpenChange={setFormOpen} target={formTarget} onSaved={refresh} />
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/settings/tunjangan-form-dialog.tsx app/Modules/Payroll/resources/js/pages/settings/tunjangan-panel.tsx
git commit -m "feat(payroll): add the Tunjangan add/edit form dialog"
```

---

### Task 11: Potongan panel

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/settings/potongan-panel.tsx`
- Modify: `app/Modules/Payroll/resources/js/pages/Settings.tsx`

**Interfaces:**
- Consumes: `loadDeductionSettings`, `saveDeductionSettings` (Task 4); `Switch`
  (`@/components/ui/switch`); `SelectField` (`@/components/form/form-field`).
- Produces: `PotonganPanel()` — self-contained.

- [ ] **Step 1: Create `potongan-panel.tsx`**

Create `app/Modules/Payroll/resources/js/pages/settings/potongan-panel.tsx`:

```tsx
import { SelectField } from '@/components/form/form-field';
import { Switch } from '@/components/ui/switch';
import { type PayrollDeductionSettings } from '@/data/Payroll/payrollDeductionSettings';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { loadDeductionSettings, saveDeductionSettings } from '../../lib/payroll-settings-storage';

function toNumber(value: string): number {
    return Number(value.replace(/\D/g, '')) || 0;
}

function SettingRow({ label, control, aktif }: { label: string; control: ReactNode; aktif?: boolean }) {
    return (
        <div className={aktif === false ? 'flex w-full items-center justify-between opacity-50' : 'flex w-full items-center justify-between'}>
            <p className="font-poppins text-sm text-[#4F4F4F]">{label}</p>
            {control}
        </div>
    );
}

function NumberInput({ value, onChange, suffix, disabled }: { value: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(toNumber(e.target.value))}
                className="font-poppins w-[180px] rounded-lg border border-[#E7E7E7] px-4 py-2 text-sm disabled:bg-[#F5F5F5] disabled:text-[#ACACAC]"
            />
            {suffix && <span className="font-poppins text-sm text-[#4F4F4F]">{suffix}</span>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex w-full flex-col items-start gap-5 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <p className="font-poppins text-base font-semibold text-black">{title}</p>
            <div className="flex w-full flex-col items-start gap-5">{children}</div>
        </div>
    );
}

export function PotonganPanel() {
    const [settings, setSettings] = useState<PayrollDeductionSettings>(loadDeductionSettings);

    const set = <K extends keyof PayrollDeductionSettings>(key: K, patch: Partial<PayrollDeductionSettings[K]>) =>
        setSettings((current) => ({ ...current, [key]: { ...current[key], ...patch } }));

    const save = () => {
        const next = saveDeductionSettings(settings);
        setSettings(next);
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-4">
            <Section title="Absensi">
                <SettingRow
                    label="Potong Jika Alpha"
                    control={<Switch checked={settings.alpha.aktif} onCheckedChange={(v) => set('alpha', { aktif: v })} />}
                />
                <SettingRow
                    label="Nominal"
                    aktif={settings.alpha.aktif}
                    control={
                        <NumberInput
                            value={settings.alpha.nominal}
                            disabled={!settings.alpha.aktif}
                            onChange={(v) => set('alpha', { nominal: v })}
                        />
                    }
                />
                <SettingRow
                    label="Potong Jika Terlambat"
                    control={<Switch checked={settings.terlambat.aktif} onCheckedChange={(v) => set('terlambat', { aktif: v })} />}
                />
                <SettingRow
                    label="Toleransi Keterlambatan"
                    aktif={settings.terlambat.aktif}
                    control={
                        <NumberInput
                            value={settings.terlambat.toleransi_menit}
                            suffix="Menit"
                            disabled={!settings.terlambat.aktif}
                            onChange={(v) => set('terlambat', { toleransi_menit: v })}
                        />
                    }
                />
                <SettingRow
                    label="Nominal Potongan"
                    aktif={settings.terlambat.aktif}
                    control={
                        <NumberInput
                            value={settings.terlambat.nominal_per_30_menit}
                            suffix="/ 30 Menit"
                            disabled={!settings.terlambat.aktif}
                            onChange={(v) => set('terlambat', { nominal_per_30_menit: v })}
                        />
                    }
                />
            </Section>

            <Section title="BPJS">
                <p className="font-poppins text-sm font-semibold text-black">BPJS Kesehatan</p>
                <SettingRow
                    label="Aktifkan BPJS Kesehatan"
                    control={<Switch checked={settings.bpjs_kesehatan.aktif} onCheckedChange={(v) => set('bpjs_kesehatan', { aktif: v })} />}
                />
                <SettingRow
                    label="Persentase Karyawan"
                    aktif={settings.bpjs_kesehatan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_kesehatan.persentase_karyawan}
                            suffix="%"
                            disabled={!settings.bpjs_kesehatan.aktif}
                            onChange={(v) => set('bpjs_kesehatan', { persentase_karyawan: v })}
                        />
                    }
                />
                <SettingRow
                    label="Persentase Perusahaan"
                    aktif={settings.bpjs_kesehatan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_kesehatan.persentase_perusahaan}
                            suffix="%"
                            disabled={!settings.bpjs_kesehatan.aktif}
                            onChange={(v) => set('bpjs_kesehatan', { persentase_perusahaan: v })}
                        />
                    }
                />

                <p className="font-poppins text-sm font-semibold text-black">BPJS Ketenagakerjaan</p>
                <SettingRow
                    label="Aktifkan BPJS Ketenagakerjaan"
                    control={<Switch checked={settings.bpjs_ketenagakerjaan.aktif} onCheckedChange={(v) => set('bpjs_ketenagakerjaan', { aktif: v })} />}
                />
                <SettingRow
                    label="Persentase Karyawan"
                    aktif={settings.bpjs_ketenagakerjaan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_ketenagakerjaan.persentase_karyawan}
                            suffix="%"
                            disabled={!settings.bpjs_ketenagakerjaan.aktif}
                            onChange={(v) => set('bpjs_ketenagakerjaan', { persentase_karyawan: v })}
                        />
                    }
                />
                <SettingRow
                    label="Persentase Perusahaan"
                    aktif={settings.bpjs_ketenagakerjaan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_ketenagakerjaan.persentase_perusahaan}
                            suffix="%"
                            disabled={!settings.bpjs_ketenagakerjaan.aktif}
                            onChange={(v) => set('bpjs_ketenagakerjaan', { persentase_perusahaan: v })}
                        />
                    }
                />
            </Section>

            <Section title="PPh 21">
                <SettingRow
                    label="Aktifkan PPh 21"
                    control={<Switch checked={settings.pph21.aktif} onCheckedChange={(v) => set('pph21', { aktif: v })} />}
                />
                <div className="w-full max-w-xs">
                    <SelectField
                        label="Metode Perhitungan"
                        htmlFor="metode"
                        disabled={!settings.pph21.aktif}
                        value={settings.pph21.metode}
                        onValueChange={(v) => set('pph21', { metode: v as PayrollDeductionSettings['pph21']['metode'] })}
                        options={[
                            { value: 'ter', label: 'Tarif Efektif (TER)' },
                            { value: 'tahunan', label: 'Perhitungan Tahunan' },
                        ]}
                    />
                </div>
                <div className="w-full max-w-xs">
                    <SelectField
                        label="Pajak Ditanggung"
                        htmlFor="pajak_ditanggung"
                        disabled={!settings.pph21.aktif}
                        value={settings.pph21.pajak_ditanggung}
                        onValueChange={(v) => set('pph21', { pajak_ditanggung: v as PayrollDeductionSettings['pph21']['pajak_ditanggung'] })}
                        options={[
                            { value: 'karyawan', label: 'Karyawan' },
                            { value: 'perusahaan', label: 'Perusahaan' },
                        ]}
                    />
                </div>
            </Section>

            <div className="flex w-full justify-end">
                <button
                    type="button"
                    onClick={save}
                    className="font-poppins cursor-pointer rounded-lg bg-[#1980C0] px-8 py-3 text-sm font-semibold text-white"
                >
                    Simpan
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Wire it into `Settings.tsx`**

Open `app/Modules/Payroll/resources/js/pages/Settings.tsx`. Find:

```tsx
import { TunjanganPanel } from './settings/tunjangan-panel';
import { UmumPanel } from './settings/umum-panel';
```

Replace with:

```tsx
import { PotonganPanel } from './settings/potongan-panel';
import { TunjanganPanel } from './settings/tunjangan-panel';
import { UmumPanel } from './settings/umum-panel';
```

Find:

```tsx
                    <TabsContent value="potongan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
```

Replace with:

```tsx
                    <TabsContent value="potongan" className="w-full pt-[19px]">
                        <PotonganPanel />
                    </TabsContent>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/settings/potongan-panel.tsx app/Modules/Payroll/resources/js/pages/Settings.tsx
git commit -m "feat(payroll): add the Potongan settings panel"
```

---

### Task 12: Lembur panel

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/settings/lembur-panel.tsx`
- Modify: `app/Modules/Payroll/resources/js/pages/Settings.tsx`

**Interfaces:**
- Consumes: `loadOvertimeSettings`, `saveOvertimeSettings` (Task 4); `SelectField`, `TextField`
  (`@/components/form/form-field`).
- Produces: `LemburPanel()` — self-contained.

- [ ] **Step 1: Create `lembur-panel.tsx`**

Create `app/Modules/Payroll/resources/js/pages/settings/lembur-panel.tsx`:

```tsx
import { SelectField, TextField } from '@/components/form/form-field';
import { type PayrollOvertimeSettings } from '@/data/Payroll/payrollOvertimeSettings';
import { useState } from 'react';
import { toast } from 'sonner';
import { loadOvertimeSettings, saveOvertimeSettings } from '../../lib/payroll-settings-storage';

export function LemburPanel() {
    const [settings, setSettings] = useState<PayrollOvertimeSettings>(loadOvertimeSettings);
    const [nominalInput, setNominalInput] = useState(String(settings.nominal_per_jam));

    const save = () => {
        const nominal = Number(nominalInput.replace(/\D/g, '')) || settings.nominal_per_jam;
        const next = saveOvertimeSettings({ ...settings, nominal_per_jam: nominal });
        setSettings(next);
        setNominalInput(String(next.nominal_per_jam));
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <div className="grid w-full grid-cols-2 gap-6">
                <SelectField
                    label="Hitungan Lembur"
                    htmlFor="hitungan"
                    value={settings.hitungan}
                    onValueChange={() => {}}
                    options={[{ value: 'jam', label: 'Jam' }]}
                />
                <TextField
                    label="Nominal"
                    htmlFor="nominal_per_jam"
                    value={nominalInput}
                    onChange={(v) => setNominalInput(v.replace(/\D/g, ''))}
                    placeholder="Rp 0"
                />
            </div>

            <div className="flex w-full justify-end pt-4">
                <button
                    type="button"
                    onClick={save}
                    className="font-poppins cursor-pointer rounded-lg bg-[#1980C0] px-8 py-3 text-sm font-semibold text-white"
                >
                    Simpan
                </button>
            </div>
        </div>
    );
}
```

(`Hitungan Lembur` has a single fixed option — "Jam" — same reasoning as Umum's `Mata Uang`.)

- [ ] **Step 2: Wire it into `Settings.tsx`**

Open `app/Modules/Payroll/resources/js/pages/Settings.tsx`. Find:

```tsx
import { PotonganPanel } from './settings/potongan-panel';
import { TunjanganPanel } from './settings/tunjangan-panel';
import { UmumPanel } from './settings/umum-panel';
```

Replace with:

```tsx
import { LemburPanel } from './settings/lembur-panel';
import { PotonganPanel } from './settings/potongan-panel';
import { TunjanganPanel } from './settings/tunjangan-panel';
import { UmumPanel } from './settings/umum-panel';
```

Find:

```tsx
                    <TabsContent value="lembur" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
```

Replace with:

```tsx
                    <TabsContent value="lembur" className="w-full pt-[19px]">
                        <LemburPanel />
                    </TabsContent>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors — every `TabsContent` now renders a real panel, no placeholders remain.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/settings/lembur-panel.tsx app/Modules/Payroll/resources/js/pages/Settings.tsx
git commit -m "feat(payroll): add the Lembur settings panel"
```

---

### Task 13: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend gate**

```bash
composer check
```

Expected: Pint, PHPStan (level 6), and the full Pest suite (including
`tests/Feature/Payroll/PayrollSettingsTest.php`) all pass.

- [ ] **Step 2: Run the full frontend gate**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three exit 0.

- [ ] **Step 3: Manual browser verification**

Start the app and in the browser:

1. Go to **Penggajian → Pengaturan Gaji** (`/payroll/settings`). Confirm all 4 tabs render, "Umum"
   active by default, clicking each tab switches the active styling (bordered-box left-accent) and
   content correctly.
2. **Umum**: change Tanggal Pembayaran, click Simpan, confirm the toast and that the value persists
   across a refresh.
3. **Tunjangan**: confirm the list renders with a mix of Aktif/Nonaktif rows. Resolve Task 9 Step 2's
   flagged open question here — compare the search box + "+ Tunjangan" button's on-screen position
   against the reference screenshot; if `DataTable`'s built-in toolbar doesn't place them as shown
   (search left, button right, single row), move the "+ Tunjangan" button into `DataTable`'s
   `actions` prop instead of its own row, and remove the empty spacer div. Click "+ Tunjangan", fill
   the form, Simpan, confirm the new row appears and survives a refresh. Edit an existing row,
   confirm the change persists. Delete a row via the 3-dot menu → confirm dialog → confirm it
   disappears and survives a refresh.
4. **Potongan**: toggle "Potong Jika Alpha" off — confirm its Nominal field visibly dims/disables.
   Change BPJS Kesehatan's Persentase Karyawan from 1 to 2, Simpan.
5. **Lembur**: change Nominal from 50.000 to 75.000, Simpan.
6. Go to **Data Gaji** (`/payroll/data`). Confirm: BPJS Kesehatan deduction figures are now visibly
   different (roughly doubled) from before step 4; Lembur figures are visibly higher than before
   step 5 (proportional to the rate change); rows with an Alpha deduction now show Rp0 (since it
   was toggled off in step 4). Open a row's detail dialog — confirm PENDAPATAN lists exactly the
   Tunjangan rows currently Aktif in step 3 (by name), Edit mode shows only Gaji Pokok as an
   editable field with everything else read-only.
7. Refresh the whole app (hard refresh) and repeat step 6's checks — confirm every recomputed
   figure is identical (settings persisted correctly across a full reload, not just client state).

- [ ] **Step 4: No commit** — this task is verification only, nothing to stage.
