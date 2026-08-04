# Employee Edit Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a row's "Edit" action reopen the same 6-step `StepForm` wizard, pre-filled with
that employee's data, with the last-step button reading "Perbarui" and saving back instead of
creating a new record.

**Architecture:** Frontend-only. `Index.tsx` gains an `editingEmployee` state (`null` = create).
A new `hydrateEmployeeFormData()` fills the form from a localStorage "overlay" snapshot if one
exists, otherwise best-effort from the real seed fixtures (`resources/js/data/Employee/*.ts`).
Seed employees are never mutated — edits land in a separate override store merged at render
time. Files stay exactly as unpersisted as they are today; a small `FileFieldFlags` marker
(saved alongside the overlay) tells validation "this required file existed before" so editing
doesn't force re-uploading documents whose bytes were never actually kept anywhere.

**Tech Stack:** React + TypeScript, Inertia `useForm`, localStorage. No backend changes, no PHP,
no new routes.

## Global Constraints

- No backend changes of any kind in this feature (confirmed in the design doc, revised from an
  earlier draft) — no PHP routes, no migrations, no `Employee` model.
- Every task must end with `npx tsc --noEmit` showing no new errors.
- The final state of the whole plan must pass `npx tsc --noEmit`, `npx eslint` (or `npm run
  lint`), and `npm run build` — this repo has no JS/TS unit test runner (no vitest/jest
  configured), so "tests" for frontend logic in this plan means `tsc` type-checking plus the
  final manual/browser verification task, not automated unit tests.
- Spec: `docs/superpowers/specs/2026-08-03-employee-edit-wizard-design.md` — read it if any
  task here seems to contradict it; this plan should match it exactly.

---

### Task 1: `FileFieldFlags` type

**Files:**
- Modify: `app/Modules/Employee/resources/js/types/employee-form.ts`

**Interfaces:**
- Produces: `FileFieldFlags` type (`{ ktp: boolean; contract: boolean; educationCertificate: boolean }`) and `createEmptyFileFieldFlags(): FileFieldFlags`, both exported — used by Task 2 (validation), Task 4 (overlay), and Task 7 (`Index.tsx` state).

- [ ] **Step 1: Add the type and factory function**

Open `app/Modules/Employee/resources/js/types/employee-form.ts`. Add this right after the
`FieldErrors` type definition (after the block ending `export type FieldErrors = Partial<Record<string, string>>;`):

```ts
/**
 * Marks which *required* file fields already had something attached the last
 * time a save succeeded. `npwp` and each work experience's `reference_letter`
 * are optional already, so they need no flag — only required fields do.
 */
export type FileFieldFlags = {
    ktp: boolean;
    contract: boolean;
    educationCertificate: boolean;
};

export function createEmptyFileFieldFlags(): FileFieldFlags {
    return { ktp: false, contract: false, educationCertificate: false };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (this is an additive change, nothing consumes it yet).

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/types/employee-form.ts
git commit -m "feat(employee): add FileFieldFlags type for edit-mode file validation"
```

---

### Task 2: Validation accepts `FileFieldFlags`

**Files:**
- Modify: `app/Modules/Employee/resources/js/lib/validate-employee-form.ts`

**Interfaces:**
- Consumes: `FileFieldFlags`, `createEmptyFileFieldFlags` from Task 1.
- Produces: `validateEmployeeForm(data: EmployeeFormData, fileFlags?: FileFieldFlags): FieldErrors` — same name, now with a second optional parameter. Existing callers (none outside `Index.tsx`, which Task 7 updates) keep compiling since it's optional.

- [ ] **Step 1: Update the file**

Replace the full contents of `app/Modules/Employee/resources/js/lib/validate-employee-form.ts`
with:

