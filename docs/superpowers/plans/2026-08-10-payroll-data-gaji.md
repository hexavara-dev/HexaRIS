# Data Gaji (Payroll) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `Data Gaji` (payroll) list page at `/payroll/data`: 3 summary KPI cards, a
searchable/filterable table of payroll entries per employee per period, and a detail dialog that
can switch into an edit mode and save changes — all backed by generated dummy data overlaid with
`localStorage` edits, so the page survives a refresh with zero backend.

**Architecture:** New bounded context `app/Modules/Payroll/` (no migrations, no mutating HTTP
routes — mirrors `Employee`'s existing frontend-mock shape exactly). Seed data lives in
`resources/js/data/Payroll/` (branches, periods, generated payroll entries, deterministic — no
`Math.random()`), joined at render time with the existing `Employee`/`Position` seed data. Edits
go through a `localStorage` overrides map, same pattern as
`app/Modules/Employee/resources/js/lib/employee-storage.ts`.

**Tech Stack:** Laravel 12 (routes + permission gate only, no DB), React + TypeScript + Inertia,
existing shadcn/radix UI primitives, `sonner` for toasts, `localStorage` for mock persistence.

## Global Constraints

- No DB migrations, no `store`/`update` HTTP routes — every payroll edit happens client-side only,
  exactly like `Employee`'s wizard. Only `GET /payroll/data` exists as a real route, gated by
  `can:payroll.viewAny`.
- No `Math.random()` in seed data — `payrollEntry.ts` must be a pure, deterministic function of
  employee index + period index so the array is stable across reloads and reviewable in git diffs.
- Every frontend task ends with `npx tsc --noEmit` showing no new errors. This repo has no JS/TS
  unit test runner — frontend "tests" in this plan means `tsc` type-checking plus the final manual
  browser verification task, not automated unit tests.
- Every PHP task ends green on the relevant `./vendor/bin/pest` run. The full gate
  (`composer check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`) must be green at the end
  of the plan (Task 9).
- Spec: `docs/superpowers/specs/2026-08-10-payroll-data-gaji-design.md` — read it if any task here
  seems to contradict it; this plan should match it exactly.
- Out of scope: `Pengaturan Gaji`, `Reimburse`, real PDF export, adding/deleting payroll rows —
  do not build any of these.

---

### Task 1: Scaffold the `Payroll` module (route, permission, controller, Feature test)

**Files:**
- Create (via `php artisan module:make Payroll`): `app/Modules/Payroll/module.json`,
  `app/Modules/Payroll/README.md`, `app/Modules/Payroll/Providers/PayrollServiceProvider.php`,
  `app/Modules/Payroll/routes/web.php`, `app/Modules/Payroll/routes/api.php`,
  `app/Modules/Payroll/permissions.php`, plus empty dirs.
- Modify: `app/Modules/Payroll/permissions.php`, `app/Modules/Payroll/routes/web.php`.
- Create: `app/Modules/Payroll/Http/Controllers/PayrollController.php`.
- Create: `tests/Feature/Payroll/PayrollIndexTest.php`.

**Interfaces:**
- Produces: route `payroll.data.index` → `GET /payroll/data`, gated `can:payroll.viewAny`,
  renders Inertia component `'Payroll::pages/Index'` (created in Task 8). Permission
  `payroll.viewAny` (enforced) and `payroll.update` (declared only, mirrors `Employee`'s
  declared-but-unused `create`/`update`/`delete`).

- [ ] **Step 1: Scaffold the module directory**

Run: `php artisan module:make Payroll`
Expected: `Module Payroll created at app/Modules/Payroll.` — creates the standard directory tree
(see `docs/conventions.md` §1) with stub `module.json`, `README.md`, `PayrollServiceProvider.php`,
`routes/web.php`, `routes/api.php`, `permissions.php`.

- [ ] **Step 2: Declare the permissions**

Open `app/Modules/Payroll/permissions.php`. Replace its entire contents with:

```php
<?php

return [
    'payroll.viewAny',
    'payroll.update',
];
```

- [ ] **Step 3: Create the controller**

Create `app/Modules/Payroll/Http/Controllers/PayrollController.php`:

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
}
```

- [ ] **Step 4: Wire the route**

Open `app/Modules/Payroll/routes/web.php`. Replace its entire contents with:

```php
<?php

use App\Modules\Payroll\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('payroll/data', [PayrollController::class, 'index'])
        ->name('payroll.data.index')->middleware('can:payroll.viewAny');
});
```

- [ ] **Step 5: Sync permissions**

Run: `php artisan permission:sync`
Expected: reports `payroll.viewAny` and `payroll.update` upserted (or "no changes" if already run
once).

- [ ] **Step 6: Write the Feature test**

Create `tests/Feature/Payroll/PayrollIndexTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('payroll.viewAny', 'web');
});

it('forbids users without payroll.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/payroll/data')->assertForbidden();
});

it('renders the payroll data page for users with payroll.viewAny', function () {
    $admin = User::factory()->create()->givePermissionTo('payroll.viewAny');

    $this->actingAs($admin)
        ->get('/payroll/data')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payroll::pages/Index'));
});
```

- [ ] **Step 7: Run the test**

Run: `./vendor/bin/pest tests/Feature/Payroll`
Expected: both tests pass. (The `Payroll::pages/Index` Inertia component doesn't exist as a real
file yet — this is fine, `ensure_pages_exist` is disabled in `beforeEach`, matching the `Users`
test precedent.)

- [ ] **Step 8: Style/static-analysis check**

Run: `./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --memory-limit=512M`
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add app/Modules/Payroll tests/Feature/Payroll
git commit -m "feat(payroll): scaffold Payroll module with a permission-gated index route"
```

---

### Task 2: Dummy branches and periods

**Files:**
- Create: `resources/js/data/Payroll/branch.ts`
- Create: `resources/js/data/Payroll/period.ts`

