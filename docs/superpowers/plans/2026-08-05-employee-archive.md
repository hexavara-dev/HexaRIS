# Employee Archive (Soft-Hide) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a row's "Arsipkan" action set `is_archived: true` on that employee (confirmed via
a dialog first), and hide archived employees from the entire Employee management page — table
and overview stats alike — without deleting their data.

**Architecture:** Frontend-only. `Employee` gains `is_archived: boolean` (seed fixtures default
`false`, wizard-created employees default `false`). `Index.tsx`'s single merged `allEmployees`
array gets one added filter, so every downstream view (table rows, "Aktif/Non Aktif/Baru"
counts) is automatically consistent. Archiving reuses the exact seed-override-vs-local-update
branch the wizard's own edit path already uses — no new storage function.

**Tech Stack:** React + TypeScript, `localStorage` mock persistence. No backend changes, no PHP,
no new routes.

## Global Constraints

- No backend changes of any kind — `Employee` stays a frontend/localStorage mock.
- Every task must end with `npx tsc --noEmit` showing no new errors.
- The final state of the whole plan must pass `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` — this repo has no JS/TS unit test runner, so "tests" for frontend logic in
  this plan means `tsc` type-checking plus a manual/browser verification task, not automated
  unit tests.
- No restore/unarchive UI and no "show archived" filter — explicitly out of scope per the spec.
- This branch forked from `main` **before** the separate, still-unmerged Employee Detail dialog
  PR — `buildEmployeeColumns` here only has an `onEdit` parameter today, and the "Detail"
  dropdown item is still its pre-existing placeholder (`toast.info(...)`). Do not touch it.
- Spec: `docs/superpowers/specs/2026-08-05-employee-archive-design.md` — read it if any task
  here seems to contradict it; this plan should match it exactly.

---

### Task 1: `is_archived` on the `Employee` type, seed fixtures, and wizard-created default

**Files:**
- Modify: `resources/js/data/Employee/employee.ts`
- Modify: `app/Modules/Employee/resources/js/lib/employee-storage.ts:43-63`