```ts
import { createEmptyFileFieldFlags, type EmployeeFormData, type FieldErrors, type FileFieldFlags } from '../types/employee-form';

const REQUIRED_MESSAGE = 'Wajib diisi.';

function requireText(errors: FieldErrors, key: string, value: string) {
    if (!value.trim()) errors[key] = REQUIRED_MESSAGE;
}

function requireFile(errors: FieldErrors, key: string, value: File | null, hadBefore: boolean) {
    if (!value && !hadBefore) errors[key] = REQUIRED_MESSAGE;
}

/** Client-side stand-in for backend validation — there is no employees.store route yet. */
export function validateEmployeeForm(data: EmployeeFormData, fileFlags: FileFieldFlags = createEmptyFileFieldFlags()): FieldErrors {
    const errors: FieldErrors = {};

    requireText(errors, 'full_name', data.full_name);
    requireText(errors, 'phone_number', data.phone_number);
    requireText(errors, 'gender', data.gender);
    requireText(errors, 'religion', data.religion);
    requireText(errors, 'birth_date', data.birth_date);
    requireText(errors, 'province_id', data.province_id);
    requireText(errors, 'regency_id', data.regency_id);
    requireText(errors, 'address', data.address);
    requireFile(errors, 'ktp', data.ktp, fileFlags.ktp);
    requireFile(errors, 'contract', data.contract, fileFlags.contract);

    requireText(errors, 'education.level', data.education.level);
    requireText(errors, 'education.institution', data.education.institution);
    requireText(errors, 'education.major', data.education.major);
    requireText(errors, 'education.start_date', data.education.start_date);
    requireText(errors, 'education.end_date', data.education.end_date);
    requireText(errors, 'education.final_score', data.education.final_score);
    requireFile(errors, 'education.certificate', data.education.certificate, fileFlags.educationCertificate);

    data.work_experiences.forEach((experience, index) => {
        requireText(errors, `work_experiences.${index}.company_name`, experience.company_name);
        requireText(errors, `work_experiences.${index}.employment_type`, experience.employment_type);
        requireText(errors, `work_experiences.${index}.position`, experience.position);
        requireText(errors, `work_experiences.${index}.description`, experience.description);
        requireText(errors, `work_experiences.${index}.start_date`, experience.start_date);
        requireText(errors, `work_experiences.${index}.end_date`, experience.end_date);
    });

    requireText(errors, 'department_id', data.department_id);
    requireText(errors, 'division_id', data.division_id);
    requireText(errors, 'contract_type', data.contract_type);
    requireText(errors, 'join_date', data.join_date);

    requireText(errors, 'bank_name', data.bank_name);
    requireText(errors, 'basic_salary', data.basic_salary);
    requireText(errors, 'bank_account_holder', data.bank_account_holder);
    requireText(errors, 'bank_account_number', data.bank_account_number);

    return errors;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`Index.tsx` still calls `validateEmployeeForm(data)` with one argument at
this point — that's fine, the second parameter is optional.)

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/lib/validate-employee-form.ts
git commit -m "feat(employee): let file-required validation pass via FileFieldFlags"
```

---

### Task 3: `employee-storage.ts` — update path + seed overrides

**Files:**
- Modify: `app/Modules/Employee/resources/js/lib/employee-storage.ts`

**Interfaces:**
- Produces:
  - `applyFormDataToEmployee(existing: Employee, data: EmployeeFormData): Employee`
  - `saveLocalEmployee(data: EmployeeFormData): { employees: Employee[]; created: Employee }` — **return shape changed** from `Employee[]` to `{ employees, created }`. Task 7 is the only caller and is updated in this same plan.
  - `updateLocalEmployee(id: string, updated: Employee): Employee[]`
  - `loadEmployeeOverrides(): Record<string, Partial<Employee>>`
  - `saveEmployeeOverride(id: string, patch: Partial<Employee>): Record<string, Partial<Employee>>`

- [ ] **Step 1: Replace the file**

Replace the full contents of `app/Modules/Employee/resources/js/lib/employee-storage.ts` with:

