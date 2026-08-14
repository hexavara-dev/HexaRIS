# Reimburse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Reimburse" page (list, add, edit, delete, view/download proof) as a third
resource inside the existing `Payroll` module, reachable from a new sidebar entry.

**Architecture:** 100% frontend-mock, matching Data Gaji/Pengaturan Gaji exactly — one real
route (`GET payroll/reimburse`, gated `can:reimburse.viewAny`) rendering a single Inertia page;
every create/update/delete happens client-side against a `localStorage` overlay. No migration,
no FormRequest, no mutating HTTP route.

**Tech Stack:** Laravel 12 + Inertia + React (TypeScript), spatie/laravel-permission, existing
shared components (`DataTable`, `ConfirmDialog`, `TextField`/`SelectField`/`FileUploadField`).

## Global Constraints

- Build skill: `add-resource` (Reimburse resource inside the existing `Payroll` module — not a
  new module).
- Permission names: `reimburse.viewAny`, `reimburse.create`, `reimburse.update`,
  `reimburse.delete` — declared in `app/Modules/Payroll/permissions.php`; only `viewAny` gates
  anything (the route), matching the precedent already set by Data Gaji/Pengaturan Gaji (no
  granular client-side button hiding).
- Every mutating route gets a 403-without-permission test + happy-path test — but this feature
  has exactly one route (`viewAny`), no `store`/`update`/`destroy` routes, since writes are
  client-side.
- Toast copy is unified across this Payroll module: `'Berhasil Disimpan'` for every
  create/update/delete success.
- `ConfirmDialog` copy for delete: title `"Hapus Reimburse?"`, description `"Anda akan
  menghapus data Reimburse ini secara permanen. Tindakan ini tidak dapat dibatalkan dan seluruh
  informasi terkait akan hilang."`, `confirmLabel="Hapus"`, `cancelLabel="Batal"`.
- Every task ends green on `composer check` (backend tasks) and/or `npx tsc --noEmit` +
  `npx eslint <touched files>` (frontend tasks). The final task also runs `npm run build`.
- No approval workflow, no PDF generation — out of scope per the design spec.

---

### Task 1: Backend route, permission, controller method, test

**Files:**
- Modify: `app/Modules/Payroll/permissions.php`
- Modify: `app/Modules/Payroll/Http/Controllers/PayrollController.php`
- Modify: `app/Modules/Payroll/routes/web.php`
- Create: `tests/Feature/Payroll/PayrollReimburseTest.php`
- Modify: `docs/endpoints.md` (regenerated, not hand-edited)

**Interfaces:**
- Produces: route `payroll.reimburse.index` at `GET payroll/reimburse`, rendering Inertia
  component `Payroll::pages/Reimburse` (built in Task 8). Gated `can:reimburse.viewAny`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('reimburse.viewAny', 'web');
});

it('forbids users without reimburse.viewAny', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/payroll/reimburse')->assertForbidden();
});

it('renders the reimburse page for users with reimburse.viewAny', function () {
    $admin = User::factory()->create()->givePermissionTo('reimburse.viewAny');

    $this->actingAs($admin)
        ->get('/payroll/reimburse')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payroll::pages/Reimburse'));
});
```

Save as `tests/Feature/Payroll/PayrollReimburseTest.php`.

- [ ] **Step 2: Run test to verify it fails**

Run: `./vendor/bin/pest tests/Feature/Payroll/PayrollReimburseTest.php`
Expected: FAIL — route `payroll/reimburse` doesn't exist yet (404), and permission
`reimburse.viewAny` isn't declared yet.

- [ ] **Step 3: Declare the permissions**

Replace the full contents of `app/Modules/Payroll/permissions.php`:

```php
<?php

return [
    'payroll.viewAny',
    'payroll.update',
    'reimburse.viewAny',
    'reimburse.create',
    'reimburse.update',
    'reimburse.delete',
];
```

- [ ] **Step 4: Add the controller method**

In `app/Modules/Payroll/Http/Controllers/PayrollController.php`, add this method inside the
`PayrollController` class, after `settings()`:

```php
    public function reimburse(Request $request): Response
    {
        return Inertia::render('Payroll::pages/Reimburse');
    }