**Interfaces:**
- Produces: `Employee.is_archived: boolean` — every seed fixture and every wizard-created
  employee has this field set to `false`. Used by Task 2 (filtering) and Task 5 (the archive
  action's target patch).

- [ ] **Step 1: Add the field to the `Employee` interface**

Open `resources/js/data/Employee/employee.ts`. Find:

```ts
    is_active: boolean;
    company_id: string;
}
```

Replace with:

```ts
    is_active: boolean;
    /** Soft-hide flag — archived employees are excluded from the management list but never deleted. */
    is_archived: boolean;
    company_id: string;
}
```

- [ ] **Step 2: Default every seed fixture to `false`**

In the same file, every one of the 20 employee objects in the `employee` array ends with this
exact two-line pattern (verify by searching — it appears 20 times, identical each time):

```ts
        company_id: COMPANY_ID,
    },
```

Replace **every occurrence** with:

```ts
        company_id: COMPANY_ID,
        is_archived: false,
    },
```

(Use a find-and-replace-all across the file — the pattern is byte-identical at all 20 sites, so
a single "replace all" operation is correct and safe here.)

- [ ] **Step 3: Default wizard-created employees to `false`**

Open `app/Modules/Employee/resources/js/lib/employee-storage.ts`. Find, inside
`buildEmployeeFromForm`:

```ts
        nationality: 'WNI',
        is_active: true,
        company_id: COMPANY_ID,
        ...wizardEditableFields(data),
```

Replace with:

```ts
        nationality: 'WNI',
        is_active: true,
        is_archived: false,
        company_id: COMPANY_ID,
        ...wizardEditableFields(data),
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (This is additive — nothing reads `is_archived` yet, so no downstream file
should break.)

- [ ] **Step 5: Commit**

```bash
git add resources/js/data/Employee/employee.ts app/Modules/Employee/resources/js/lib/employee-storage.ts
git commit -m "feat(employee): add is_archived flag, defaulting to false"
```

---

### Task 2: Filter archived employees out of the management page

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/Index.tsx:58-61`

**Interfaces:**
- Consumes: `Employee.is_archived` from Task 1.
- Produces: no new exports — `allEmployees` (already the single source every view on this page
  reads from) now excludes archived employees.

- [ ] **Step 1: Add the filter**

Open `app/Modules/Employee/resources/js/pages/Index.tsx`. Find:

```ts
    const allEmployees = useMemo(
        () => [...employee.map((e) => ({ ...e, ...overrides[e.id] })), ...localEmployees],
        [overrides, localEmployees],
    );
```

Replace with:

```ts
    const allEmployees = useMemo(
        () => [...employee.map((e) => ({ ...e, ...overrides[e.id] })), ...localEmployees].filter((e) => !e.is_archived),
        [overrides, localEmployees],
    );
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/pages/Index.tsx
git commit -m "feat(employee): hide archived employees from the management page"
```

---

### Task 3: `ArchiveConfirmDialog` component

**Files:**
- Create: `app/Modules/Employee/resources/js/components/archive-confirm-dialog.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription` from
  `@/components/ui/dialog`; `Button` from `@/components/ui/button`.
- Produces: `ArchiveConfirmDialog({ employeeName, open, onOpenChange, onConfirm }: { employeeName: string; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void })`
  — used by Task 5's `Index.tsx`.

- [ ] **Step 1: Create the component**

Create `app/Modules/Employee/resources/js/components/archive-confirm-dialog.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface ArchiveConfirmDialogProps {
    employeeName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

/**
 * Module-styled, not the shared destructive-red confirm-dialog.tsx — archiving is explicitly
 * non-destructive (the employee's data is only hidden, never deleted), so it borrows the same
 * blue button classes StepForm already uses for this module instead of reading as alarming.
 */
export function ArchiveConfirmDialog({ employeeName, open, onOpenChange, onConfirm }: ArchiveConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">Arsipkan Karyawan?</DialogTitle>
                <DialogDescription className="font-poppins text-sm text-[#4F4F4F]">
                    Kamu yakin ingin mengarsipkan {employeeName}? Semua data yang sebelumnya terkait tidak lagi terhubung dengan karyawan ini.
                </DialogDescription>
                <div className="flex items-center gap-4 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white hover:bg-[#1668a0]"
                    >
                        Arsipkan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive — nothing imports this component yet).

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/components/archive-confirm-dialog.tsx
git commit -m "feat(employee): add module-styled ArchiveConfirmDialog"
```

---

### Task 4: Wire "Arsipkan" in `columns.tsx`

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/columns.tsx:40,66-71`

**Interfaces:**
- Produces: `buildEmployeeColumns(onEdit: (employee: Employee) => void, onArchive: (employee: Employee) => void): Column<Employee>[]`
  — same name, one more required parameter. Used by Task 5's `Index.tsx`.

- [ ] **Step 1: Add the `onArchive` parameter**

Open `app/Modules/Employee/resources/js/pages/columns.tsx`. Find:

```ts
export function buildEmployeeColumns(onEdit: (employee: Employee) => void): Column<Employee>[] {
```

Replace with:

```ts
export function buildEmployeeColumns(onEdit: (employee: Employee) => void, onArchive: (employee: Employee) => void): Column<Employee>[] {
```

- [ ] **Step 2: Wire the "Arsipkan" item**

In the same file, find:

```tsx
                        <DropdownMenuItem
                            className="text-[#E84A39] focus:text-[#E84A39] text-red-500"
                            onClick={() => toast.info('Hapus karyawan belum tersambung ke backend.')}
                        >
                            Arsipkan
                        </DropdownMenuItem>
```

Replace with:

```tsx
                        <DropdownMenuItem className="text-[#E84A39] focus:text-[#E84A39] text-red-500" onClick={() => onArchive(row)}>
                            Arsipkan
                        </DropdownMenuItem>
```

(The `toast` import stays — the "Detail" item above it still calls `toast.info(...)`, untouched
by this plan.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: **one error**, in `Index.tsx` — `buildEmployeeColumns` is called there with only one
argument (`openEdit`). This is expected; Task 5 fixes it. Confirm the error is exactly that
(a missing-argument error pointing at `Index.tsx`'s `buildEmployeeColumns(openEdit)` call) and
nothing else — if there's any other error, stop and investigate before continuing.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Employee/resources/js/pages/columns.tsx
git commit -m "feat(employee): wire the Arsipkan row action to a callback"
```

---

### Task 5: Wire the confirm dialog and archive action into `Index.tsx`

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/Index.tsx`

**Interfaces:**
- Consumes: `buildEmployeeColumns(onEdit, onArchive)` from Task 4; `ArchiveConfirmDialog` from
  Task 3; `Employee.is_archived` from Task 1.
- Produces: no new exports — this is the final wiring task. Resolves the expected `tsc` error
  left by Task 4.

- [ ] **Step 1: Import `ArchiveConfirmDialog`**

Open `app/Modules/Employee/resources/js/pages/Index.tsx`. Find:

```ts
import { buildEmployeeColumns } from './columns';
```

Replace with:

```ts
import { ArchiveConfirmDialog } from '../components/archive-confirm-dialog';
import { buildEmployeeColumns } from './columns';
```

- [ ] **Step 2: Add `archiveTarget` state**

Find:

```ts
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
```

Add right after it:

```ts
    const [archiveTarget, setArchiveTarget] = useState<Employee | null>(null);
```

- [ ] **Step 3: Add `onArchive` and `confirmArchive`, and update the `columns` memo**

Find:

```ts
    const columns = useMemo(() => buildEmployeeColumns(openEdit), [openEdit]);
```

Replace with:

```ts
    const onArchive = useCallback((row: Employee) => setArchiveTarget(row), []);

    const confirmArchive = () => {
        if (!archiveTarget) return;
        if (localEmployees.some((e) => e.id === archiveTarget.id)) {
            setLocalEmployees(updateLocalEmployee(archiveTarget.id, { ...archiveTarget, is_archived: true }));
        } else {
            setOverrides(saveEmployeeOverride(archiveTarget.id, { is_archived: true }));
        }
        toast.success(`${archiveTarget.full_name} berhasil diarsipkan.`);
        setArchiveTarget(null);
    };

    const columns = useMemo(() => buildEmployeeColumns(openEdit, onArchive), [openEdit, onArchive]);
```

- [ ] **Step 4: Render the dialog**

Find the end of the component's JSX:

```tsx
                />
            </div>
        </AppLayout>
    );
}
```

Replace with:

```tsx
                />

                <ArchiveConfirmDialog
                    employeeName={archiveTarget?.full_name ?? ''}
                    open={archiveTarget !== null}
                    onOpenChange={(open) => !open && setArchiveTarget(null)}
                    onConfirm={confirmArchive}
                />
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors — this resolves the one error Task 4 left.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Employee/resources/js/pages/Index.tsx
git commit -m "feat(employee): wire the archive confirm dialog into the management page"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full frontend gate**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three exit 0. (`npm run lint` may still report failures from a pre-existing,
unrelated stray `.worktrees/` checkout if one is present in this checkout — confirm any
failures are not in a file this plan touched before treating the gate as green.)

- [ ] **Step 2: Manual browser verification**

Start the app (`php artisan serve` and `npm run dev` in separate terminals, or your usual local
setup) and in the browser:

1. Go to `/employees`. Note the current row count and the "Total Karyawan Aktif" /
   "Karyawan Non Aktif" numbers.
2. Click a row's `⋮` menu → **Arsipkan**. Confirm the dialog opens with the blue-styled
   "Arsipkan Karyawan?" title, the description naming that employee, and "Batal"/"Arsipkan"
   buttons matching the wizard's own button style.
3. Click **Batal** — confirm the dialog closes and the row is still present, unchanged.
4. Click **⋮ → Arsipkan** again, then click **Arsipkan** to confirm. Confirm: a success toast
   appears, the row disappears from the table, and the overview stats update (total count and
   Aktif/Non Aktif both drop if that employee was counted).
5. Refresh the page. Confirm the archived employee stays hidden (the override/local-update
   persisted to `localStorage`).
6. Repeat step 2-4 on a **wizard-created** employee (add one via "Tambah Karyawan" first if none
   exist) to confirm the `localEmployees` branch of `confirmArchive` also works.

- [ ] **Step 3: No commit** — this task is verification only, nothing to stage.