```ts
import { COMPANY_ID, employee, type Employee } from '@/data/Employee/employee';
import { type EmployeeFormData } from '../types/employee-form';

const STORAGE_KEY = 'hexaris.employee.local-records';
const OVERRIDES_STORAGE_KEY = 'hexaris.employee.overrides';

export function loadLocalEmployees(): Employee[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as Employee[]) : [];
    } catch {
        return [];
    }
}

function nextEmployeeNumber(existingCount: number): string {
    return `EMP-${String(existingCount + 1).padStart(4, '0')}`;
}

/**
 * The wizard doesn't collect every Employee column (no photo, birth place,
 * blood type, email, NIK, NPWP, work arrangement, ...) — those fall back to
 * reasonable defaults here rather than being left undefined, since Employee
 * itself has no optional/nullable slot for most of them.
 */
function buildEmployeeFromForm(data: EmployeeFormData, existingCount: number): Employee {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        employee_number: nextEmployeeNumber(existingCount),
        profile_picture_path: null,
        identity_number: '-',
        npwp_number: null,
        full_name: data.full_name,
        birth_place: '-',
        birth_date: data.birth_date,
        gender: data.gender as Employee['gender'],
        religion: data.religion as Employee['religion'],
        is_married: data.is_married,
        blood_type: 'O',
        email_company: null,
        email_self: '-',
        phone_number: data.phone_number,
        join_date: data.join_date,
        employment_type: data.contract_type === 'permanent' ? 'full-time' : 'part-time',
        work_arrangement: 'onsite',
        work_location_type: 'center',
        time_off_amount: 12,
        nationality: 'WNI',
        is_active: true,
        company_id: COMPANY_ID,
    };
}

/**
 * Applies wizard-editable fields onto an existing Employee — used when
 * updating, so identity columns (id, employee_number, NIK, email, ...) that
 * the wizard doesn't collect are preserved untouched instead of being reset
 * to buildEmployeeFromForm's create-time placeholders.
 */
export function applyFormDataToEmployee(existing: Employee, data: EmployeeFormData): Employee {
    return {
        ...existing,
        full_name: data.full_name,
        phone_number: data.phone_number,
        gender: data.gender as Employee['gender'],
        religion: data.religion as Employee['religion'],
        birth_date: data.birth_date,
        is_married: data.is_married,
        join_date: data.join_date,
        employment_type: data.contract_type === 'permanent' ? 'full-time' : 'part-time',
    };
}

/**
 * Appends the submitted form as a new Employee to localStorage. Returns both
 * the full merged list and the created record — the caller needs the
 * record's id to key the form overlay (see employee-form-overlay.ts).
 */
export function saveLocalEmployee(data: EmployeeFormData): { employees: Employee[]; created: Employee } {
    const local = loadLocalEmployees();
    const created = buildEmployeeFromForm(data, employee.length + local.length);
    const employees = [...local, created];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));

    return { employees, created };
}

/** Replaces a wizard-created employee's record in place — the edit path for non-seed employees. */
export function updateLocalEmployee(id: string, updated: Employee): Employee[] {
    const local = loadLocalEmployees();
    const employees = local.map((e) => (e.id === id ? updated : e));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return employees;
}

export function loadEmployeeOverrides(): Record<string, Partial<Employee>> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(OVERRIDES_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, Partial<Employee>>) : {};
    } catch {
        return {};
    }
}

/** Edit path for seed employees — never mutates the imported seed array, only this overlay, merged at render time in Index.tsx. */
export function saveEmployeeOverride(id: string, patch: Partial<Employee>): Record<string, Partial<Employee>> {
    const overrides = loadEmployeeOverrides();
    const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(next));
    return next;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: **errors in `Index.tsx`** — it still calls `setLocalEmployees(saveLocalEmployee(data))`
expecting an `Employee[]` return. This is expected; Task 7 fixes `Index.tsx`. Confirm the error
is specifically about `saveLocalEmployee`'s new return shape in `Index.tsx`, not something else.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/lib/employee-storage.ts
git commit -m "feat(employee): add update/override storage functions for editing"
```

---

### Task 4: `employee-form-overlay.ts` — hydration + snapshot storage

**Files:**
- Create: `app/Modules/Employee/resources/js/lib/employee-form-overlay.ts`

**Interfaces:**
- Consumes: `FileFieldFlags`, `createEmptyFileFieldFlags`, `createEmptyEducationEntry`,
  `createEmptyWorkExperience`, `EmployeeFormData` from `../types/employee-form` (Task 1); `Employee`
  from `@/data/Employee/employee`; `bankOptions` from `../components/steps/financial-step`
  (already exported there, unchanged).
- Produces:
  - `saveFormOverlay(employeeId: string, data: EmployeeFormData): void`
  - `hydrateEmployeeFormData(employee: Employee): { data: EmployeeFormData; fileFlags: FileFieldFlags }`

- [ ] **Step 1: Create the file**