```

- [ ] **Step 5: Add the route**

In `app/Modules/Payroll/routes/web.php`, add this line inside the existing
`Route::middleware('auth')->group(function () { ... });` block, after the `payroll/settings`
route:

```php
    Route::get('payroll/reimburse', [PayrollController::class, 'reimburse'])
        ->name('payroll.reimburse.index')->middleware('can:reimburse.viewAny');
```

- [ ] **Step 6: Sync permissions and run the test**

Run: `php artisan permission:sync`
Expected: reports 4 new permissions upserted (`reimburse.viewAny/create/update/delete`).

Run: `./vendor/bin/pest tests/Feature/Payroll/PayrollReimburseTest.php`
Expected: PASS (2 passed). Note: this page will actually render blank/error until Task 8 adds
the React page — `assertOk()` only checks the Inertia response, which Laravel returns
regardless of whether the frontend `.tsx` file exists, so this test passes correctly at this
point in the plan.

- [ ] **Step 7: Regenerate the route docs**

Run: `php artisan app:endpoints`
Expected: `docs/endpoints.md` gains a `payroll/reimburse` row.

- [ ] **Step 8: Run the full backend gate**

Run: `composer check`
Expected: Pint, PHPStan, and Pest all green.

- [ ] **Step 9: Commit**

```bash
git add app/Modules/Payroll/permissions.php app/Modules/Payroll/Http/Controllers/PayrollController.php app/Modules/Payroll/routes/web.php tests/Feature/Payroll/PayrollReimburseTest.php docs/endpoints.md
git commit -m "feat(payroll): add a permission-gated /payroll/reimburse route"
```

---

### Task 2: Seed data and shared position-title export

**Files:**
- Create: `resources/js/data/Payroll/reimburseEntry.ts`
- Modify: `app/Modules/Payroll/resources/js/lib/payroll-row.ts:20` (export `positionTitleFor`)

**Interfaces:**
- Consumes: `Employee` (`resources/js/data/Employee/employee.ts`), `branch`/`Branch`
  (`resources/js/data/Payroll/branch.ts`).
- Produces: `ReimburseEntry` interface + `reimburseEntry: ReimburseEntry[]` (18 seed rows, one
  per active employee, ids `RB-01`..`RB-18`). `positionTitleFor(employeeId: string): string`
  now exported from `payroll-row.ts` for reuse by Tasks 5–7 (previously private — this is the
  same lookup Data Gaji already uses for its own "Karyawan" display, just made reusable).

- [ ] **Step 1: Export `positionTitleFor`**

In `app/Modules/Payroll/resources/js/lib/payroll-row.ts`, change line 20 from:

```ts
function positionTitleFor(employeeId: string): string {
```

to:

```ts
export function positionTitleFor(employeeId: string): string {
```

No other change to that file.

- [ ] **Step 2: Write the seed data file**

Create `resources/js/data/Payroll/reimburseEntry.ts`:

```ts
import { employee } from '@/data/Employee/employee';
import { branch, type Branch } from './branch';

export interface ReimburseEntry {
    id: string;
    employee_id: string;
    branch_id: string;
    tanggal_pengeluaran: string; // ISO date
    tanggal_reimburse: string; // ISO date
    keperluan: string;
    nominal: number;
    metode_bayar: 'tunai' | 'transfer';
    bukti: { name: string; type: string; dataUrl: string };
}

const KEPERLUAN = ['Print Berkas', 'Transportasi Klien', 'Makan Siang Tim', 'Beli ATK', 'Parkir & Tol', 'Konsumsi Rapat'];

function branchFor(index: number): Branch {
    return branch[index % branch.length];
}

function pad(day: number): string {
    return String(day).padStart(2, '0');
}

const activeEmployees = employee.filter((e) => e.is_active);

export const reimburseEntry: ReimburseEntry[] = activeEmployees.map((emp, index) => {
    const pengeluaranDay = 1 + (index % 27);
    const reimburseDay = Math.min(pengeluaranDay + 2, 28);

    return {
        id: `RB-${pad(index + 1)}`,
        employee_id: emp.id,
        branch_id: branchFor(index).id,
        tanggal_pengeluaran: `2026-07-${pad(pengeluaranDay)}`,
        tanggal_reimburse: `2026-07-${pad(reimburseDay)}`,
        keperluan: KEPERLUAN[index % KEPERLUAN.length],
        nominal: 50_000 + (index % 6) * 25_000,
        metode_bayar: index % 2 === 0 ? 'tunai' : 'transfer',
        bukti: { name: 'bukti-pembayaran.jpg', type: 'image/jpeg', dataUrl: '' },
    };
});
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Lint**

Run: `npx eslint resources/js/data/Payroll/reimburseEntry.ts app/Modules/Payroll/resources/js/lib/payroll-row.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add resources/js/data/Payroll/reimburseEntry.ts app/Modules/Payroll/resources/js/lib/payroll-row.ts
git commit -m "feat(payroll): add dummy Reimburse seed data"
```

---

### Task 3: localStorage overlay for Reimburse

**Files:**
- Create: `app/Modules/Payroll/resources/js/lib/reimburse-storage.ts`

**Interfaces:**
- Consumes: `ReimburseEntry`, `reimburseEntry` from Task 2.
- Produces: `loadReimburseEntries(): ReimburseEntry[]`,
  `createReimburseEntry(data: Omit<ReimburseEntry, 'id'>): ReimburseEntry`,
  `updateReimburseEntry(id: string, patch: Partial<ReimburseEntry>): void`,
  `deleteReimburseEntry(id: string): void` — consumed by Tasks 6 and 8.

- [ ] **Step 1: Write the storage overlay**

Create `app/Modules/Payroll/resources/js/lib/reimburse-storage.ts`:

```ts
import { type ReimburseEntry, reimburseEntry } from '@/data/Payroll/reimburseEntry';

const REIMBURSE_OVERRIDES_KEY = 'hexaris.payroll.reimburse.overrides';
const REIMBURSE_CREATED_KEY = 'hexaris.payroll.reimburse.created';
const REIMBURSE_DELETED_KEY = 'hexaris.payroll.reimburse.deleted';

function loadObjectJson<T extends object>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as T) : fallback;
    } catch {
        return fallback;
    }
}

function loadArrayJson<T>(key: string, fallback: T[]): T[] {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as T[]) : fallback;
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

function loadOverrides(): Record<string, Partial<ReimburseEntry>> {
    return loadObjectJson<Record<string, Partial<ReimburseEntry>>>(REIMBURSE_OVERRIDES_KEY, {});
}

function loadCreated(): ReimburseEntry[] {
    return loadArrayJson<ReimburseEntry>(REIMBURSE_CREATED_KEY, []);
}

function loadDeletedIds(): string[] {
    return loadArrayJson<string>(REIMBURSE_DELETED_KEY, []);
}

/** Seed rows (with any saved override applied) plus locally-created rows, minus deleted ids — the single source every Reimburse page/dialog reads from. */
export function loadReimburseEntries(): ReimburseEntry[] {
    const overrides = loadOverrides();
    const deleted = loadDeletedIds();
    const seeded = reimburseEntry.map((r) => ({ ...r, ...overrides[r.id] }));
    return [...seeded, ...loadCreated()].filter((r) => !deleted.includes(r.id));
}

/** Edit path for a seed entry — never mutates reimburseEntry.ts, only this overlay. */
function saveOverride(id: string, patch: Partial<ReimburseEntry>): void {
    const overrides = loadOverrides();
    saveJson(REIMBURSE_OVERRIDES_KEY, { ...overrides, [id]: { ...overrides[id], ...patch } });
}

/** Edit path for a locally-created entry — replaces it in place in the created list. */
function updateCreated(id: string, patch: Partial<ReimburseEntry>): void {
    const created = loadCreated();
    saveJson(
        REIMBURSE_CREATED_KEY,
        created.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
}

/** Dispatches to the override overlay or the created-list, whichever owns this id. */
export function updateReimburseEntry(id: string, patch: Partial<ReimburseEntry>): void {
    if (loadCreated().some((r) => r.id === id)) {
        updateCreated(id, patch);
    } else {
        saveOverride(id, patch);
    }
}

// Monotonic: counts every entry ever created (ignoring the deleted-ids filter
// loadReimburseEntries applies), so a new id never repeats a prior one even after some rows
// have been deleted.
function nextReimburseId(): string {
    const next = reimburseEntry.length + loadCreated().length + 1;
    return `RB-${String(next).padStart(2, '0')}`;
}

export function createReimburseEntry(data: Omit<ReimburseEntry, 'id'>): ReimburseEntry {
    const created: ReimburseEntry = { ...data, id: nextReimburseId() };
    saveJson(REIMBURSE_CREATED_KEY, [...loadCreated(), created]);
    return created;
}

export function deleteReimburseEntry(id: string): void {
    const deleted = loadDeletedIds();
    if (!deleted.includes(id)) {
        saveJson(REIMBURSE_DELETED_KEY, [...deleted, id]);
    }
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx eslint app/Modules/Payroll/resources/js/lib/reimburse-storage.ts`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/lib/reimburse-storage.ts
git commit -m "feat(payroll): add the localStorage overlay for Reimburse"
```

---

### Task 4: Nav entry

**Files:**
- Modify: `resources/js/lib/navigation.ts`
- Create (commit only — file already exists untracked): `resources/js/assets/icons/nav-reimburse.png`

**Interfaces:**
- Produces: sidebar entry "Reimburse" → `/payroll/reimburse`, third child of "Penggajian".

- [ ] **Step 1: Import the icon and add the nav node**

In `resources/js/lib/navigation.ts`, add this import alongside the other `nav*` imports (keep
alphabetical order — after `navPerformance`, before `navShift`):

```ts
import navReimburse from '@/assets/icons/nav-reimburse.png';
```

Then change the `Penggajian` node's `children` array from:

```ts
        children: [
            { title: 'Data Gaji', url: '/payroll/data', iconSrc: navPayrollData, inSidebar: true },
            { title: 'Pengaturan Gaji', url: '/payroll/settings', iconSrc: navPayrollSettings, inSidebar: true },
        ],
```

to:

```ts
        children: [
            { title: 'Data Gaji', url: '/payroll/data', iconSrc: navPayrollData, inSidebar: true },
            { title: 'Pengaturan Gaji', url: '/payroll/settings', iconSrc: navPayrollSettings, inSidebar: true },
            { title: 'Reimburse', url: '/payroll/reimburse', iconSrc: navReimburse, inSidebar: true },
        ],
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors (the icon file already exists on disk, untracked — this step just wires
the existing asset in).

Run: `npx eslint resources/js/lib/navigation.ts`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/navigation.ts resources/js/assets/icons/nav-reimburse.png
git commit -m "feat(payroll): add the Reimburse sidebar entry"
```

---

### Task 5: Reimburse table columns

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/reimburse/reimburse-columns.tsx`

**Interfaces:**
- Consumes: `ReimburseEntry` (Task 2), `positionTitleFor` (Task 2's export from
  `payroll-row.ts`), `Column<T>` from `@/components/data-table`.
- Produces: `buildReimburseColumns(onEdit: (row: ReimburseEntry) => void, onDelete: (row:
  ReimburseEntry) => void, onViewBukti: (row: ReimburseEntry) => void):
  Column<ReimburseEntry>[]` — consumed by Task 8.

- [ ] **Step 1: Write the columns file**

Create `app/Modules/Payroll/resources/js/pages/reimburse/reimburse-columns.tsx`:

```tsx
import { type Column } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { employee } from '@/data/Employee/employee';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import { MoreVertical } from 'lucide-react';
import { positionTitleFor } from '../../lib/payroll-row';

const METODE_LABEL: Record<ReimburseEntry['metode_bayar'], string> = { tunai: 'Tunai', transfer: 'Transfer' };

function karyawanLabel(employeeId: string): string {
    const emp = employee.find((e) => e.id === employeeId);
    if (!emp) return '-';
    const position = positionTitleFor(employeeId);
    return position === '-' ? emp.full_name : `${emp.full_name} ${position}`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRupiah(nominal: number): string {
    return `Rp. ${nominal.toLocaleString('id-ID')}`;
}

export function buildReimburseColumns(
    onEdit: (row: ReimburseEntry) => void,
    onDelete: (row: ReimburseEntry) => void,
    onViewBukti: (row: ReimburseEntry) => void,
): Column<ReimburseEntry>[] {
    return [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'karyawan', label: 'Karyawan', render: (row) => karyawanLabel(row.employee_id) },
        { key: 'tanggal_pengeluaran', label: 'Tgl Pengeluaran', sortable: true, render: (row) => formatDate(row.tanggal_pengeluaran) },
        { key: 'tanggal_reimburse', label: 'Tgl Reimburse', sortable: true, render: (row) => formatDate(row.tanggal_reimburse) },
        { key: 'keperluan', label: 'Keperluan' },
        { key: 'nominal', label: 'Nominal', sortable: true, render: (row) => formatRupiah(row.nominal) },
        { key: 'metode_bayar', label: 'Met. Bayar', render: (row) => METODE_LABEL[row.metode_bayar] },
        {
            key: 'bukti',
            label: 'Bukti',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => onViewBukti(row)}
                    className="font-poppins cursor-pointer text-xs font-semibold text-[#1980C0]"
                >
                    Lihat Bukti
                </button>
            ),
        },
        {
            key: 'actions',
            label: '',
            align: 'right',
            cellClassName: 'border-l border-[#E7E7E7]',
            render: (row) => (
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <MoreVertical className="size-3.5 cursor-pointer text-[#1B1B1B]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[#E84A39] focus:text-[#E84A39]" onClick={() => onDelete(row)}>
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors (this file isn't imported anywhere yet, so it only self-checks).

Run: `npx eslint app/Modules/Payroll/resources/js/pages/reimburse/reimburse-columns.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/reimburse/reimburse-columns.tsx
git commit -m "feat(payroll): add Reimburse table columns with an inline action menu"
```

---

### Task 6: Tambah/Edit Reimburse dialog

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/reimburse/reimburse-form-dialog.tsx`

**Interfaces:**
- Consumes: `ReimburseEntry` (Task 2), `positionTitleFor` (Task 2), `createReimburseEntry`/
  `updateReimburseEntry` (Task 3), `TextField`/`SelectField`/`FileUploadField`/`StoredFile`/
  `fileToStoredFile`/`isStoredFile` (`@/components/form/form-field`, all pre-existing).
- Produces: `ReimburseFormDialog` component, props `{ open: boolean; onOpenChange: (open:
  boolean) => void; target: ReimburseEntry | null; defaultBranchId: string; onSaved: () => void
  }` — consumed by Task 8. `defaultBranchId` seeds a new entry's `branch_id` from the list
  page's currently-selected Cabang filter (there's no Cabang field in this dialog — it isn't in
  the reference screenshots, and the list's own filter is the natural default).

- [ ] **Step 1: Write the dialog**

Create `app/Modules/Payroll/resources/js/pages/reimburse/reimburse-form-dialog.tsx`:

```tsx
import { FileUploadField, SelectField, TextField, fileToStoredFile, isStoredFile, type StoredFile } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { positionTitleFor } from '../../lib/payroll-row';
import { createReimburseEntry, updateReimburseEntry } from '../../lib/reimburse-storage';

const METODE_OPTIONS = [
    { value: 'tunai', label: 'Tunai' },
    { value: 'transfer', label: 'Transfer' },
];

const EMPLOYEE_OPTIONS = employee
    .filter((e) => e.is_active)
    .map((e) => ({ value: e.id, label: `${e.full_name} - ${positionTitleFor(e.id)}` }));

function formatRupiahInput(digits: string): string {
    if (!digits) return '';
    return `Rp. ${Number(digits).toLocaleString('id-ID')}`;
}

interface FormState {
    employee_id: string;
    tanggal_pengeluaran: string;
    tanggal_reimburse: string;
    keperluan: string;
    nominal: string;
    metode_bayar: ReimburseEntry['metode_bayar'];
    bukti: File | StoredFile | null;
}

const EMPTY_FORM: FormState = {
    employee_id: '',
    tanggal_pengeluaran: '',
    tanggal_reimburse: '',
    keperluan: '',
    nominal: '',
    metode_bayar: 'tunai',
    bukti: null,
};

function toFormState(target: ReimburseEntry | null): FormState {
    if (!target) return EMPTY_FORM;
    return {
        employee_id: target.employee_id,
        tanggal_pengeluaran: target.tanggal_pengeluaran,
        tanggal_reimburse: target.tanggal_reimburse,
        keperluan: target.keperluan,
        nominal: formatRupiahInput(String(target.nominal)),
        metode_bayar: target.metode_bayar,
        bukti: target.bukti,
    };
}

interface ReimburseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: ReimburseEntry | null;
    defaultBranchId: string;
    onSaved: () => void;
}

export function ReimburseFormDialog({ open, onOpenChange, target, defaultBranchId, onSaved }: ReimburseFormDialogProps) {
    const [form, setForm] = useState<FormState>(() => toFormState(target));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) setForm(toFormState(target));
    }, [open, target]);

    const save = async () => {
        setSaving(true);
        const bukti: StoredFile = form.bukti
            ? isStoredFile(form.bukti)
                ? form.bukti
                : await fileToStoredFile(form.bukti)
            : { name: '', type: '', dataUrl: '' };
        const nominal = Number(form.nominal.replace(/\D/g, '')) || 0;
        const patch = {
            employee_id: form.employee_id,
            tanggal_pengeluaran: form.tanggal_pengeluaran,
            tanggal_reimburse: form.tanggal_reimburse,
            keperluan: form.keperluan,
            nominal,
            metode_bayar: form.metode_bayar,
            bukti,
        };

        if (target) {
            updateReimburseEntry(target.id, patch);
        } else {
            createReimburseEntry({ ...patch, branch_id: defaultBranchId });
        }

        setSaving(false);
        toast.success('Berhasil Disimpan');
        onSaved();
        onOpenChange(false);
    };

    const canSave =
        form.employee_id.length > 0 &&
        form.keperluan.trim().length > 0 &&
        form.tanggal_pengeluaran.length > 0 &&
        form.tanggal_reimburse.length > 0 &&
        form.bukti !== null &&
        !saving;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">
                        {target ? 'Edit Reimburse' : 'Tambah Reimburse'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    <SelectField
                        label="Karyawan"
                        htmlFor="employee_id"
                        required
                        placeholder="Pilih Karyawan"
                        value={form.employee_id}
                        onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
                        options={EMPLOYEE_OPTIONS}
                    />
                    <TextField
                        label="Keperluan"
                        htmlFor="keperluan"
                        required
                        placeholder="Masukkan Keperluan"
                        value={form.keperluan}
                        onChange={(v) => setForm((f) => ({ ...f, keperluan: v }))}
                    />
                    <TextField
                        label="Tgl Pengeluaran"
                        htmlFor="tanggal_pengeluaran"
                        required
                        type="date"
                        value={form.tanggal_pengeluaran}
                        onChange={(v) => setForm((f) => ({ ...f, tanggal_pengeluaran: v }))}
                    />
                    <TextField
                        label="Nominal"
                        htmlFor="nominal"
                        required
                        placeholder="Rp. 0"
                        value={form.nominal}
                        onChange={(v) => setForm((f) => ({ ...f, nominal: formatRupiahInput(v.replace(/\D/g, '')) }))}
                    />
                    <TextField
                        label="Tgl Reimburse"
                        htmlFor="tanggal_reimburse"
                        required
                        type="date"
                        value={form.tanggal_reimburse}
                        onChange={(v) => setForm((f) => ({ ...f, tanggal_reimburse: v }))}
                    />
                    <SelectField
                        label="Metode Bayar"
                        htmlFor="metode_bayar"
                        required
                        placeholder="Pilih Metode Bayar"
                        value={form.metode_bayar}
                        onValueChange={(v) => setForm((f) => ({ ...f, metode_bayar: v as ReimburseEntry['metode_bayar'] }))}
                        options={METODE_OPTIONS}
                    />
                    <div className="col-span-2">
                        <FileUploadField
                            label="Upload Bukti"
                            required
                            file={form.bukti}
                            onSelect={(f) => setForm((current) => ({ ...current, bukti: f }))}
                            onRemove={() => setForm((current) => ({ ...current, bukti: null }))}
                            accept="image/*,.pdf"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={save} disabled={!canSave}>
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx eslint app/Modules/Payroll/resources/js/pages/reimburse/reimburse-form-dialog.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/reimburse/reimburse-form-dialog.tsx
git commit -m "feat(payroll): add the Tambah/Edit Reimburse dialog"
```

---

### Task 7: Bukti Reimburse viewer dialog

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/reimburse/reimburse-bukti-dialog.tsx`

**Interfaces:**
- Consumes: `ReimburseEntry` (Task 2), `positionTitleFor` (Task 2), `employee`
  (`@/data/Employee/employee`), `employeeAssignment` (`@/data/Employee/employeeAssignment`),
  `organization` (`@/data/Organization/organization`).
- Produces: `ReimburseBuktiDialog` component, props `{ open: boolean; onOpenChange: (open:
  boolean) => void; entry: ReimburseEntry | null }` — consumed by Task 8.

- [ ] **Step 1: Write the dialog**

Create `app/Modules/Payroll/resources/js/pages/reimburse/reimburse-bukti-dialog.tsx`:

```tsx
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { organization } from '@/data/Organization/organization';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import { Download } from 'lucide-react';
import { positionTitleFor } from '../../lib/payroll-row';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRupiah(nominal: number): string {
    return `Rp. ${nominal.toLocaleString('id-ID')}`;
}

function departmentFor(employeeId: string): string {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId && a.is_active);
    if (!assignment) return '-';
    return organization.find((o) => o.id === assignment.organization_unit_id)?.name ?? '-';
}

interface ReimburseBuktiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: ReimburseEntry | null;
}