**Interfaces:**
- Produces: `Branch { id: string; name: string }`, `branch: Branch[]` (3 entries). `Period { id:
  string; label: string }`, `period: Period[]` (3 entries, chronological — last entry is "the
  current period"). Consumed by Task 3 (`payrollEntry.ts`), Task 6 (`columns.tsx`), Task 7
  (dialog), Task 8 (`Index.tsx`).

- [ ] **Step 1: Create `branch.ts`**

Create `resources/js/data/Payroll/branch.ts`:

```ts
export interface Branch {
    id: string;
    name: string;
}

// No branch/location module exists yet — this is a small dummy list purely so the
// Payroll list page's "Cabang" filter has something real to filter on.
export const branch: Branch[] = [
    { id: 'branch-jakarta', name: 'Jakarta' },
    { id: 'branch-bandung', name: 'Bandung' },
    { id: 'branch-surabaya', name: 'Surabaya' },
];
```

- [ ] **Step 2: Create `period.ts`**

Create `resources/js/data/Payroll/period.ts`:

```ts
export interface Period {
    id: string;
    label: string;
}

// Chronological order matters: the last entry is treated as "the current period"
// (Index.tsx defaults the Periode filter to period[period.length - 1]).
export const period: Period[] = [
    { id: '2026-05', label: 'Mei 2026' },
    { id: '2026-06', label: 'Juni 2026' },
    { id: '2026-07', label: 'Juli 2026 (Bulan ini)' },
];
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive, nothing imports these yet).

- [ ] **Step 4: Commit**

```bash
git add resources/js/data/Payroll/branch.ts resources/js/data/Payroll/period.ts
git commit -m "feat(payroll): add dummy branch and period seed data"
```

---

### Task 3: Generated `payrollEntry` dummy data

**Files:**
- Create: `resources/js/data/Payroll/payrollEntry.ts`

**Interfaces:**
- Consumes: `employee` from `@/data/Employee/employee`, `employeeCompensation` from
  `@/data/Employee/employeeCompensation`, `branch` from `./branch`, `period` from `./period`.
- Produces: `PayrollStatus = 'selesai' | 'proses' | 'belum'`, `PayrollEarnings { position_allowance,
  meal_allowance, transport_allowance, overtime: number }`, `PayrollDeductions { alpha, late,
  bpjs_health, bpjs_employment, pph21: number }`, `PayrollEntry { id: string; employee_id: string;
  period_id: string; branch_id: string; base_salary: number; earnings: PayrollEarnings; deductions:
  PayrollDeductions; status: PayrollStatus; payment_date: string | null; payment_method: string |
  null }`, `payrollEntry: PayrollEntry[]`. Consumed by Task 4 (`payroll-row.ts`,
  `payroll-storage.ts`), Task 7, Task 8.

- [ ] **Step 1: Create the file**

Create `resources/js/data/Payroll/payrollEntry.ts`:

```ts
import { employee } from '@/data/Employee/employee';
import { employeeCompensation } from '@/data/Employee/employeeCompensation';
import { branch, type Branch } from './branch';
import { period } from './period';

export type PayrollStatus = 'selesai' | 'proses' | 'belum';

export interface PayrollEarnings {
    position_allowance: number;
    meal_allowance: number;
    transport_allowance: number;
    overtime: number;
}

export interface PayrollDeductions {
    alpha: number;
    late: number;
    bpjs_health: number;
    bpjs_employment: number;
    pph21: number;
}

export interface PayrollEntry {
    id: string;
    employee_id: string;
    period_id: string;
    branch_id: string;
    base_salary: number;
    earnings: PayrollEarnings;
    deductions: PayrollDeductions;
    status: PayrollStatus;
    payment_date: string | null;
    payment_method: string | null;
}

/** Only employees with a currently-effective compensation row get a payroll entry (e.g. EMP-0010's only row is not effective now, so it's skipped by construction). */
function effectiveBaseSalary(employeeId: string): number | undefined {
    return employeeCompensation.find((c) => c.employee_id === employeeId && c.is_effective_now)?.base_salary;
}

function roundTo(value: number, nearest: number): number {
    return Math.round(value / nearest) * nearest;
}

function branchFor(employeeIndex: number): Branch {
    return branch[employeeIndex % branch.length];
}

function buildEarnings(baseSalary: number, employeeIndex: number, periodIndex: number): PayrollEarnings {
    return {
        position_allowance: roundTo(baseSalary * 0.05, 10_000),
        meal_allowance: 400_000,
        transport_allowance: 300_000,
        overtime: 100_000 + ((employeeIndex * 7 + periodIndex * 13) % 8) * 50_000,
    };
}

function buildDeductions(baseSalary: number, employeeIndex: number, periodIndex: number): PayrollDeductions {
    return {
        alpha: (employeeIndex + periodIndex) % 5 === 0 ? 0 : 50_000 + ((employeeIndex * 3 + periodIndex) % 6) * 50_000,
        late: ((employeeIndex * 5 + periodIndex * 2) % 7) * 10_000,
        bpjs_health: roundTo(baseSalary * 0.01, 1_000),
        bpjs_employment: roundTo(baseSalary * 0.02, 1_000),
        pph21: roundTo(baseSalary * 0.025, 1_000),
    };
}

/** Past periods are already fully paid out; the latest (current) period is a realistic in-progress mix. */
function statusFor(employeeIndex: number, periodIndex: number): PayrollStatus {
    if (periodIndex < period.length - 1) return 'selesai';
    const bucket = employeeIndex % 5;
    if (bucket === 0) return 'belum';
    if (bucket === 1) return 'proses';
    return 'selesai';
}

function paymentDateFor(status: PayrollStatus, periodId: string): string | null {
    return status === 'selesai' ? `${periodId}-25` : null;
}

function paymentMethodFor(status: PayrollStatus, employeeIndex: number): string | null {
    if (status !== 'selesai') return null;
    return employeeIndex % 2 === 0 ? 'Transfer Bank' : 'Tunai';
}

export const payrollEntry: PayrollEntry[] = employee.flatMap((emp, employeeIndex) => {
    const baseSalary = effectiveBaseSalary(emp.id);
    if (baseSalary === undefined) return [];

    return period.map((p, periodIndex) => {
        const status = statusFor(employeeIndex, periodIndex);

        return {
            id: `payroll-${emp.employee_number}-${p.id}`,
            employee_id: emp.id,
            period_id: p.id,
            branch_id: branchFor(employeeIndex).id,
            base_salary: baseSalary,
            earnings: buildEarnings(baseSalary, employeeIndex, periodIndex),
            deductions: buildDeductions(baseSalary, employeeIndex, periodIndex),
            status,
            payment_date: paymentDateFor(status, p.id),
            payment_method: paymentMethodFor(status, employeeIndex),
        };
    });
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Sanity-check the generated data in a scratch script**

Run this one-off Node check to confirm the array shape (no need to keep the script):

```bash
node -e "
const { execSync } = require('child_process');
" 2>/dev/null; npx tsx -e "
import { payrollEntry } from './resources/js/data/Payroll/payrollEntry';
console.log('rows:', payrollEntry.length);
console.log('sample:', JSON.stringify(payrollEntry[0], null, 2));
console.log('any NaN?', payrollEntry.some(e => Number.isNaN(e.base_salary) || Object.values(e.earnings).some(Number.isNaN) || Object.values(e.deductions).some(Number.isNaN)));
"
```

Expected: `rows: 57` (19 employees with an effective compensation row × 3 periods), a plausible
sample entry, and `any NaN? false`. If `npx tsx` isn't available, skip this step — Task 8's manual
browser verification covers the same ground visually.

- [ ] **Step 4: Commit**

```bash
git add resources/js/data/Payroll/payrollEntry.ts
git commit -m "feat(payroll): generate deterministic dummy payroll entries"
```

---

### Task 4: `payroll-row.ts` (join + calc helpers) and `payroll-storage.ts` (localStorage overlay)

**Files:**
- Create: `app/Modules/Payroll/resources/js/lib/payroll-row.ts`
- Create: `app/Modules/Payroll/resources/js/lib/payroll-storage.ts`

**Interfaces:**
- Consumes: `PayrollEntry` from `@/data/Payroll/payrollEntry`; `Employee` (type) from
  `@/data/Employee/employee`; `employeeAssignment` from `@/data/Employee/employeeAssignment`;
  `jobPosition` from `@/data/Position/jobPosition`; `branch` from `@/data/Payroll/branch`.
- Produces: `PayrollRow extends PayrollEntry { employee_number, full_name, position_title,
  branch_name: string }`; `toPayrollRow(entry, employeeById: Map<string, Employee>): PayrollRow`;
  `allowanceTotal`, `deductionTotal`, `totalEarnings`, `thp` (all `(row) => number`);
  `formatCurrency(amount: number): string`; `formatDate(iso: string): string`. And
  `loadPayrollOverrides(): Record<string, Partial<PayrollEntry>>`; `savePayrollOverride(id: string,
  patch: Partial<PayrollEntry>): Record<string, Partial<PayrollEntry>>`. Consumed by Task 6, 7, 8.

- [ ] **Step 1: Create `payroll-row.ts`**

Create `app/Modules/Payroll/resources/js/lib/payroll-row.ts`:

```ts
import { type Employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { branch } from '@/data/Payroll/branch';
import { type PayrollEntry } from '@/data/Payroll/payrollEntry';
import { jobPosition } from '@/data/Position/jobPosition';

export interface PayrollRow extends PayrollEntry {
    employee_number: string;
    full_name: string;
    position_title: string;
    branch_name: string;
}

function positionTitleFor(employeeId: string): string {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId && a.is_active);
    if (!assignment) return '-';
    return jobPosition.find((p) => p.id === assignment.job_position_id)?.title ?? '-';
}

export function toPayrollRow(entry: PayrollEntry, employeeById: Map<string, Employee>): PayrollRow {
    const employee = employeeById.get(entry.employee_id);

    return {
        ...entry,
        employee_number: employee?.employee_number ?? '-',
        full_name: employee?.full_name ?? '-',
        position_title: positionTitleFor(entry.employee_id),
        branch_name: branch.find((b) => b.id === entry.branch_id)?.name ?? '-',
    };
}

export function allowanceTotal(row: Pick<PayrollEntry, 'earnings'>): number {
    return row.earnings.position_allowance + row.earnings.meal_allowance + row.earnings.transport_allowance;
}

export function deductionTotal(row: Pick<PayrollEntry, 'deductions'>): number {
    return row.deductions.alpha + row.deductions.late + row.deductions.bpjs_health + row.deductions.bpjs_employment + row.deductions.pph21;
}

export function totalEarnings(row: Pick<PayrollEntry, 'base_salary' | 'earnings'>): number {
    return row.base_salary + allowanceTotal(row);
}

export function thp(row: Pick<PayrollEntry, 'base_salary' | 'earnings' | 'deductions'>): number {
    return totalEarnings(row) - deductionTotal(row);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}
```

- [ ] **Step 2: Create `payroll-storage.ts`**

Create `app/Modules/Payroll/resources/js/lib/payroll-storage.ts`:

```ts
import { type PayrollEntry } from '@/data/Payroll/payrollEntry';

const STORAGE_KEY = 'hexaris.payroll.overrides';

export function loadPayrollOverrides(): Record<string, Partial<PayrollEntry>> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, Partial<PayrollEntry>>) : {};
    } catch {
        return {};
    }
}

/** Edit path for every payroll entry — never mutates the generated seed array, only this overlay, merged at render time in Index.tsx. */
export function savePayrollOverride(id: string, patch: Partial<PayrollEntry>): Record<string, Partial<PayrollEntry>> {
    const overrides = loadPayrollOverrides();
    const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Quota exceeded or storage disabled — the returned in-memory overrides still apply
        // for this session; only cross-refresh persistence silently fails.
    }
    return next;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive, nothing imports these yet).

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Payroll/resources/js/lib/payroll-row.ts app/Modules/Payroll/resources/js/lib/payroll-storage.ts
git commit -m "feat(payroll): add row-join/calc helpers and the localStorage overrides overlay"
```

---

### Task 5: Export the two existing KPI icons and add `TotalSalaryIcon`

**Files:**
- Modify: `resources/js/components/design-system/card/kpi-stat.tsx:26,39`

**Interfaces:**
- Produces: `ActiveEmployeesIcon`, `PayrollStatusIcon` become exported (previously private to this
  file); new `TotalSalaryIcon` exported. Consumed by Task 8 (`Index.tsx`).

- [ ] **Step 1: Export `ActiveEmployeesIcon`**

Open `resources/js/components/design-system/card/kpi-stat.tsx`. Find:

```tsx
function ActiveEmployeesIcon() {
```

Replace with:

```tsx
export function ActiveEmployeesIcon() {
```

- [ ] **Step 2: Export `PayrollStatusIcon` and add `TotalSalaryIcon` after it**

Find:

```tsx
function PayrollStatusIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0">
            <path
                d="M18.4375 2.5C18.6523 2.5 18.8542 2.53906 19.043 2.61719C19.2318 2.69531 19.3978 2.80924 19.541 2.95898C19.6842 3.10872 19.7949 3.27474 19.873 3.45703C19.9512 3.63932 19.9935 3.84115 20 4.0625V14.6875C20 14.9023 19.9609 15.1042 19.8828 15.293C19.8047 15.4818 19.6908 15.6478 19.541 15.791C19.3913 15.9342 19.2253 16.0449 19.043 16.123C18.8607 16.2012 18.6589 16.2435 18.4375 16.25H1.5625C1.34766 16.25 1.14583 16.2109 0.957031 16.1328C0.768229 16.0547 0.602214 15.9408 0.458984 15.791C0.315755 15.6413 0.205078 15.4753 0.126953 15.293C0.0488281 15.1107 0.00651042 14.9089 0 14.6875V4.0625C0 3.84766 0.0390625 3.64583 0.117188 3.45703C0.195312 3.26823 0.309245 3.10221 0.458984 2.95898C0.608724 2.81576 0.77474 2.70508 0.957031 2.62695C1.13932 2.54883 1.34115 2.50651 1.5625 2.5H18.4375ZM1.5625 3.75C1.47135 3.75 1.39648 3.7793 1.33789 3.83789C1.2793 3.89648 1.25 3.97135 1.25 4.0625V6.25H18.75V4.0625C18.75 3.97135 18.7207 3.89648 18.6621 3.83789C18.6035 3.7793 18.5286 3.75 18.4375 3.75H1.5625ZM18.4375 15C18.5286 15 18.6035 14.9707 18.6621 14.9121C18.7207 14.8535 18.75 14.7786 18.75 14.6875V7.5H1.25V14.6875C1.25 14.7786 1.2793 14.8535 1.33789 14.9121C1.39648 14.9707 1.47135 15 1.5625 15H18.4375ZM13.75 11.25H16.25V12.5H13.75V11.25Z"
                fill="#1980C0"
            />
        </svg>
    );
}
```

Replace with:

```tsx
export function PayrollStatusIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0">
            <path
                d="M18.4375 2.5C18.6523 2.5 18.8542 2.53906 19.043 2.61719C19.2318 2.69531 19.3978 2.80924 19.541 2.95898C19.6842 3.10872 19.7949 3.27474 19.873 3.45703C19.9512 3.63932 19.9935 3.84115 20 4.0625V14.6875C20 14.9023 19.9609 15.1042 19.8828 15.293C19.8047 15.4818 19.6908 15.6478 19.541 15.791C19.3913 15.9342 19.2253 16.0449 19.043 16.123C18.8607 16.2012 18.6589 16.2435 18.4375 16.25H1.5625C1.34766 16.25 1.14583 16.2109 0.957031 16.1328C0.768229 16.0547 0.602214 15.9408 0.458984 15.791C0.315755 15.6413 0.205078 15.4753 0.126953 15.293C0.0488281 15.1107 0.00651042 14.9089 0 14.6875V4.0625C0 3.84766 0.0390625 3.64583 0.117188 3.45703C0.195312 3.26823 0.309245 3.10221 0.458984 2.95898C0.608724 2.81576 0.77474 2.70508 0.957031 2.62695C1.13932 2.54883 1.34115 2.50651 1.5625 2.5H18.4375ZM1.5625 3.75C1.47135 3.75 1.39648 3.7793 1.33789 3.83789C1.2793 3.89648 1.25 3.97135 1.25 4.0625V6.25H18.75V4.0625C18.75 3.97135 18.7207 3.89648 18.6621 3.83789C18.6035 3.7793 18.5286 3.75 18.4375 3.75H1.5625ZM18.4375 15C18.5286 15 18.6035 14.9707 18.6621 14.9121C18.7207 14.8535 18.75 14.7786 18.75 14.6875V7.5H1.25V14.6875C1.25 14.7786 1.2793 14.8535 1.33789 14.9121C1.39648 14.9707 1.47135 15 1.5625 15H18.4375ZM13.75 11.25H16.25V12.5H13.75V11.25Z"
                fill="#1980C0"
            />
        </svg>
    );
}

export function TotalSalaryIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0">
            <path
                d="M10 1.66599V18.334M14.1667 4.16618H7.91667C7.14312 4.16618 6.40125 4.4735 5.85427 5.02053C5.30729 5.56755 5 6.30947 5 7.08308C5 7.85669 5.30729 8.59862 5.85427 9.14564C6.40125 9.69267 7.14312 9.99998 7.91667 9.99998H12.0833C12.8569 9.99998 13.5987 10.3073 14.1457 10.8543C14.6927 11.4013 15 12.1433 15 12.9169C15 13.6905 14.6927 14.4324 14.1457 14.9794C13.5987 15.5265 12.8569 15.8338 12.0833 15.8338H5"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/components/design-system/card/kpi-stat.tsx
git commit -m "feat(design-system): export KPI icons and add TotalSalaryIcon for reuse"
```

---

### Task 6: `columns.tsx` — table columns with an inline status dropdown

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/columns.tsx`

**Interfaces:**
- Consumes: `Column` (type) from `@/components/data-table`; `Select`/`SelectContent`/`SelectItem`/
  `SelectTrigger`/`SelectValue` from `@/components/ui/select`; `PayrollStatus` (type) from
  `@/data/Payroll/payrollEntry`; `cn` from `@/lib/utils`; `allowanceTotal`, `deductionTotal`,
  `formatCurrency`, `thp`, `PayrollRow` (type) from `../lib/payroll-row` (Task 4).
- Produces: `buildPayrollColumns(onEdit: (row: PayrollRow) => void, onStatusChange: (row:
  PayrollRow, status: PayrollStatus) => void): Column<PayrollRow>[]`. Consumed by Task 8.

- [ ] **Step 1: Create the file**

Create `app/Modules/Payroll/resources/js/pages/columns.tsx`:

```tsx
import { type Column } from '@/components/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { cn } from '@/lib/utils';
import { SquarePen } from 'lucide-react';
import { allowanceTotal, deductionTotal, formatCurrency, thp, type PayrollRow } from '../lib/payroll-row';

const STATUS_LABEL: Record<PayrollStatus, string> = { selesai: 'Selesai', proses: 'Proses', belum: 'Belum' };
const STATUS_COLOR: Record<PayrollStatus, string> = { selesai: 'text-[#46B52B]', proses: 'text-[#CA8A04]', belum: 'text-[#E84A39]' };

function StatusCell({ row, onStatusChange }: { row: PayrollRow; onStatusChange: (row: PayrollRow, status: PayrollStatus) => void }) {
    return (
        <Select value={row.status} onValueChange={(value) => onStatusChange(row, value as PayrollStatus)}>
            <SelectTrigger className={cn('h-7 w-fit gap-1.5 rounded-lg border-[#E7E7E7] px-2 py-1 font-poppins text-xs', STATUS_COLOR[row.status])}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {(Object.keys(STATUS_LABEL) as PayrollStatus[]).map((status) => (
                    <SelectItem key={status} value={status} className={STATUS_COLOR[status]}>
                        {STATUS_LABEL[status]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function buildPayrollColumns(
    onEdit: (row: PayrollRow) => void,
    onStatusChange: (row: PayrollRow, status: PayrollStatus) => void,
): Column<PayrollRow>[] {
    return [
        { key: 'employee_number', label: 'ID', sortable: true },
        {
            key: 'full_name',
            label: 'Karyawan',
            sortable: true,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-poppins text-xs text-[#424242]">{row.full_name}</span>
                    <span className="font-poppins text-[11px] text-[#8F8F8F]">{row.position_title}</span>
                </div>
            ),
        },
        { key: 'base_salary', label: 'Gaji Pokok', sortable: true, render: (row) => formatCurrency(row.base_salary) },
        { key: 'tunjangan', label: 'Tunjangan', render: (row) => <span className="text-[#46B52B]">{formatCurrency(allowanceTotal(row))}</span> },
        { key: 'lembur', label: 'Lembur', render: (row) => <span className="text-[#46B52B]">{formatCurrency(row.earnings.overtime)}</span> },
        { key: 'potongan', label: 'Potongan', render: (row) => <span className="text-[#E84A39]">{formatCurrency(deductionTotal(row))}</span> },
        { key: 'thp', label: 'THP', render: (row) => formatCurrency(thp(row)) },
        { key: 'status', label: 'Status', render: (row) => <StatusCell row={row} onStatusChange={onStatusChange} /> },
        {
            key: 'actions',
            label: '',
            align: 'right',
            render: (row) => (
                <button type="button" onClick={() => onEdit(row)} className="cursor-pointer rounded-md border border-[#E7E7E7] p-1.5">
                    <SquarePen className="size-3.5 text-black" />
                </button>
            ),
        },
    ];
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive, nothing imports this yet).

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/columns.tsx
git commit -m "feat(payroll): add table columns with an inline status dropdown"
```

---

### Task 7: `payroll-detail-dialog.tsx` — view/edit detail dialog

**Files:**
- Create: `app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx`

**Interfaces:**
- Consumes: `Avatar`/`AvatarFallback` from `@/components/ui/avatar`; `Dialog`/`DialogContent`/
  `DialogHeader`/`DialogTitle` from `@/components/ui/dialog`; `Input` from
  `@/components/ui/input`; `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue`
  from `@/components/ui/select`; `Separator` from `@/components/ui/separator`; `period` from
  `@/data/Payroll/period`; `PayrollEntry`, `PayrollStatus` (types) from
  `@/data/Payroll/payrollEntry`; `formatCurrency`, `formatDate`, `PayrollRow` (type) from
  `../lib/payroll-row` (Task 4).
- Produces: `PayrollDetailDialog({ open, onOpenChange, row, onSaved }: { open: boolean;
  onOpenChange: (open: boolean) => void; row: PayrollRow | null; onSaved: (entryId: string, patch:
  Partial<PayrollEntry>) => void })`. Consumed by Task 8.

- [ ] **Step 1: Create the file**

Create `app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx`:

```tsx
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { period } from '@/data/Payroll/period';
import { Calendar, ChevronDown } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, type PayrollRow } from '../lib/payroll-row';

const STATUS_LABEL: Record<PayrollStatus, string> = { selesai: 'Selesai', proses: 'Proses', belum: 'Belum' };
const PAYMENT_METHODS = ['Tunai', 'Transfer Bank'];

interface EditableFields {
    period_id: string;
    status: PayrollStatus;
    payment_date: string;
    payment_method: string;
    base_salary: string;
    position_allowance: string;
    meal_allowance: string;
    transport_allowance: string;
    overtime: string;
    alpha: string;
    late: string;
    bpjs_health: string;
    bpjs_employment: string;
    pph21: string;
}

function toEditableFields(row: PayrollRow): EditableFields {
    return {
        period_id: row.period_id,
        status: row.status,
        payment_date: row.payment_date ?? '',
        payment_method: row.payment_method ?? '',
        base_salary: String(row.base_salary),
        position_allowance: String(row.earnings.position_allowance),
        meal_allowance: String(row.earnings.meal_allowance),
        transport_allowance: String(row.earnings.transport_allowance),
        overtime: String(row.earnings.overtime),
        alpha: String(row.deductions.alpha),
        late: String(row.deductions.late),
        bpjs_health: String(row.deductions.bpjs_health),
        bpjs_employment: String(row.deductions.bpjs_employment),
        pph21: String(row.deductions.pph21),
    };
}

function toPatch(fields: EditableFields): Partial<PayrollEntry> {
    const num = (value: string) => Number(value.replace(/\D/g, '')) || 0;

    return {
        period_id: fields.period_id,
        status: fields.status,
        payment_date: fields.payment_date || null,
        payment_method: fields.payment_method || null,
        base_salary: num(fields.base_salary),
        earnings: {
            position_allowance: num(fields.position_allowance),
            meal_allowance: num(fields.meal_allowance),
            transport_allowance: num(fields.transport_allowance),
            overtime: num(fields.overtime),
        },
        deductions: {
            alpha: num(fields.alpha),
            late: num(fields.late),
            bpjs_health: num(fields.bpjs_health),
            bpjs_employment: num(fields.bpjs_employment),
            pph21: num(fields.pph21),
        },
    };
}

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function FieldRowView({ label, value, icon }: { label: string; value?: string; icon: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-xs text-[#64748B]">{label}</p>
            <span className="flex items-center gap-2 rounded-lg border border-[#E7E7E7] px-2 py-1 text-nowrap">
                <span className="font-poppins w-[61px] text-left text-xs text-black">{value ?? 'Pilih'}</span>
                {icon}
            </span>
        </div>
    );
}

function FieldRowEdit({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-xs text-[#64748B]">{label}</p>
            {children}
        </div>
    );
}

function SalarySectionView({
    title,
    items,
    total,
    totalLabel,
}: {
    title: string;
    items: { label: string; amount: number }[];
    total: number;
    totalLabel: string;
}) {
    return (
        <div className="flex w-full flex-col items-start gap-2">
            <p className="font-poppins text-xs font-semibold text-[#1A8215]">{title}</p>
            <div className="flex w-full flex-col items-start gap-1.5">
                {items.map((item) => (
                    <div key={item.label} className="flex w-full items-center justify-between py-1">
                        <p className="font-poppins text-xs text-[#8F8F8F]">{item.label}</p>
                        <p className="font-poppins text-xs font-medium text-black">{formatCurrency(item.amount)}</p>
                    </div>
                ))}
                <Separator className="bg-[#E2E8F0]" />
                <div className="flex w-full items-center justify-between py-1">
                    <p className="font-poppins text-xs font-semibold text-black">{totalLabel}</p>
                    <p className="font-poppins text-[13px] font-bold text-[#1A8215]">{formatCurrency(total)}</p>
                </div>
            </div>
        </div>
    );
}

function SalarySectionEdit({
    title,
    rows,
    fields,
    setField,
}: {
    title: string;
    rows: { label: string; key: keyof EditableFields }[];
    fields: EditableFields;
    setField: <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => void;
}) {
    return (
        <div className="flex w-full flex-col items-start gap-2">
            <p className="font-poppins text-xs font-semibold text-[#1A8215]">{title}</p>
            <div className="flex w-full flex-col items-start gap-1.5">
                {rows.map((row) => (
                    <div key={row.key} className="flex w-full items-center justify-between py-1">
                        <p className="font-poppins text-xs text-[#8F8F8F]">{row.label}</p>
                        <Input
                            value={fields[row.key]}
                            onChange={(e) => setField(row.key, e.target.value.replace(/\D/g, ''))}
                            className="h-7 w-32 border-[#E7E7E7] text-right text-xs"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

interface PayrollDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: PayrollRow | null;
    onSaved: (entryId: string, patch: Partial<PayrollEntry>) => void;
}

export function PayrollDetailDialog({ open, onOpenChange, row, onSaved }: PayrollDetailDialogProps) {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [fields, setFields] = useState<EditableFields | null>(null);

    useEffect(() => {
        if (row) {
            setFields(toEditableFields(row));
            setMode('view');
        }
    }, [row]);

    if (!row || !fields) return null;

    const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) =>
        setFields((current) => (current ? { ...current, [key]: value } : current));

    const earningsView = [
        { label: 'Gaji Pokok', amount: row.base_salary },
        { label: 'Tunjangan Jabatan', amount: row.earnings.position_allowance },
        { label: 'Tunjangan Makan', amount: row.earnings.meal_allowance },
        { label: 'Tunjangan Transport', amount: row.earnings.transport_allowance },
        { label: 'Lembur', amount: row.earnings.overtime },
    ];
    const deductionsView = [
        { label: 'Alpha', amount: row.deductions.alpha },
        { label: 'Terlambat', amount: row.deductions.late },
        { label: 'BPJS Kesehatan', amount: row.deductions.bpjs_health },
        { label: 'BPJS Ketenagakerjaan', amount: row.deductions.bpjs_employment },
        { label: 'PPh 21', amount: row.deductions.pph21 },
    ];
    const totalEarningsView = earningsView.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductionsView = deductionsView.reduce((sum, item) => sum + item.amount, 0);
    const netSalary = totalEarningsView - totalDeductionsView;

    const save = () => {
        onSaved(row.id, toPatch(fields));
        toast.success('Berhasil Disimpan');
        setMode('view');
    };

    const chevron = <ChevronDown className="h-2.5 w-2.5 text-black" />;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Detail Gaji</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
                    <div className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(row.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                            <p className="font-poppins text-base font-semibold text-[#1E293B]">{row.full_name}</p>
                            <div className="flex items-center gap-1.5">
                                <p className="font-poppins text-xs text-[#64748B]">{row.position_title}</p>
                                <span className="h-1 w-1 rounded-full bg-[#64748B]" />
                                <p className="font-poppins text-xs text-[#64748B]">{row.employee_number}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col items-start gap-2.5">
                        {mode === 'view' ? (
                            <>
                                <FieldRowView label="Periode" value={period.find((p) => p.id === fields.period_id)?.label} icon={chevron} />
                                <FieldRowView label="Status" value={STATUS_LABEL[fields.status]} icon={chevron} />
                                <FieldRowView
                                    label="Tanggal Bayar"
                                    value={fields.payment_date ? formatDate(fields.payment_date) : undefined}
                                    icon={<Calendar className="h-2.5 w-2.5 text-black" />}
                                />
                                <FieldRowView label="Metode Bayar" value={fields.payment_method || undefined} icon={chevron} />
                            </>
                        ) : (
                            <>
                                <FieldRowEdit label="Periode">
                                    <Select value={fields.period_id} onValueChange={(value) => setField('period_id', value)}>
                                        <SelectTrigger className="h-7 w-fit border-[#E7E7E7] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {period.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldRowEdit>
                                <FieldRowEdit label="Status">
                                    <Select value={fields.status} onValueChange={(value) => setField('status', value as PayrollStatus)}>
                                        <SelectTrigger className="h-7 w-fit border-[#E7E7E7] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(STATUS_LABEL) as PayrollStatus[]).map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {STATUS_LABEL[status]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldRowEdit>
                                <FieldRowEdit label="Tanggal Bayar">
                                    <Input
                                        type="date"
                                        value={fields.payment_date}
                                        onChange={(e) => setField('payment_date', e.target.value)}
                                        className="h-7 w-fit border-[#E7E7E7] text-xs"
                                    />
                                </FieldRowEdit>
                                <FieldRowEdit label="Metode Bayar">
                                    <Select value={fields.payment_method || undefined} onValueChange={(value) => setField('payment_method', value)}>
                                        <SelectTrigger className="h-7 w-fit border-[#E7E7E7] text-xs">
                                            <SelectValue placeholder="Pilih" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldRowEdit>
                            </>
                        )}
                    </div>

                    <Separator className="bg-[#E2E8F0]" />

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

                    <Separator className="bg-[#E2E8F0]" />

                    <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-[#E0F2FE] p-3.5">
                        <p className="font-poppins text-[11px] font-semibold text-[#1980C0]">GAJI BERSIH (THP)</p>
                        <p className="font-poppins text-lg font-extrabold text-[#1980C0]">{formatCurrency(netSalary)}</p>
                    </div>

                    {mode === 'view' ? (
                        <div className="flex w-full items-start gap-2.5">
                            <button
                                type="button"
                                onClick={() => setMode('edit')}
                                className="font-poppins h-10 w-full cursor-pointer rounded-[10px] border border-[#1980C0] text-xs font-semibold text-[#1980C0]"
                            >
                                Edit Slip Gaji
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="font-poppins h-10 w-full cursor-pointer rounded-[10px] bg-[#1980C0] text-xs font-bold text-white"
                            >
                                Cetak Slip Gaji
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={save}
                            className="font-poppins h-10 w-full cursor-pointer rounded-[10px] bg-[#1980C0] text-xs font-bold text-white"
                        >
                            Simpan
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive, nothing imports this yet).

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/components/payroll-detail-dialog.tsx
git commit -m "feat(payroll): add the view/edit payroll detail dialog"
```

---

### Task 8: `pages/Index.tsx` — wire filters, KPI cards, table, and the dialog together

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/Index.tsx`

**Interfaces:**
- Consumes: `KpiStatCard`, `ActiveEmployeesIcon`, `PayrollStatusIcon`, `TotalSalaryIcon` from
  `@/components/design-system/card/kpi-stat` (Task 5); `DataTable` from `@/components/data-table`;
  `Input` from `@/components/ui/input`; `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/
  `SelectValue` from `@/components/ui/select`; `branch` from `@/data/Payroll/branch`; `employee`
  from `@/data/Employee/employee`; `period` from `@/data/Payroll/period`; `payrollEntry`,
  `PayrollEntry` (type) from `@/data/Payroll/payrollEntry`; `AppLayout` (default) from
  `@/layouts/app-layout`; `PayrollDetailDialog` from `../components/payroll-detail-dialog` (Task
  7); `loadPayrollOverrides`, `savePayrollOverride` from `../lib/payroll-storage` (Task 4);
  `formatCurrency`, `thp`, `toPayrollRow`, `PayrollRow` (type) from `../lib/payroll-row` (Task 4);
  `buildPayrollColumns` from `./columns` (Task 6).
- Produces: default export `Index()` — the page component `PayrollController::index` renders as
  `'Payroll::pages/Index'`.

- [ ] **Step 1: Create the file**

Create `app/Modules/Payroll/resources/js/pages/Index.tsx`:

```tsx
import { DataTable } from '@/components/data-table';
import { ActiveEmployeesIcon, KpiStatCard, PayrollStatusIcon, TotalSalaryIcon } from '@/components/design-system/card/kpi-stat';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employee } from '@/data/Employee/employee';
import { branch } from '@/data/Payroll/branch';
import { payrollEntry, type PayrollEntry } from '@/data/Payroll/payrollEntry';
import { period } from '@/data/Payroll/period';
import AppLayout from '@/layouts/app-layout';
import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { PayrollDetailDialog } from '../components/payroll-detail-dialog';
import { formatCurrency, thp, toPayrollRow, type PayrollRow } from '../lib/payroll-row';
import { loadPayrollOverrides, savePayrollOverride } from '../lib/payroll-storage';
import { buildPayrollColumns } from './columns';

const ALL_BRANCHES = 'all';
const CURRENT_PERIOD_ID = period[period.length - 1].id;

export default function Index() {
    const [overrides, setOverrides] = useState(loadPayrollOverrides);
    const [searchValue, setSearchValue] = useState('');
    const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES);
    const [periodFilter, setPeriodFilter] = useState(CURRENT_PERIOD_ID);
    const [editingRow, setEditingRow] = useState<PayrollRow | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const employeeById = useMemo(() => new Map(employee.map((e) => [e.id, e])), []);

    const allRows = useMemo(
        () => payrollEntry.map((entry) => toPayrollRow({ ...entry, ...overrides[entry.id] }, employeeById)),
        [overrides, employeeById],
    );

    const scopedRows = useMemo(
        () => allRows.filter((row) => row.period_id === periodFilter && (branchFilter === ALL_BRANCHES || row.branch_id === branchFilter)),
        [allRows, periodFilter, branchFilter],
    );

    const tableRows = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return scopedRows;
        return scopedRows.filter((row) => row.full_name.toLowerCase().includes(query) || row.employee_number.toLowerCase().includes(query));
    }, [scopedRows, searchValue]);

    const totalActiveEmployees = scopedRows.length;
    const totalPayable = useMemo(() => scopedRows.reduce((sum, row) => sum + thp(row), 0), [scopedRows]);
    const statusCounts = useMemo(
        () => ({
            selesai: scopedRows.filter((row) => row.status === 'selesai').length,
            belum: scopedRows.filter((row) => row.status === 'belum').length,
        }),
        [scopedRows],
    );

    const openEdit = useCallback((row: PayrollRow) => {
        setEditingRow(row);
        setDialogOpen(true);
    }, []);

    const onStatusChange = useCallback((row: PayrollRow, status: PayrollRow['status']) => {
        setOverrides(savePayrollOverride(row.id, { status }));
    }, []);

    const onSaved = useCallback((entryId: string, patch: Partial<PayrollEntry>) => {
        setOverrides(savePayrollOverride(entryId, patch));
        setEditingRow((current) => (current && current.id === entryId ? { ...current, ...patch } : current));
    }, []);

    const columns = useMemo(() => buildPayrollColumns(openEdit, onStatusChange), [openEdit, onStatusChange]);

    return (
        <AppLayout>
            <div className="space-y-[19px] p-6">
                <div className="flex items-center justify-between">
                    <div className="relative w-[244px]">
                        <Search className="absolute top-2.5 left-3 size-4 text-black" />
                        <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search" className="pl-9" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[163px] border-[#ACACAC] bg-[#FAFBFD] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_BRANCHES}>Semua Cabang</SelectItem>
                                {branch.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        Cabang: {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="w-fit border-[#ACACAC] bg-[#FAFBFD] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {period.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        Periode: {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <KpiStatCard label="Total Semua Karyawan Aktif" iconBackground="rgba(139,92,246,0.10)" icon={<ActiveEmployeesIcon />}>
                        <p className="font-poppins text-2xl font-semibold text-black">{totalActiveEmployees}</p>
                    </KpiStatCard>
                    <KpiStatCard label="Total Semua Gaji Yang Harus Dibayar" iconBackground="rgba(16,185,129,0.10)" icon={<TotalSalaryIcon />}>
                        <p className="font-poppins text-2xl font-semibold text-black">{formatCurrency(totalPayable)}</p>
                    </KpiStatCard>
                    <KpiStatCard label="Status Pembayaran Gaji" iconBackground="rgba(25,128,192,0.10)" icon={<PayrollStatusIcon />}>
                        <div className="flex items-start gap-2">
                            <p className="font-poppins text-sm text-black">{statusCounts.selesai} Selesai</p>
                            <p className="font-poppins text-sm text-black">{statusCounts.belum} Belum</p>
                        </div>
                    </KpiStatCard>
                </div>

                <DataTable columns={columns} data={tableRows} variant="design-system" />

                <PayrollDetailDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditingRow(null);
                    }}
                    row={editingRow}
                    onSaved={onSaved}
                />
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/Index.tsx
git commit -m "feat(payroll): wire the Data Gaji list page (KPI cards, table, filters, detail dialog)"
```

---

### Task 9: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend gate**

```bash
composer check
```

Expected: Pint, PHPStan (level 6), and the full Pest suite (including
`tests/Feature/Payroll/PayrollIndexTest.php`) all pass.

- [ ] **Step 2: Run the full frontend gate**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three exit 0.

- [ ] **Step 3: Manual browser verification**

Start the app (`php artisan serve` and `npm run dev` in separate terminals, or your usual local
setup) and in the browser:

1. Log in as a user with `payroll.viewAny` (or a `super-admin`), go to **Penggajian → Data Gaji**
   (`/payroll/data`). Confirm the page loads: search box + Cabang/Periode dropdowns at the top, 3
   KPI cards, then the table.
2. Confirm the Periode dropdown defaults to "Juli 2026 (Bulan ini)" and the table only shows that
   period's rows. Switch to "Mei 2026" — confirm the table and all 3 KPI cards update, and every
   visible row's Status shows "Selesai" (past periods are always fully paid per the generator).
3. Switch Cabang to one specific branch — confirm the row count and KPI numbers shrink
   accordingly; switch back to the default (all branches).
4. Type a known employee's name into Search — confirm only matching rows remain, and the KPI cards
   do **not** change (they reflect period+branch scope, not the text search, per the design spec).
5. In the table, open a row's Status dropdown and change it (e.g. "Belum" → "Selesai"). Confirm the
   KPI "Status Pembayaran Gaji" counts update immediately.
6. Refresh the page. Confirm the status change from step 5 persisted (localStorage overlay).
7. Click a row's pencil (edit) icon. Confirm the dialog opens in view mode with that employee's
   real data (avatar initials, name, position, ID, Periode/Status/Tanggal Bayar/Metode Bayar, the
   Pendapatan/Potongan breakdown, and GAJI BERSIH (THP) at the bottom).
8. Click "Edit Slip Gaji". Confirm every Pendapatan/Potongan line becomes an editable input
   pre-filled with the current value (not blank), and the header fields become real
   selects/date-input. Change one amount (e.g. Lembur) and click "Simpan".
9. Confirm: a "Berhasil Disimpan" toast appears, the dialog returns to view mode showing the
   updated amount and an updated GAJI BERSIH (THP), and the table row's Lembur/THP columns reflect
   the new value once the dialog closes.
10. Refresh the page and reopen the same row's detail — confirm the edited value persisted.
11. Click "Cetak Slip Gaji" from view mode — confirm the browser's print dialog opens (no crash).

- [ ] **Step 4: No commit** — this task is verification only, nothing to stage.