```ts
import { type Employee } from '@/data/Employee/employee';
import { employeeAddress } from '@/data/Employee/employeeAddress';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { employeeBankAccount } from '@/data/Employee/employeeBankAccount';
import { employeeCompensation } from '@/data/Employee/employeeCompensation';
import { employeeDocument } from '@/data/Employee/employeeDocument';
import { employeeInsurance } from '@/data/Employee/employeeInsurance';
import { employmentContract } from '@/data/Employee/employmentContract';
import { organization } from '@/data/Organization/organization';
import { bankOptions } from '../components/steps/financial-step';
import {
    createEmptyEducationEntry,
    createEmptyFileFieldFlags,
    createEmptyWorkExperience,
    type EmployeeFormData,
    type FileFieldFlags,
} from '../types/employee-form';

const OVERLAY_STORAGE_KEY = 'hexaris.employee.form-overlay';

interface FormOverlayEntry {
    data: EmployeeFormData;
    fileFlags: FileFieldFlags;
}

type FormOverlayStore = Record<string, FormOverlayEntry>;

function loadOverlayStore(): FormOverlayStore {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(OVERLAY_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as FormOverlayStore) : {};
    } catch {
        return {};
    }
}

/** Strips File objects before persisting — a File can't survive JSON.stringify/parse. */
function sanitizeForStorage(data: EmployeeFormData): EmployeeFormData {
    return {
        ...data,
        ktp: null,
        npwp: null,
        contract: null,
        education: { ...data.education, certificate: null },
        work_experiences: data.work_experiences.map((experience) => ({ ...experience, reference_letter: null })),
    };
}

function computeFileFlags(data: EmployeeFormData): FileFieldFlags {
    return {
        ktp: data.ktp !== null,
        contract: data.contract !== null,
        educationCertificate: data.education.certificate !== null,
    };
}

/** Called whenever Simpan/Perbarui succeeds — the source of truth for the next time this employee is edited. */
export function saveFormOverlay(employeeId: string, data: EmployeeFormData): void {
    if (typeof window === 'undefined') return;
    const store = loadOverlayStore();
    store[employeeId] = { data: sanitizeForStorage(data), fileFlags: computeFileFlags(data) };
    window.localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(store));
}

function resolveOrgUnit(organizationUnitId: string): { departmentId: string; divisionId: string } {
    const unit = organization.find((u) => u.id === organizationUnitId);
    if (!unit) return { departmentId: '', divisionId: '' };
    if (unit.unit_type === 'DIVISION') {
        return { departmentId: unit.parent_id ?? '', divisionId: unit.id };
    }
    return { departmentId: unit.id, divisionId: '' };
}

function bankValueFromName(bankName: string): string {
    return bankOptions.find((option) => option.label.toLowerCase() === bankName.toLowerCase())?.value ?? '';
}

/**
 * Best-effort fill from the real ERD fixtures — only for fields with a clean
 * mapping. Education, work experience, and job level have no clean
 * equivalent in the ERD (see the design doc's "accepted gaps") and are left
 * empty rather than force-mapped into the wrong shape.
 */
function hydrateFromErd(employee: Employee): { data: EmployeeFormData; fileFlags: FileFieldFlags } {
    const address =
        employeeAddress.find((a) => a.employee_id === employee.id && a.is_primary) ??
        employeeAddress.find((a) => a.employee_id === employee.id);
    const assignment = employeeAssignment.find((a) => a.employee_id === employee.id);
    const contract = assignment ? employmentContract.find((c) => c.id === assignment.contract_id) : undefined;
    const compensation = employeeCompensation.find((c) => c.employee_id === employee.id && c.is_effective_now);
    const bankAccount =
        employeeBankAccount.find((b) => b.employee_id === employee.id && b.is_primary) ??
        employeeBankAccount.find((b) => b.employee_id === employee.id);
    const healthInsurance = employeeInsurance.find((i) => i.employee_id === employee.id && i.type === 'health');
    const employmentInsurance = employeeInsurance.find((i) => i.employee_id === employee.id && i.type === 'employment');
    const hasDocument = employeeDocument.some((d) => d.employee_id === employee.id);

    const { departmentId, divisionId } = assignment ? resolveOrgUnit(assignment.organization_unit_id) : { departmentId: '', divisionId: '' };

    const data: EmployeeFormData = {
        full_name: employee.full_name,
        phone_number: employee.phone_number,
        gender: employee.gender,
        religion: employee.religion,
        birth_date: employee.birth_date,
        province_id: address?.province_id ?? '',
        regency_id: address?.regency_id ?? '',
        is_married: employee.is_married,
        address: address?.address ?? '',
        ktp: null,
        npwp: null,
        contract: null,
        education: createEmptyEducationEntry(),
        work_experiences: [createEmptyWorkExperience()],
        branch: '',
        department_id: departmentId,
        division_id: divisionId,
        job_level: '',
        contract_type: contract?.contract_type ?? '',
        join_date: employee.join_date,
        bank_name: bankAccount ? bankValueFromName(bankAccount.bank_name) : '',
        bank_account_holder: bankAccount?.account_holder_name ?? '',
        bank_account_number: bankAccount?.account_number ?? '',
        basic_salary: compensation ? String(compensation.base_salary) : '',
        bpjs_health_number: healthInsurance?.policy_number ?? '',
        bpjs_employment_number: employmentInsurance?.policy_number ?? '',
    };

    const fileFlags: FileFieldFlags = {
        ktp: false,
        contract: Boolean(contract?.legal_document_path),
        educationCertificate: hasDocument,
    };

    return { data, fileFlags };
}

/**
 * The single entry point Index.tsx calls when opening Edit. Tries the
 * overlay first (exact, from a previous save through this wizard); falls
 * back to best-effort ERD mapping for an employee never edited before.
 */
export function hydrateEmployeeFormData(employee: Employee): { data: EmployeeFormData; fileFlags: FileFieldFlags } {
    const overlay = loadOverlayStore()[employee.id];
    if (overlay) return overlay;
    return hydrateFromErd(employee);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from this file. (The pre-existing `Index.tsx` error about
`saveLocalEmployee`'s return shape from Task 3 is still there — that's fine, Task 7 fixes it.)
If TypeScript complains about `employee.gender`/`employee.religion` not being assignable to
`EmployeeFormData`'s `string` fields, that's expected — `Employee['gender']` is the literal
union `'L' | 'P'` which is assignable to `string`, so this should not actually error; if it
does, double check the field is read as `employee.gender` (a value), not the type.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/lib/employee-form-overlay.ts
git commit -m "feat(employee): add form overlay + best-effort ERD hydration for edit"
```