export function ReimburseBuktiDialog({ open, onOpenChange, entry }: ReimburseBuktiDialogProps) {
    if (!entry) return null;

    const emp = employee.find((e) => e.id === entry.employee_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Bukti Reimburse</DialogTitle>
                <div className="flex flex-col gap-4 font-poppins text-sm text-[#121212]">
                    <p className="text-center text-lg font-bold uppercase">Form Reimbursement</p>
                    <p>Tanggal: {formatDate(entry.tanggal_reimburse)}</p>
                    <div className="flex flex-col gap-1">
                        <p>Nama Karyawan: {emp?.full_name ?? '-'}</p>
                        <p>Nomor ID Karyawan: {emp?.employee_number ?? '-'}</p>
                        <p>Departemen: {departmentFor(entry.employee_id)}</p>
                        <p>Jabatan: {positionTitleFor(entry.employee_id)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-semibold">Rincian Pengeluaran:</p>
                        <table className="w-full border border-[#E7E7E7] text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#E7E7E7]">
                                    <th className="border-r border-[#E7E7E7] p-2">No.</th>
                                    <th className="border-r border-[#E7E7E7] p-2">Deskripsi Pengeluaran</th>
                                    <th className="border-r border-[#E7E7E7] p-2">Tanggal</th>
                                    <th className="border-r border-[#E7E7E7] p-2">Jumlah (Rp)</th>
                                    <th className="p-2">Bukti Pembayaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border-r border-[#E7E7E7] p-2">1.</td>
                                    <td className="border-r border-[#E7E7E7] p-2">{entry.keperluan}</td>
                                    <td className="border-r border-[#E7E7E7] p-2">{formatDate(entry.tanggal_pengeluaran)}</td>
                                    <td className="border-r border-[#E7E7E7] p-2">{entry.nominal.toLocaleString('id-ID')}</td>
                                    <td className="p-2">{entry.bukti.name || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="font-semibold">Total Pengeluaran: {formatRupiah(entry.nominal)}</p>
                    <a
                        href={entry.bukti.dataUrl || undefined}
                        download={entry.bukti.name || undefined}
                        aria-disabled={!entry.bukti.dataUrl}
                        className="font-poppins flex w-full items-center justify-center gap-2 rounded-lg border border-[#1980C0] py-3 text-sm font-semibold text-[#1980C0] aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    >
                        <Download className="size-4" />
                        Download
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
}
```

Note: seed rows carry an empty `dataUrl` (see Task 2), so the Download link is disabled
(`aria-disabled`, dimmed, unclickable) for seed data — a row created/edited through the app with
a real uploaded file gets a real `dataUrl` and a working Download link.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx eslint app/Modules/Payroll/resources/js/pages/reimburse/reimburse-bukti-dialog.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/reimburse/reimburse-bukti-dialog.tsx
git commit -m "feat(payroll): add the Bukti Reimburse viewer dialog"
```

---

### Task 8: Reimburse list page — wire everything together

**Files:**
- Create: `app/Modules/Payroll/resources/js/pages/Reimburse.tsx`

**Interfaces:**
- Consumes: `buildReimburseColumns` (Task 5), `ReimburseFormDialog` (Task 6),
  `ReimburseBuktiDialog` (Task 7), `loadReimburseEntries`/`deleteReimburseEntry` (Task 3),
  `branch` (`@/data/Payroll/branch`), `DataTable` (`@/components/data-table`), `ConfirmDialog`
  (`@/components/confirm-dialog`).
- Produces: default-exported `Reimburse` page component, rendered by the
  `Payroll::pages/Reimburse` route from Task 1.

- [ ] **Step 1: Write the page**

Create `app/Modules/Payroll/resources/js/pages/Reimburse.tsx`:

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { branch } from '@/data/Payroll/branch';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import AppLayout from '@/layouts/app-layout';
import { Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteReimburseEntry, loadReimburseEntries } from '../lib/reimburse-storage';
import { ReimburseBuktiDialog } from './reimburse/reimburse-bukti-dialog';
import { buildReimburseColumns } from './reimburse/reimburse-columns';
import { ReimburseFormDialog } from './reimburse/reimburse-form-dialog';

export default function Reimburse() {
    const [entries, setEntries] = useState<ReimburseEntry[]>(loadReimburseEntries);
    const [branchFilter, setBranchFilter] = useState(branch[0].id);
    const [searchValue, setSearchValue] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [formTarget, setFormTarget] = useState<ReimburseEntry | null>(null);
    const [buktiTarget, setBuktiTarget] = useState<ReimburseEntry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ReimburseEntry | null>(null);

    const refresh = useCallback(() => setEntries(loadReimburseEntries()), []);

    const tableRows = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        return entries.filter((e) => e.branch_id === branchFilter).filter((e) => !query || e.keperluan.toLowerCase().includes(query));
    }, [entries, branchFilter, searchValue]);

    const openCreate = () => {
        setFormTarget(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((row: ReimburseEntry) => {
        setFormTarget(row);
        setFormOpen(true);
    }, []);

    const onDelete = useCallback((row: ReimburseEntry) => setDeleteTarget(row), []);
    const onViewBukti = useCallback((row: ReimburseEntry) => setBuktiTarget(row), []);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        deleteReimburseEntry(deleteTarget.id);
        refresh();
        toast.success('Berhasil Disimpan');
        setDeleteTarget(null);
    };

    const columns = buildReimburseColumns(openEdit, onDelete, onViewBukti);

    return (
        <AppLayout>
            <div className="flex flex-col items-start gap-[19px] p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[175px] border-[#ACACAC] bg-[#FAFBFD] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {branch.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        Cabang: {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative w-[244px]">
                            <Search className="absolute top-2.5 left-3 size-4 text-black" />
                            <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search" className="pl-9" />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="font-poppins flex cursor-pointer items-center gap-2 rounded-lg border border-[#1980C0] bg-[#1980C0] px-4 py-2 text-xs text-white"
                    >
                        <Plus className="size-4" />
                        Reimburse
                    </button>
                </div>

                <DataTable columns={columns} data={tableRows} variant="design-system" />
            </div>

            <ReimburseFormDialog open={formOpen} onOpenChange={setFormOpen} target={formTarget} defaultBranchId={branchFilter} onSaved={refresh} />

            <ReimburseBuktiDialog open={buktiTarget !== null} onOpenChange={(open) => !open && setBuktiTarget(null)} entry={buktiTarget} />

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus Reimburse?"
                description="Anda akan menghapus data Reimburse ini secara permanen. Tindakan ini tidak dapat dibatalkan dan seluruh informasi terkait akan hilang."
                confirmLabel="Hapus"
                cancelLabel="Batal"
            />
        </AppLayout>
    );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors anywhere in the project.

Run: `npx eslint app/Modules/Payroll/resources/js/pages/Reimburse.tsx`
Expected: no errors.

- [ ] **Step 3: Run the backend test from Task 1 again**

Run: `./vendor/bin/pest tests/Feature/Payroll/PayrollReimburseTest.php`
Expected: PASS — now with a real page behind the route.

- [ ] **Step 4: Run the full gate**

Run: `composer check`
Expected: Pint, PHPStan, Pest all green.

Run: `npm run build`
Expected: Vite build succeeds.

- [ ] **Step 5: Manual smoke check**

Since no browser-automation tool is available in this environment, do an authenticated `curl`
smoke test (login via the CSRF cookie dance, then request the route) and confirm HTTP 200 with
Inertia `data-page` component `"Payroll::pages/Reimburse"` — matching the smoke-test approach
already used for `/payroll/settings` and `/payroll/data`. If a real browser is available to the
human reviewer, ask them to click through: list renders, Cabang filter narrows rows, Search
filters by Keperluan, "+ Reimburse" opens the create dialog and a new row appears in the table
after Simpan, "Lihat Bukti" opens the Bukti Reimburse dialog with that row's data, the 3-dot
menu's Edit re-opens the dialog pre-filled, and Hapus removes the row after confirming.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Payroll/resources/js/pages/Reimburse.tsx
git commit -m "feat(payroll): wire the Reimburse list page (filter, search, CRUD, bukti viewer)"
```