---

### Task 5: `StepForm` gets a configurable finish label

**Files:**
- Modify: `resources/js/components/step-form.tsx`

**Interfaces:**
- Produces: `StepFormProps.finishLabel?: string` (defaults to `'Simpan'`, preserving current
  behavior for every other `StepForm` consumer in the app, if any exist beyond Employee).

- [ ] **Step 1: Add the prop**

In `resources/js/components/step-form.tsx`, change the `StepFormProps` interface from:

```tsx
interface StepFormProps {
    steps: Step[];
    title: string;
    /** Called from the "Batal" button on the first step. */
    onCancel: () => void;
    /** Called when the final step is submitted. */
    onFinish: () => void;
    processing?: boolean;
}
```

to:

```tsx
interface StepFormProps {
    steps: Step[];
    title: string;
    /** Called from the "Batal" button on the first step. */
    onCancel: () => void;
    /** Called when the final step is submitted. */
    onFinish: () => void;
    processing?: boolean;
    /** Label for the last step's submit button — e.g. "Perbarui" when editing. */
    finishLabel?: string;
}
```

Then change the function signature from:

```tsx
export function StepForm({ steps, title, onCancel, onFinish, processing = false }: StepFormProps) {
```

to:

```tsx
export function StepForm({ steps, title, onCancel, onFinish, processing = false, finishLabel = 'Simpan' }: StepFormProps) {
```

Finally, change the submit button's label expression from:

```tsx
                    {isLast ? 'Simpan' : 'Selanjutnya'}
```

to:

```tsx
                    {isLast ? finishLabel : 'Selanjutnya'}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors — `finishLabel` is optional, every existing caller still compiles.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/step-form.tsx
git commit -m "feat(step-form): support a configurable finish-button label"
```

---

### Task 6: `columns.tsx` — wire up a real Edit action

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/columns.tsx`

**Interfaces:**
- Produces: `buildEmployeeColumns(onEdit: (employee: Employee) => void): Column<Employee>[]` —
  replaces the previous static `employeeColumns` export. Task 7 is the only caller.

- [ ] **Step 1: Replace the file**

Replace the full contents of `app/Modules/Employee/resources/js/pages/columns.tsx` with:

```tsx
import { type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Employee } from '@/data/Employee/employee';
import { MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

export function buildEmployeeColumns(onEdit: (employee: Employee) => void): Column<Employee>[] {
    return [
        { key: 'employee_number', label: 'ID Karyawan', sortable: true },
        { key: 'full_name', label: 'Nama', sortable: true },
        { key: 'email_self', label: 'Email' },
        { key: 'phone_number', label: 'No. HP' },
        { key: 'employment_type', label: 'Tipe Kerja' },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Aktif' : 'Nonaktif'}</Badge>,
        },
        {
            key: 'id',
            label: '',
            align: 'right',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <MoreVertical className="cursor-pointer size-3.5 text-[#1B1B1B]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Detail ${row.full_name} belum tersedia.`)}>Detail</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-[#E84A39] focus:text-[#E84A39] text-red-500"
                            onClick={() => toast.info('Hapus karyawan belum tersambung ke backend.')}
                        >
                            Arsipkan
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: **error in `Index.tsx`** — it still imports `{ employeeColumns }` and passes it
directly to `<DataTable columns={employeeColumns} ...>`. Expected; Task 7 fixes it.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/pages/columns.tsx
git commit -m "fix(employee): wire the Edit dropdown item to a real callback"
```

---

### Task 7: `Index.tsx` — wire create/edit modes together

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/Index.tsx`

**Interfaces:**
- Consumes: everything produced in Tasks 1–6.
- Produces: the fully working Edit flow — this is the integration task.

- [ ] **Step 1: Replace the file**

Replace the full contents of `app/Modules/Employee/resources/js/pages/Index.tsx` with:

```tsx
import { type FilterConfig, type SearchConfig, DataTable } from '@/components/data-table';
import { OverviewCard } from '@/components/design-system/card/overview-card';
import { StepForm, type Step } from '@/components/step-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { employee, type Employee } from '@/data/Employee/employee';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { UserCheck, UserPlus, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EducationStep } from '../components/steps/education-step';
import { ExperienceStep } from '../components/steps/experience-step';
import { FinancialStep } from '../components/steps/financial-step';
import { PersonalStep } from '../components/steps/personal-step';
import { PreviewStep } from '../components/steps/preview-step';
import { ProvisionStep } from '../components/steps/provision-step';
import { hydrateEmployeeFormData, saveFormOverlay } from '../lib/employee-form-overlay';
import {
    applyFormDataToEmployee,
    loadEmployeeOverrides,
    loadLocalEmployees,
    saveEmployeeOverride,
    saveLocalEmployee,
    updateLocalEmployee,
} from '../lib/employee-storage';
import { validateEmployeeForm } from '../lib/validate-employee-form';
import { createEmptyFileFieldFlags, initialEmployeeFormData, type EmployeeFormData, type FieldErrors, type FileFieldFlags } from '../types/employee-form';
import { buildEmployeeColumns } from './columns';

const employeeSearch: SearchConfig = {
    keys: ['full_name', 'email_self'],
    placeholder: 'Cari nama atau email…',
};

const employeeFilters: FilterConfig[] = [
    {
        key: 'employment_type',
        type: 'select',
        label: 'Tipe Kerja',
        options: [
            { value: 'full-time', label: 'Full-time' },
            { value: 'part-time', label: 'Part-time' },
        ],
    },
];

export default function Index() {
    const [open, setOpen] = useState(false);
    const [localEmployees, setLocalEmployees] = useState(loadLocalEmployees);
    const [overrides, setOverrides] = useState(loadEmployeeOverrides);
    const [validationErrors, setValidationErrors] = useState<FieldErrors>({});
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [fileFlags, setFileFlags] = useState<FileFieldFlags>(createEmptyFileFieldFlags());
    const { data, setData, processing, reset } = useForm<EmployeeFormData>(initialEmployeeFormData);

    const allEmployees = useMemo(
        () => [...employee.map((e) => ({ ...e, ...overrides[e.id] })), ...localEmployees],
        [overrides, localEmployees],
    );

    const latestJoinYear = useMemo(() => Math.max(...allEmployees.map((e) => new Date(e.join_date).getFullYear())), [allEmployees]);

    const overviewStats = useMemo(
        () => [
            { label: 'Total Karyawan Aktif', value: allEmployees.filter((e) => e.is_active).length, icon: UserCheck },
            { label: 'Karyawan Non Aktif', value: allEmployees.filter((e) => !e.is_active).length, icon: UserX },
            {
                label: 'Karyawan Baru',
                value: allEmployees.filter((e) => new Date(e.join_date).getFullYear() === latestJoinYear).length,
                icon: UserPlus,
            },
        ],
        [allEmployees, latestJoinYear],
    );

    const close = () => {
        setOpen(false);
        reset();
        setValidationErrors({});
        setEditingEmployee(null);
        setFileFlags(createEmptyFileFieldFlags());
    };

    const openCreate = () => {
        setEditingEmployee(null);
        reset();
        setFileFlags(createEmptyFileFieldFlags());
        setValidationErrors({});
        setOpen(true);
    };

    const openEdit = (row: Employee) => {
        const hydrated = hydrateEmployeeFormData(row);
        setEditingEmployee(row);
        setData(hydrated.data);
        setFileFlags(hydrated.fileFlags);
        setValidationErrors({});
        setOpen(true);
    };

    const columns = buildEmployeeColumns(openEdit);

    const steps: Step[] = [
        { label: 'Personal', content: <PersonalStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pendidikan', content: <EducationStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pengalaman', content: <ExperienceStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Ketentuan', content: <ProvisionStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Gaji & Bank', content: <FinancialStep data={data} setData={setData} errors={validationErrors} /> },
        { label: 'Pratinjau', content: <PreviewStep data={data} /> },
    ];

    const finish = () => {
        const nextErrors = validateEmployeeForm(data, fileFlags);
        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi seluruh field yang wajib diisi sebelum menyimpan.');
            return;
        }

        setValidationErrors({});

        if (editingEmployee) {
            const updated = applyFormDataToEmployee(editingEmployee, data);
            if (localEmployees.some((e) => e.id === editingEmployee.id)) {
                setLocalEmployees(updateLocalEmployee(editingEmployee.id, updated));
            } else {
                setOverrides(saveEmployeeOverride(editingEmployee.id, updated));
            }
            saveFormOverlay(editingEmployee.id, data);
            toast.success(`${data.full_name} berhasil diperbarui.`);
        } else {
            const { employees, created } = saveLocalEmployee(data);
            setLocalEmployees(employees);
            saveFormOverlay(created.id, data);
            toast.success(`${data.full_name} berhasil ditambahkan.`);
        }

        close();
    };

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <OverviewCard title={`Overview of ${latestJoinYear}`} stats={overviewStats} />
                <DataTable
                    columns={columns}
                    data={allEmployees}
                    search={employeeSearch}
                    filters={employeeFilters}
                    actions={
                        <Dialog
                            open={open}
                            onOpenChange={(open) => {
                                setOpen(open);
                                if (!open) close();
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm" className="font-poppins bg-[#1980C0] hover:bg-[#1668a0]" onClick={openCreate}>
                                    Tambah Karyawan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="flex max-w-4xl flex-col gap-0" onInteractOutside={(e) => e.preventDefault()}>
                                <StepForm
                                    steps={steps}
                                    title={editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                                    finishLabel={editingEmployee ? 'Perbarui' : 'Simpan'}
                                    processing={processing}
                                    onCancel={close}
                                    onFinish={finish}
                                />
                            </DialogContent>
                        </Dialog>
                    }
                />
            </div>
        </AppLayout>
    );
}
```

Note: `close()` calling both `setOpen(false)` and being invoked from `onOpenChange` (which
already received the new `open` value) is intentional and harmless — `onOpenChange` sets state
to `false` first via its own `setOpen(open)` call, then `close()` sets it to `false` again.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: **zero errors** — this is the task where every dangling error from Tasks 3 and 6
gets resolved.

- [ ] **Step 3: Lint**

Run: `npx eslint app/Modules/Employee/resources/js` (or `npm run lint` for the whole repo)
Expected: no errors in Employee module files.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `✓ built in ...`, no errors.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Employee/resources/js/pages/Index.tsx
git commit -m "feat(employee): wire Edit into the Tambah Karyawan wizard"
```

---

### Task 8: Manual verification (browser)

No JS/TS unit test runner exists in this repo (confirmed: no vitest/jest in `package.json`), so
this feature's correctness is verified by driving the actual app, not by an automated suite.
Follow the same approach used earlier in this project for the validation feature: start a local
server, log in, and drive the UI directly (Playwright or manual clicking both work — Playwright
is faster to re-run and screenshot for the record).

- [ ] **Step 1: Start a local server**

```bash
php artisan serve --port=8123
```

- [ ] **Step 2: Verify editing a seed employee (best-effort hydration path)**

- Log in (an admin/super-admin account is required — check `database/seeders/DatabaseSeeder.php`
  for local credentials).
- Go to `/employees`.
- Click the row menu for any seed employee (e.g. "Bambang Wijaya") → **Edit**.
- Expected: dialog opens titled **"Edit Karyawan"**, Personal step pre-filled with that
  employee's name/phone/gender/religion/birth date/address/province/kab-kota/married status.
- Click through to **Ketentuan** — expect Departemen/Divisi and Kontrak/Tgl Gabung pre-filled.
- Click through to **Gaji & Bank** — expect Bank/No Rekening/Atas Nama/BPJS pre-filled where
  the seed data has it.
- Click through to **Pendidikan** and **Pengalaman** — expect these **empty** (no ERD mapping,
  per the accepted gap) but **not blocking**: proceed to **Pratinjau** and click **Perbarui**
  *without* filling Pendidikan/Pengalaman/file uploads.
- Expected: **validation still fires** for Pendidikan/Pengalaman's own required fields (level,
  institution, major, dates, score, company name, etc. — those are NOT covered by
  `FileFieldFlags`, only the three file fields are). Fill in Pendidikan and Pengalaman with any
  values, leave KTP/Kontrak/Ijazah file fields empty, click **Perbarui** again.
- Expected: **save succeeds** — the `FileFieldFlags` grandfathering means KTP/Kontrak/Ijazah
  file fields don't block the save just because they're empty, dialog closes, toast "... berhasil
  diperbarui." appears, and the row's data reflects any changed field (e.g. change phone number
  and confirm the table cell updates if phone is shown, or reopen Edit and confirm it stuck).

- [ ] **Step 3: Verify the overlay makes a second edit exact**

- Open **Edit** again on the same employee just updated.
- Expected: Pendidikan and Pengalaman are now **pre-filled** with what was entered in Step 2 —
  proving the overlay snapshot is being read back correctly, not re-derived from the ERD.

- [ ] **Step 4: Verify editing a wizard-created employee**

- Click **Tambah Karyawan**, fill every required field across all 6 steps (including file
  uploads for KTP/Kontrak/Ijazah — required), click **Simpan**.
- Expected: toast "... berhasil ditambahkan.", dialog closes, new row appears in the table.
- Click that new row's **Edit**.
- Expected: **every** field is pre-filled exactly as entered (this employee has an overlay from
  its own creation, so it's the exact path, not best-effort).
- Change one field (e.g. Nama Institusi in Pendidikan), click **Perbarui**.
- Expected: save succeeds, toast "... berhasil diperbarui.", table reflects the change if
  visible in a column.

- [ ] **Step 5: Verify Batal doesn't persist anything**

- Click **Tambah Karyawan**, fill in a few fields, click **Batal**.
- Reopen **Tambah Karyawan**.
- Expected: the form is back to fully empty (not the half-filled state from before) — `reset()`
  discarded it, no leftover local/override/overlay data was written.

- [ ] **Step 6: Verify the create flow still works end-to-end (regression check)**

- Repeat the full "Tambah Karyawan" flow from Step 4 for a second brand-new employee, using
  different data, confirm it saves and appears correctly, distinct from the first.

- [ ] **Step 7: Stop the server**

```bash
# stop whatever process is bound to port 8123 (Ctrl+C if run in foreground,
# or find/kill the php.exe process if run in background)
```

- [ ] **Step 8: Report results**

If every expectation in Steps 2–6 held, the feature is done — no commit needed for this task
(no code changed), just confirm in the session that verification passed. If any expectation
failed, that's a bug in one of Tasks 1–7 — fix it, re-run `tsc`/`build`, and re-verify from the
relevant step rather than committing broken behavior.

---

## Self-review notes (already applied above, kept for the record)

- **Spec coverage:** every section of the design doc maps to a task — hydration (Task 4),
  overlay + overrides storage (Tasks 3–4), `FileFieldFlags` grandfathering (Tasks 1–2, 4),
  `StepForm` label (Task 5), `columns.tsx` wiring (Task 6), `Index.tsx` integration (Task 7),
  and the "no real file persistence" decision is reflected by Tasks 1–4 touching no
  `FileUploadField`/upload code at all.
- **Type consistency:** `FileFieldFlags`/`createEmptyFileFieldFlags` (Task 1) are the same
  names used in Tasks 2, 4, and 7. `saveLocalEmployee`'s new `{ employees, created }` return
  (Task 3) is consumed with that exact shape in Task 7. `buildEmployeeColumns` (Task 6) is
  called with exactly one argument (`openEdit`) in Task 7, matching its signature.
- **No placeholders:** every task has full, final code — nothing marked TBD.
