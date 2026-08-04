# Employee Detail Dialog + Real File Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the list page's "Detail" row action to a read-only tabbed dialog showing an
employee's full biodata, and make uploaded files (KTP, NPWP, contract, education certificate,
work-experience reference letters) actually persist as base64 so both the Edit wizard and the
new Detail dialog can preview them via an eye-icon popup.

**Architecture:** Frontend-only. `EmployeeFormData`'s file fields widen from `File | null` to
`File | StoredFile | null` (`StoredFile = { name, type, dataUrl }`). `saveFormOverlay` becomes
async and converts any live `File` to `StoredFile` via `FileReader` before writing to
`localStorage` — `StoredFile` is plain JSON data, so it survives `JSON.stringify`/`parse`
untouched, unlike `File`. `FileUploadField` gains an eye button (preview popup) next to its
existing trash button. The new Detail dialog reuses `hydrateEmployeeFormData()` — the exact
function Edit already uses — so the two views can never drift apart, plus a handful of
`Employee`-only fields (email, KTP number, blood type, ...) that aren't part of the wizard form.

**Tech Stack:** React + TypeScript, Radix Dialog primitives (`@/components/ui/dialog`),
`FileReader`/base64 data URLs, `localStorage`. No backend changes, no PHP, no new routes.

## Global Constraints

- No backend changes of any kind — confirmed in the design doc.
- Every task must end with `npx tsc --noEmit` showing no new errors.
- The final state of the whole plan must pass `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` — this repo has no JS/TS unit test runner, so "tests" for frontend logic
  means type-checking plus a manual/browser verification task at the end.
- Uploaded files are capped at **2MB** each (`MAX_STORED_FILE_BYTES`) — rejected client-side
  with a toast, not silently truncated.
- Spec: `docs/superpowers/specs/2026-08-04-employee-detail-dialog-design.md` — read it if any
  task here seems to contradict it; this plan should match it exactly.

---

### Task 1: `StoredFile` + preview popup in the shared upload field

**Files:**
- Modify: `resources/js/components/form/form-field.tsx:1` (imports)
- Modify: `resources/js/components/form/form-field.tsx:143-284` (full replace, see below)

**Interfaces:**
- Produces: `StoredFile` type, `isStoredFile(value): value is StoredFile`,
  `fileToStoredFile(file: File): Promise<StoredFile>`, `MAX_STORED_FILE_BYTES` constant,
  `toUploadedFile(file: File | StoredFile | null): UploadedFile | null` (widened),
  `useFilePreviewUrl(file: File | StoredFile | null): string | null` (widened),
  `FilePreviewDialog` component, `FileUploadField` (widened `file` prop, eye+trash UI) — all
  exported from `@/components/form/form-field`. Used by Task 2 onward (Employee's
  `EmployeeFormData`, `employee-form-overlay.ts`, and every new `detail/` component).

- [ ] **Step 1: Add two imports at the top of the file**

Open `resources/js/components/form/form-field.tsx`. Replace line 1:

```ts
import { Eye, EyeOff, FileText, FolderClosed, Trash2, XCircle } from 'lucide-react';
```

with:

```ts
import { Eye, EyeOff, FileText, FolderClosed, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
```

(Keep the existing `InputError`, `Input`, `Label`, `Select*`, `cn` imports below untouched.)

- [ ] **Step 2: Replace `UploadedFile` through the end of `FileUploadField`**

Find the block starting at `export interface UploadedFile {` (line 143) and ending at the closing
`}` of `FileUploadField` (line 284, right before `interface ImageUploadFieldProps`). Replace
that entire block with:

```ts
export interface StoredFile {
    name: string;
    type: string;
    dataUrl: string;
}

/** localStorage has ~5-10MB of headroom total per origin and this app has no backend to offload to — reject anything bigger at selection time rather than silently failing the save later. */
export const MAX_STORED_FILE_BYTES = 2 * 1024 * 1024;

export function isStoredFile(value: unknown): value is StoredFile {
    return typeof value === 'object' && value !== null && 'dataUrl' in value;
}

/** Converts a freshly picked File to something that survives JSON.stringify — called right before a save persists it. */
export function fileToStoredFile(file: File): Promise<StoredFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result as string });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export interface UploadedFile {
    name: string;
    /** Only known for a freshly picked File — a hydrated StoredFile doesn't carry its byte size. */
    size: string | null;
}

/** FileUploadField shows name + size; the form itself holds the raw File or a previously stored one. */
export function toUploadedFile(file: File | StoredFile | null): UploadedFile | null {
    if (!file) return null;
    if (isStoredFile(file)) return { name: file.name, size: null };
    return { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} Mb` };
}

function fileExtension(name: string): string {
    const match = /\.([a-zA-Z0-9]+)$/.exec(name);
    return match ? match[1].toUpperCase() : '';
}

// PDF reads as red (matches its usual "danger/urgent" document association);
// every other extension shares one green, so the badge/icon color is a type
// signal (two states), not a per-extension rainbow.
const PDF_COLOR = '#E84A39';
const DEFAULT_COLOR = '#16A34A';

/** One document glyph whose color follows the file type (red for PDF, green otherwise), tagged with its extension on the right edge — no image thumbnails. */
export function FileTypeIcon({ name, className = 'h-9 w-9' }: { name: string; className?: string }) {
    const ext = fileExtension(name);
    const color = ext === 'PDF' ? PDF_COLOR : DEFAULT_COLOR;

    return (
        <span className="relative inline-flex shrink-0">
            <FileText className={className} style={{ color }} />
            {ext && (
                <span
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 rounded-[3px] px-1 py-px text-[8px] leading-none font-bold text-white"
                    style={{ backgroundColor: color }}
                >
                    {ext}
                </span>
            )}
        </span>
    );
}

/**
 * A live File gets an object URL (revoked on cleanup); a StoredFile's
 * dataUrl is already a usable src/href, no creation or revocation needed.
 */
export function useFilePreviewUrl(file: File | StoredFile | null): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setUrl(null);
            return;
        }

        if (isStoredFile(file)) {
            setUrl(file.dataUrl);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return url;
}

interface FilePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    /** MIME type — best-effort, both File and StoredFile carry one. */
    type: string;
    previewUrl: string | null;
}

/** Shared by FileUploadField's eye button and every read-only document row in the Employee Detail dialog. */
export function FilePreviewDialog({ open, onOpenChange, name, type, previewUrl }: FilePreviewDialogProps) {
    const isImage = type.startsWith('image/');
    const isPdf = type === 'application/pdf';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogTitle className="font-poppins truncate text-base font-semibold text-[#121212]">{name}</DialogTitle>
                {!previewUrl ? (
                    <p className="font-poppins text-sm text-[#8F8F8F]">File tidak tersedia untuk pratinjau.</p>
                ) : isImage ? (
                    <img src={previewUrl} alt={name} className="max-h-[70vh] w-full rounded object-contain" />
                ) : isPdf ? (
                    <iframe src={previewUrl} title={name} className="h-[70vh] w-full rounded border border-[#E7E7E7]" />
                ) : (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-poppins text-sm text-[#1980C0] underline">
                        Buka file di tab baru
                    </a>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface FileUploadFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    file?: File | StoredFile | null;
    onSelect: (file: File | null) => void;
    onRemove: () => void;
    accept?: string;
    helperText?: string;
}

export function FileUploadField({
    label,
    required,
    error,
    file = null,
    onSelect,
    onRemove,
    accept,
    helperText = 'Seret file ke sini atau klik untuk mengunggah, atau telusuri.',
}: FileUploadFieldProps) {
    const inputId = `file-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const uploaded = toUploadedFile(file);
    const previewUrl = useFilePreviewUrl(file);
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleSelect = (selected: File | null) => {
        if (selected && selected.size > MAX_STORED_FILE_BYTES) {
            toast.error(`${selected.name} melebihi 2MB — pilih file yang lebih kecil.`);
            return;
        }
        onSelect(selected);
    };

    return (
        <div className="flex w-full flex-col items-start gap-2.5">
            <p className="font-poppins text-base font-semibold text-[#121212]">
                {label} <RequiredMark required={required} />
            </p>

            {uploaded ? (
                <div className="w-full rounded border border-dashed border-[#808080] p-4">
                    <div className="flex w-full items-center gap-4 rounded-lg bg-white px-4 py-2 shadow-[0_2px_4px_0_rgba(0,0,0,0.05),0_1px_8px_0_rgba(0,0,0,0.10)]">
                        <FileTypeIcon name={uploaded.name} />
                        <div className="flex min-w-0 flex-1 flex-col items-start">
                            <p className="font-poppins w-full truncate text-sm text-[#353535]">{uploaded.name}</p>
                            {uploaded.size && <p className="font-poppins text-sm text-[#808080]">{uploaded.size}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                            aria-label={`Lihat ${uploaded.name}`}
                            className="cursor-pointer text-[#4F4F4F]"
                        >
                            <Eye className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={onRemove} aria-label="Hapus file" className="cursor-pointer">
                            <Trash2 className="h-6 w-6 text-[#E84A39]" />
                        </button>
                    </div>
                    <FilePreviewDialog
                        open={previewOpen}
                        onOpenChange={setPreviewOpen}
                        name={uploaded.name}
                        type={file?.type ?? ''}
                        previewUrl={previewUrl}
                    />
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        'flex w-full cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-[#808080] px-8 py-3.5',
                        error && errorBorderClassName,
                    )}
                >
                    <FolderClosed className="h-8 w-8 text-[#8F8F8F]" />
                    <span className="font-poppins text-center text-xs font-semibold text-[#121212]">{helperText}</span>
                    <input
                        id={inputId}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => handleSelect(event.target.files?.[0] ?? null)}
                    />
                </label>
            )}

            <InputError message={error} className={cn('font-poppins text-xs', errorTextClassName)} />
        </div>
    );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/components/form/form-field.tsx
git commit -m "feat(form): persist and preview uploaded files instead of only linking to them"
```

---

### Task 2: Widen `EmployeeFormData`'s file fields; keep `preview-step.tsx` compiling

**Files:**
- Modify: `app/Modules/Employee/resources/js/types/employee-form.ts`
- Create: `app/Modules/Employee/resources/js/lib/format-employee-form.ts`
- Modify: `app/Modules/Employee/resources/js/components/steps/preview-step.tsx`

**Interfaces:**
- Consumes: `StoredFile` from Task 1 (`@/components/form/form-field`).
- Produces: `WorkExperience.reference_letter`, `EducationEntry.certificate`, and
  `EmployeeFormData.ktp`/`npwp`/`contract` all become `File | StoredFile | null`;
  `isEmptyWorkExperience(experience: WorkExperience): boolean`; `format-employee-form.ts`
  exports `labelFor(options, value)`, `orgUnitName(id)`, `formatDate(value)` — used by Task 3
  onward (Detail tabs) and by this task's `preview-step.tsx` update.

- [ ] **Step 1: Widen the file-shaped fields**

Open `app/Modules/Employee/resources/js/types/employee-form.ts`. Add this import at the top:

```ts
import { type StoredFile } from '@/components/form/form-field';
```

Change the `WorkExperience` type's `reference_letter` field from:

```ts
    reference_letter: File | null;
```

to:

```ts
    reference_letter: File | StoredFile | null;
```

Change `EducationEntry`'s `certificate` field from:

```ts
    certificate: File | null;
```

to:

```ts
    certificate: File | StoredFile | null;
```

Change `EmployeeFormData`'s `ktp`, `npwp`, `contract` fields from:

```ts
    ktp: File | null;
    npwp: File | null;
    contract: File | null;
```

to:

```ts
    ktp: File | StoredFile | null;
    npwp: File | StoredFile | null;
    contract: File | StoredFile | null;
```

- [ ] **Step 2: Add `isEmptyWorkExperience`**

In the same file, right after the `createEmptyWorkExperience` function, add:

```ts
/** True for the untouched default entry (the wizard always starts with one empty WorkExperience) — used to skip it in read-only views instead of showing an all-blank card. */
export function isEmptyWorkExperience(experience: WorkExperience): boolean {
    return !experience.company_name.trim() && !experience.position.trim();
}
```

- [ ] **Step 3: Extract shared display helpers**

Create `app/Modules/Employee/resources/js/lib/format-employee-form.ts`:

```ts
import { type SelectFieldOption } from '@/components/form/form-field';
import { organization } from '@/data/Organization/organization';

export function labelFor(options: SelectFieldOption[], value: string): string {
    return options.find((option) => option.value === value)?.label || '—';
}

export function orgUnitName(id: string): string {
    return organization.find((unit) => unit.id === id)?.name || '—';
}

export function formatDate(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
```

- [ ] **Step 4: Point `preview-step.tsx` at the shared helpers and widen `DocumentRow`**

Open `app/Modules/Employee/resources/js/components/steps/preview-step.tsx`. Replace the top of
the file, from the imports through the end of `formatDate` (everything before
`function SummarySection`), with:

```ts
import { FileTypeIcon, toUploadedFile, useFilePreviewUrl, type StoredFile } from '@/components/form/form-field';
import { type ReactNode } from 'react';
import { formatDate, labelFor, orgUnitName } from '../../lib/format-employee-form';
import { type EmployeeFormData } from '../../types/employee-form';
import { educationLevelOptions } from './education-step';
import { employmentTypeOptions, workLocationOptions } from './experience-entry';
import { bankOptions } from './financial-step';
import { genderOptions, maritalStatusLabel, religionOptions } from './personal-step';
import { branchOptions, contractOptions, jobLevelOptions } from './provision-step';
```

Then change `DocumentRow`'s signature — find:

```ts
function DocumentRow({ label, file }: { label: string; file: File | null }) {
```

and replace with:

```ts
function DocumentRow({ label, file }: { label: string; file: File | StoredFile | null }) {
```

Leave the rest of the file (`SummarySection`, `SummaryRow`, the body of `DocumentRow`, and the
`PreviewStep` component itself) unchanged — `organization` is no longer imported directly since
`orgUnitName` now lives in the shared helper.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Employee/resources/js/types/employee-form.ts \
        app/Modules/Employee/resources/js/lib/format-employee-form.ts \
        app/Modules/Employee/resources/js/components/steps/preview-step.tsx
git commit -m "feat(employee): widen form file fields to support persisted uploads"
```

---

### Task 3: Persist uploads as `StoredFile` in the form overlay

**Files:**
- Modify: `app/Modules/Employee/resources/js/lib/employee-form-overlay.ts`

**Interfaces:**
- Consumes: `StoredFile`, `isStoredFile`, `fileToStoredFile` from Task 1
  (`@/components/form/form-field`).
- Produces: `saveFormOverlay(employeeId, data, previousFlags): Promise<void>` — same name, now
  async. `hydrateEmployeeFormData` and `peekFormOverlay` are unchanged in signature (they never
  touched file fields beyond passing them through).

- [ ] **Step 1: Import the new helpers**

Open `app/Modules/Employee/resources/js/lib/employee-form-overlay.ts`. Add to the imports:

```ts
import { fileToStoredFile, isStoredFile, type StoredFile } from '@/components/form/form-field';
import { toast } from 'sonner';
```

- [ ] **Step 2: Replace `sanitizeForStorage` and `saveFormOverlay`**

Find:

```ts
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
```

Replace it with:

```ts
async function toStoredFile(value: File | StoredFile | null): Promise<StoredFile | null> {
    if (!value) return null;
    return isStoredFile(value) ? value : fileToStoredFile(value);
}

/** Converts any freshly picked File to a StoredFile before persisting — a raw File can't survive JSON.stringify/parse, but a StoredFile (plain name/type/base64 strings) can. */
async function sanitizeForStorage(data: EmployeeFormData): Promise<EmployeeFormData> {
    return {
        ...data,
        ktp: await toStoredFile(data.ktp),
        npwp: await toStoredFile(data.npwp),
        contract: await toStoredFile(data.contract),
        education: { ...data.education, certificate: await toStoredFile(data.education.certificate) },
        work_experiences: await Promise.all(
            data.work_experiences.map(async (experience) => ({
                ...experience,
                reference_letter: await toStoredFile(experience.reference_letter),
            })),
        ),
    };
}

/** Drops every file field back to null — the fallback write when localStorage rejects the full save for being too large. */
function withoutFiles(data: EmployeeFormData): EmployeeFormData {
    return {
        ...data,
        ktp: null,
        npwp: null,
        contract: null,
        education: { ...data.education, certificate: null },
        work_experiences: data.work_experiences.map((experience) => ({ ...experience, reference_letter: null })),
    };
}
```

Then find:

```ts
/**
 * Called whenever Simpan/Perbarui succeeds — the source of truth for the
 * next time this employee is edited. `previousFlags` is whatever flags the
 * form was hydrated with this session (empty flags for a brand-new
 * employee) — passing it is what keeps a grandfathered-in file
 * grandfathered on every subsequent save, instead of only surviving one.
 */
export function saveFormOverlay(employeeId: string, data: EmployeeFormData, previousFlags: FileFieldFlags): void {
    if (typeof window === 'undefined') return;
    const store = loadOverlayStore();
    store[employeeId] = { data: sanitizeForStorage(data), fileFlags: computeFileFlags(data, previousFlags) };
    window.localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(store));
}
```

Replace it with:

```ts
/**
 * Called whenever Simpan/Perbarui succeeds — the source of truth for the
 * next time this employee is edited. `previousFlags` is whatever flags the
 * form was hydrated with this session (empty flags for a brand-new
 * employee) — passing it is what keeps a grandfathered-in file
 * grandfathered on every subsequent save, instead of only surviving one.
 */
export async function saveFormOverlay(employeeId: string, data: EmployeeFormData, previousFlags: FileFieldFlags): Promise<void> {
    if (typeof window === 'undefined') return;
    const store = loadOverlayStore();
    const fileFlags = computeFileFlags(data, previousFlags);
    const sanitized = await sanitizeForStorage(data);

    try {
        store[employeeId] = { data: sanitized, fileFlags };
        window.localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
        if (!(error instanceof DOMException) || (error.name !== 'QuotaExceededError' && error.name !== 'NS_ERROR_DOM_QUOTA_REACHED')) throw error;

        toast.error('Penyimpanan lokal penuh — dokumen tidak tersimpan, data lain tetap tersimpan.');
        store[employeeId] = { data: withoutFiles(sanitized), fileFlags };
        window.localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(store));
    }
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Employee/resources/js/lib/employee-form-overlay.ts
git commit -m "feat(employee): persist uploaded files as base64 in the form overlay"
```

---

### Task 4: `Index.tsx` awaits the now-async save

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/Index.tsx`

**Interfaces:**
- Consumes: `saveFormOverlay` (now `Promise<void>`) from Task 3.

- [ ] **Step 1: Make `finish` async and await both call sites**

Open `app/Modules/Employee/resources/js/pages/Index.tsx`. Find:

```ts
    const finish = () => {
        const nextErrors = validateEmployeeForm(data, fileFlags);
        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi seluruh field yang wajib diisi sebelum menyimpan.');
            return;
        }

        setValidationErrors({});

        if (editingEmployee) {
            if (localEmployees.some((e) => e.id === editingEmployee.id)) {
                setLocalEmployees(updateLocalEmployee(editingEmployee.id, applyFormDataToEmployee(editingEmployee, data)));
            } else {
                // Only the wizard-editable subset, never the full merged Employee — otherwise this
                // override would freeze every other column (email, NIK, blood type, ...) at whatever
                // they happened to be on this one edit, hiding any later change to the seed fixture.
                setOverrides(saveEmployeeOverride(editingEmployee.id, wizardEditableFields(data)));
            }
            saveFormOverlay(editingEmployee.id, data, fileFlags);
            toast.success(`${data.full_name} berhasil diperbarui.`);
        } else {
            const { employees, created } = saveLocalEmployee(data);
            setLocalEmployees(employees);
            saveFormOverlay(created.id, data, fileFlags);
            toast.success(`${data.full_name} berhasil ditambahkan.`);
        }

        close();
    };
```

Replace with:

```ts
    const finish = async () => {
        const nextErrors = validateEmployeeForm(data, fileFlags);
        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            toast.error('Lengkapi seluruh field yang wajib diisi sebelum menyimpan.');
            return;
        }

        setValidationErrors({});

        if (editingEmployee) {
            if (localEmployees.some((e) => e.id === editingEmployee.id)) {
                setLocalEmployees(updateLocalEmployee(editingEmployee.id, applyFormDataToEmployee(editingEmployee, data)));
            } else {
                // Only the wizard-editable subset, never the full merged Employee — otherwise this
                // override would freeze every other column (email, NIK, blood type, ...) at whatever
                // they happened to be on this one edit, hiding any later change to the seed fixture.
                setOverrides(saveEmployeeOverride(editingEmployee.id, wizardEditableFields(data)));
            }
            await saveFormOverlay(editingEmployee.id, data, fileFlags);
            toast.success(`${data.full_name} berhasil diperbarui.`);
        } else {
            const { employees, created } = saveLocalEmployee(data);
            setLocalEmployees(employees);
            await saveFormOverlay(created.id, data, fileFlags);
            toast.success(`${data.full_name} berhasil ditambahkan.`);
        }

        close();
    };
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/pages/Index.tsx
git commit -m "fix(employee): await the async form-overlay save before closing the wizard"
```

---

### Task 5: `positionTitle` lookup

**Files:**
- Modify: `app/Modules/Employee/resources/js/lib/employee-org.ts`

**Interfaces:**
- Produces: `positionTitle(employeeId: string): string | null` — resolves the ERD assignment's
  job title, or `null` if the employee has no `employeeAssignment` row (wizard-created, or a
  seed employee only ever edited through the wizard). The caller (Task 9's `detail-dialog.tsx`)
  supplies its own overlay/job_level fallback for the `null` case — matches the pattern
  `columns.tsx` already uses for `branchName`/`departmentName`/`divisionName`, and avoids a
  circular import (`employee-org.ts` must not import `employee-form-overlay.ts`, which already
  imports `resolveOrgUnit` from `employee-org.ts`).

- [ ] **Step 1: Add the import and the function**

Open `app/Modules/Employee/resources/js/lib/employee-org.ts`. Add to the imports:

```ts
import { jobPosition } from '@/data/Position/jobPosition';
```

At the end of the file, add:

```ts
/** ERD-only — resolves employeeAssignment.job_position_id to its title. Returns null (not '-') so callers can layer their own fallback (e.g. the wizard's job_level for an employee with no ERD assignment). */
export function positionTitle(employeeId: string): string | null {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId);
    if (!assignment) return null;
    return jobPosition.find((p) => p.id === assignment.job_position_id)?.title ?? null;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/resources/js/lib/employee-org.ts
git commit -m "feat(employee): add positionTitle lookup for the detail dialog header"
```

---

### Task 6: Detail dialog primitives — `DetailField`, `TabBar`, `DetailFileRow`

**Files:**
- Create: `app/Modules/Employee/resources/js/components/detail/detail-field.tsx`
- Create: `app/Modules/Employee/resources/js/components/detail/tab-bar.tsx`
- Create: `app/Modules/Employee/resources/js/components/detail/detail-file-row.tsx`

**Interfaces:**
- Consumes: `FilePreviewDialog`, `toUploadedFile`, `useFilePreviewUrl`, `type StoredFile` from
  Task 1 (`@/components/form/form-field`); `cn` from `@/lib/utils`; `Badge` from
  `@/components/ui/badge`.
- Produces: `DetailField({ label, value }: { label: string; value: string })`,
  `TabBar({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (index: number) => void })`,
  `DetailFileRow({ label, file }: { label: string; file: File | StoredFile | null })` — all
  used by Task 7-9's tab components.

- [ ] **Step 1: `DetailField`**

Create `app/Modules/Employee/resources/js/components/detail/detail-field.tsx`:

```tsx
interface DetailFieldProps {
    label: string;
    value: string;
}

/** The "Label : value" read-only row every Detail tab is built from. */
export function DetailField({ label, value }: DetailFieldProps) {
    return (
        <p className="font-poppins text-sm text-[#353535]">
            <span className="text-[#8F8F8F]">{label}</span> : {value || '-'}
        </p>
    );
}
```

- [ ] **Step 2: `TabBar`**

Create `app/Modules/Employee/resources/js/components/detail/tab-bar.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface TabBarProps {
    tabs: string[];
    active: number;
    onChange: (index: number) => void;
}

/** Freely clickable pill tabs — not a linear stepper (this dialog has no next/back). */
export function TabBar({ tabs, active, onChange }: TabBarProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(index)}
                    className={cn(
                        'font-poppins cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors',
                        index === active
                            ? 'bg-[#1980C0] text-white'
                            : 'border border-[#ACACAC] bg-white text-[#121212] hover:border-[#1980C0]',
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
```

- [ ] **Step 3: `DetailFileRow`**

Create `app/Modules/Employee/resources/js/components/detail/detail-file-row.tsx`:

```tsx
import { FilePreviewDialog, toUploadedFile, useFilePreviewUrl, type StoredFile } from '@/components/form/form-field';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { useState } from 'react';

interface DetailFileRowProps {
    label: string;
    file: File | StoredFile | null;
}

/** Read-only counterpart to FileUploadField's "uploaded" state — eye button only, no delete, "Belum ada" badge when nothing was ever attached. */
export function DetailFileRow({ label, file }: DetailFileRowProps) {
    const [open, setOpen] = useState(false);
    const uploaded = toUploadedFile(file);
    const previewUrl = useFilePreviewUrl(file);

    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <p className="font-poppins text-sm text-[#353535]">
                <span className="text-[#8F8F8F]">{label}</span> : {uploaded ? uploaded.name : '-'}
            </p>
            {uploaded ? (
                <>
                    <button type="button" onClick={() => setOpen(true)} aria-label={`Lihat ${uploaded.name}`} className="shrink-0 cursor-pointer text-[#4F4F4F]">
                        <Eye className="h-4 w-4" />
                    </button>
                    <FilePreviewDialog open={open} onOpenChange={setOpen} name={uploaded.name} type={file?.type ?? ''} previewUrl={previewUrl} />
                </>
            ) : (
                <Badge variant="secondary" className="shrink-0">
                    Belum ada
                </Badge>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (nothing imports these three yet, purely additive).

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Employee/resources/js/components/detail/detail-field.tsx \
        app/Modules/Employee/resources/js/components/detail/tab-bar.tsx \
        app/Modules/Employee/resources/js/components/detail/detail-file-row.tsx
git commit -m "feat(employee): add Detail dialog primitives (field row, tab bar, file row)"
```

---

### Task 7: Personal and Pendidikan tabs

**Files:**
- Create: `app/Modules/Employee/resources/js/components/detail/personal-tab.tsx`
- Create: `app/Modules/Employee/resources/js/components/detail/education-tab.tsx`

**Interfaces:**
- Consumes: `DetailField`, `DetailFileRow` from Task 6; `labelFor`, `formatDate` from Task 2
  (`../../lib/format-employee-form`); `genderOptions`, `maritalStatusLabel`, `religionOptions`
  from `../steps/personal-step`; `educationLevelOptions` from `../steps/education-step`;
  `type EmployeeFormData` from `../../types/employee-form`; `type Employee` from
  `@/data/Employee/employee`; `province`/`regency` from `@/data/Region/*`.
- Produces: `PersonalTab({ employee, data }: { employee: Employee; data: EmployeeFormData })`,
  `EducationTab({ data }: { data: EmployeeFormData })` — used by Task 9's `detail-dialog.tsx`.

- [ ] **Step 1: `PersonalTab`**

Create `app/Modules/Employee/resources/js/components/detail/personal-tab.tsx`:

```tsx
import { type Employee } from '@/data/Employee/employee';
import { province } from '@/data/Region/province';
import { regency } from '@/data/Region/regency';
import { formatDate, labelFor } from '../../lib/format-employee-form';
import { genderOptions, maritalStatusLabel, religionOptions } from '../steps/personal-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';

function regionName(regencyId: string, provinceId: string): string {
    const regencyName = regency.find((r) => r.id === regencyId)?.name;
    const provinceName = province.find((p) => p.id === provinceId)?.name;
    return [regencyName, provinceName].filter(Boolean).join(', ');
}

interface PersonalTabProps {
    employee: Employee;
    data: EmployeeFormData;
}

export function PersonalTab({ employee, data }: PersonalTabProps) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <p className="font-poppins text-sm font-semibold text-[#121212]">Data Personal</p>
                <DetailField label="Nama Lengkap" value={data.full_name} />
                <DetailField label="Jenis Kelamin" value={labelFor(genderOptions, data.gender)} />
                <DetailField label="Tgl Lahir" value={formatDate(data.birth_date)} />
                <DetailField label="Status" value={maritalStatusLabel(data.is_married)} />
                <DetailField label="Nomor WA" value={data.phone_number} />
                <DetailField label="Agama" value={labelFor(religionOptions, data.religion)} />
                <DetailField label="Kab/Kota" value={regionName(data.regency_id, data.province_id)} />
                <DetailField label="Full Address" value={data.address} />
            </div>

            <div className="flex flex-col gap-2">
                <p className="font-poppins text-sm font-semibold text-[#121212]">Data Identitas</p>
                <DetailField label="Nomor Induk Karyawan" value={employee.employee_number} />
                <DetailField label="Email Perusahaan" value={employee.email_company ?? '-'} />
                <DetailField label="Email Pribadi" value={employee.email_self} />
                <DetailField label="No. KTP" value={employee.identity_number} />
                <DetailField label="NPWP" value={employee.npwp_number ?? '-'} />
                <DetailField label="Golongan Darah" value={employee.blood_type} />
                <DetailField label="Kewarganegaraan" value={employee.nationality} />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: `EducationTab`**

Create `app/Modules/Employee/resources/js/components/detail/education-tab.tsx`:

```tsx
import { formatDate, labelFor } from '../../lib/format-employee-form';
import { educationLevelOptions } from '../steps/education-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';
import { DetailFileRow } from './detail-file-row';

export function EducationTab({ data }: { data: EmployeeFormData }) {
    return (
        <div className="flex flex-col gap-2">
            <DetailField label="Pendidikan Terakhir" value={labelFor(educationLevelOptions, data.education.level)} />
            <DetailField label="Nama Institusi" value={data.education.institution} />
            <DetailField label="Jurusan" value={data.education.major} />
            <DetailField label="Waktu Mulai" value={formatDate(data.education.start_date)} />
            <DetailField label="Waktu Lulus" value={formatDate(data.education.end_date)} />
            <DetailField label="Nilai Akhir" value={data.education.final_score} />
            <DetailFileRow label="Sertifikat/Ijazah" file={data.education.certificate} />
        </div>
    );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Employee/resources/js/components/detail/personal-tab.tsx \
        app/Modules/Employee/resources/js/components/detail/education-tab.tsx
git commit -m "feat(employee): add Detail dialog Personal and Pendidikan tabs"
```

---

### Task 8: Pengalaman, Ketentuan, and Gaji & Bank tabs

**Files:**
- Create: `app/Modules/Employee/resources/js/components/detail/experience-tab.tsx`
- Create: `app/Modules/Employee/resources/js/components/detail/provision-tab.tsx`
- Create: `app/Modules/Employee/resources/js/components/detail/financial-tab.tsx`

**Interfaces:**
- Consumes: `DetailField`, `DetailFileRow` from Task 6; `labelFor`, `orgUnitName`, `formatDate`
  from Task 2; `isEmptyWorkExperience`, `type EmployeeFormData`, `type WorkExperience` from
  `../../types/employee-form`; `employmentTypeOptions`, `workLocationOptions` from
  `../steps/experience-entry`; `branchOptions`, `contractOptions`, `jobLevelOptions` from
  `../steps/provision-step`; `bankOptions` from `../steps/financial-step`.
- Produces: `ExperienceTab`, `ProvisionTab`, `FinancialTab` — each `({ data }: { data: EmployeeFormData })` — used by Task 9's `detail-dialog.tsx`.

- [ ] **Step 1: `ExperienceTab`**

Create `app/Modules/Employee/resources/js/components/detail/experience-tab.tsx`:

```tsx
import { formatDate, labelFor } from '../../lib/format-employee-form';
import { employmentTypeOptions, workLocationOptions } from '../steps/experience-entry';
import { isEmptyWorkExperience, type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';
import { DetailFileRow } from './detail-file-row';

export function ExperienceTab({ data }: { data: EmployeeFormData }) {
    const experiences = data.work_experiences.filter((experience) => !isEmptyWorkExperience(experience));

    if (experiences.length === 0) {
        return <p className="font-poppins text-sm text-[#8F8F8F]">Belum ada riwayat pengalaman kerja.</p>;
    }

    return (
        <div className="flex flex-col gap-5">
            {experiences.map((experience, index) => (
                <div key={index} className="flex flex-col gap-2 border-b border-[#E7E7E7] pb-5 last:border-b-0 last:pb-0">
                    {experiences.length > 1 && <p className="font-poppins text-sm font-semibold text-[#121212]">Pengalaman {index + 1}</p>}
                    <DetailField label="Nama Perusahaan" value={experience.company_name} />
                    <DetailField label="Tipe Pekerjaan" value={labelFor(employmentTypeOptions, experience.employment_type)} />
                    <DetailField label="Jabatan/Posisi" value={experience.position} />
                    <DetailField label="Periode" value={`${formatDate(experience.start_date)} - ${formatDate(experience.end_date)}`} />
                    <DetailField label="Lokasi Kerja" value={labelFor(workLocationOptions, experience.work_location)} />
                    <DetailField label="Gaji Terakhir" value={experience.last_salary} />
                    <DetailField label="Deskripsi" value={experience.description} />
                    <DetailFileRow label="Surat Referensi" file={experience.reference_letter} />
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 2: `ProvisionTab`**

Create `app/Modules/Employee/resources/js/components/detail/provision-tab.tsx`:

```tsx
import { formatDate, labelFor, orgUnitName } from '../../lib/format-employee-form';
import { branchOptions, contractOptions, jobLevelOptions } from '../steps/provision-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';

export function ProvisionTab({ data }: { data: EmployeeFormData }) {
    return (
        <div className="flex flex-col gap-2">
            <DetailField label="Cabang" value={labelFor(branchOptions, data.branch)} />
            <DetailField label="Level" value={labelFor(jobLevelOptions, data.job_level)} />
            <DetailField label="Departemen" value={orgUnitName(data.department_id)} />
            <DetailField label="Divisi" value={orgUnitName(data.division_id)} />
            <DetailField label="Kontrak" value={labelFor(contractOptions, data.contract_type)} />
            <DetailField label="Tgl Gabung" value={formatDate(data.join_date)} />
        </div>
    );
}
```

- [ ] **Step 3: `FinancialTab`**

Create `app/Modules/Employee/resources/js/components/detail/financial-tab.tsx`:

```tsx
import { labelFor } from '../../lib/format-employee-form';
import { bankOptions } from '../steps/financial-step';
import { type EmployeeFormData } from '../../types/employee-form';
import { DetailField } from './detail-field';

function formatCurrency(value: string): string {
    const amount = Number(value);
    if (!value || Number.isNaN(amount)) return value;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export function FinancialTab({ data }: { data: EmployeeFormData }) {
    return (
        <div className="flex flex-col gap-2">
            <DetailField label="Bank" value={labelFor(bankOptions, data.bank_name)} />
            <DetailField label="Nama Pemilik Rekening" value={data.bank_account_holder} />
            <DetailField label="No Rekening" value={data.bank_account_number} />
            <DetailField label="Gaji Pokok" value={formatCurrency(data.basic_salary)} />
            <DetailField label="Nomor BPJS Kesehatan" value={data.bpjs_health_number} />
            <DetailField label="Nomor BPJS Ketenagakerjaan" value={data.bpjs_employment_number} />
        </div>
    );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Employee/resources/js/components/detail/experience-tab.tsx \
        app/Modules/Employee/resources/js/components/detail/provision-tab.tsx \
        app/Modules/Employee/resources/js/components/detail/financial-tab.tsx
git commit -m "feat(employee): add Detail dialog Pengalaman, Ketentuan, and Gaji & Bank tabs"
```

---

### Task 9: Documents tab and the dialog shell

**Files:**
- Create: `app/Modules/Employee/resources/js/components/detail/documents-tab.tsx`
- Create: `app/Modules/Employee/resources/js/components/detail/detail-dialog.tsx`
- Delete: `app/Modules/Employee/resources/js/components/steps/detail-dialog.tsx` (the empty stub
  this feature replaces — it lived under `steps/` even though Detail was never a wizard step)

**Interfaces:**
- Consumes: `DetailFileRow` from Task 6; every tab component from Task 6-8;
  `hydrateEmployeeFormData` from `../../lib/employee-form-overlay`; `positionTitle` from Task 5
  (`../../lib/employee-org`); `jobLevelOptions` from `../steps/provision-step`; `isEmptyWorkExperience` from `../../types/employee-form`; `type Employee` from `@/data/Employee/employee`; `Avatar`/`AvatarFallback`/`AvatarImage` from `@/components/ui/avatar`; `DialogTitle` from `@/components/ui/dialog`.
- Produces: `DetailDialog({ employee }: { employee: Employee })` — used by Task 10's `Index.tsx`.

- [ ] **Step 1: `DocumentsTab`**

Create `app/Modules/Employee/resources/js/components/detail/documents-tab.tsx`:

```tsx
import { isEmptyWorkExperience, type EmployeeFormData } from '../../types/employee-form';
import { DetailFileRow } from './detail-file-row';

export function DocumentsTab({ data }: { data: EmployeeFormData }) {
    const experiencesWithLetters = data.work_experiences.filter((experience) => !isEmptyWorkExperience(experience));

    return (
        <div className="flex flex-col gap-2">
            <DetailFileRow label="KTP" file={data.ktp} />
            <DetailFileRow label="NPWP" file={data.npwp} />
            <DetailFileRow label="Kontrak" file={data.contract} />
            <DetailFileRow label="Sertifikat/Ijazah Pendidikan" file={data.education.certificate} />
            {experiencesWithLetters.map((experience, index) => (
                <DetailFileRow
                    key={index}
                    label={experiencesWithLetters.length > 1 ? `Surat Referensi (Pengalaman ${index + 1})` : 'Surat Referensi'}
                    file={experience.reference_letter}
                />
            ))}
        </div>
    );
}
```

- [ ] **Step 2: Delete the dead stub**

```bash
git rm app/Modules/Employee/resources/js/components/steps/detail-dialog.tsx
```

- [ ] **Step 3: `DetailDialog`**

Create `app/Modules/Employee/resources/js/components/detail/detail-dialog.tsx`:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DialogTitle } from '@/components/ui/dialog';
import { type Employee } from '@/data/Employee/employee';
import { useMemo, useState } from 'react';
import { hydrateEmployeeFormData } from '../../lib/employee-form-overlay';
import { positionTitle } from '../../lib/employee-org';
import { jobLevelOptions } from '../steps/provision-step';
import { DocumentsTab } from './documents-tab';
import { EducationTab } from './education-tab';
import { ExperienceTab } from './experience-tab';
import { FinancialTab } from './financial-tab';
import { PersonalTab } from './personal-tab';
import { ProvisionTab } from './provision-tab';
import { TabBar } from './tab-bar';

const TABS = ['Personal', 'Pendidikan', 'Pengalaman', 'Ketentuan', 'Gaji & Bank', 'Dokumen Pendukung'];

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

interface DetailDialogProps {
    employee: Employee;
}

export function DetailDialog({ employee }: DetailDialogProps) {
    const [active, setActive] = useState(0);
    const { data } = useMemo(() => hydrateEmployeeFormData(employee), [employee]);
    const position = positionTitle(employee.id) ?? jobLevelOptions.find((option) => option.value === data.job_level)?.label ?? '-';

    return (
        <div className="flex max-h-[85vh] flex-col gap-5 px-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                    {employee.profile_picture_path && <AvatarImage src={employee.profile_picture_path} alt={employee.full_name} />}
                    <AvatarFallback className="font-poppins text-base font-semibold">{initials(employee.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="font-poppins text-lg font-semibold text-[#121212]">{employee.full_name}</DialogTitle>
                    <p className="font-poppins text-sm text-[#8F8F8F]">{position}</p>
                </div>
            </div>

            <TabBar tabs={TABS} active={active} onChange={setActive} />

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                {active === 0 && <PersonalTab employee={employee} data={data} />}
                {active === 1 && <EducationTab data={data} />}
                {active === 2 && <ExperienceTab data={data} />}
                {active === 3 && <ProvisionTab data={data} />}
                {active === 4 && <FinancialTab data={data} />}
                {active === 5 && <DocumentsTab data={data} />}
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Employee/resources/js/components/detail/documents-tab.tsx \
        app/Modules/Employee/resources/js/components/detail/detail-dialog.tsx
git rm app/Modules/Employee/resources/js/components/steps/detail-dialog.tsx 2>/dev/null || true
git commit -m "feat(employee): assemble the Detail dialog from its six tabs"
```

---

### Task 10: Wire "Detail" into the list page

**Files:**
- Modify: `app/Modules/Employee/resources/js/pages/columns.tsx`
- Modify: `app/Modules/Employee/resources/js/pages/Index.tsx`

**Interfaces:**
- Consumes: `DetailDialog` from Task 9.
- Produces: `buildEmployeeColumns(onEdit, onDetail)` — same name, one more parameter.

- [ ] **Step 1: `columns.tsx` — accept and wire `onDetail`**

Open `app/Modules/Employee/resources/js/pages/columns.tsx`. Change:

```ts
export function buildEmployeeColumns(onEdit: (employee: Employee) => void): Column<Employee>[] {
```

to:

```ts
export function buildEmployeeColumns(onEdit: (employee: Employee) => void, onDetail: (employee: Employee) => void): Column<Employee>[] {
```

Then find:

```tsx
                        <DropdownMenuItem onClick={() => toast.info(`Detail ${row.full_name} belum tersedia.`)}>Detail</DropdownMenuItem>
```

and replace with:

```tsx
                        <DropdownMenuItem onClick={() => onDetail(row)}>Detail</DropdownMenuItem>
```

(`toast` stays imported and used — the "Arsipkan" item below still calls it.)

- [ ] **Step 2: `Index.tsx` — detail state and dialog**

Open `app/Modules/Employee/resources/js/pages/Index.tsx`. Add to the imports:

```ts
import { DetailDialog } from '../components/detail/detail-dialog';
```

Add `Dialog, DialogContent` are already imported from `@/components/ui/dialog` — no change needed there.

Find:

```ts
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
```

and add right after it:

```ts
    const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
```

Find:

```ts
    const columns = useMemo(() => buildEmployeeColumns(openEdit), [openEdit]);
```

and replace with:

```ts
    const openDetail = useCallback((row: Employee) => setDetailEmployee(row), []);

    const columns = useMemo(() => buildEmployeeColumns(openEdit, openDetail), [openEdit, openDetail]);
```

Finally, find the closing of the `<DataTable ... />` self-closing tag:

```tsx
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

Replace the final three lines (`)` closing `actions`, `/>` closing `DataTable`, `</div>`,
`</AppLayout>`, `);`, `}`) — i.e. everything from `                />` (closing `DataTable`) to
the end of the file — with:

```tsx
                />

                <Dialog open={detailEmployee !== null} onOpenChange={(open) => !open && setDetailEmployee(null)}>
                    <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                        {detailEmployee && <DetailDialog employee={detailEmployee} />}
                    </DialogContent>
                </Dialog>
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
git add app/Modules/Employee/resources/js/pages/columns.tsx app/Modules/Employee/resources/js/pages/Index.tsx
git commit -m "feat(employee): wire the Detail row action to the new dialog"
```

---

### Task 11: README + final verification

**Files:**
- Modify: `app/Modules/Employee/README.md`

- [ ] **Step 1: Update the accepted-gaps section**

Open `app/Modules/Employee/README.md`. Replace the bullet:

```md
- **Uploaded files are never actually persisted.** A `File` can't survive
  `JSON.stringify`, so every upload field is discarded on save. `FileFieldFlags`
  (`types/employee-form.ts`) tracks whether a *required* file was attached at the last
  successful save, so Edit doesn't force re-uploading it — but there is no way to view or
  download a previously uploaded document.
```

with:

```md
- **Uploaded files persist as base64 (`StoredFile`, capped at 2MB each), not real storage.**
  `saveFormOverlay` converts any freshly picked `File` via `FileReader` before writing to
  `localStorage` — Edit and the row's "Detail" dialog can both preview a previously uploaded
  file (eye icon) without needing to re-attach it. This is a stronger mock, not real
  persistence: there is still no backend, `localStorage` has only ~5-10MB of headroom per
  origin, and a save that would exceed it drops the file fields with a toast rather than
  losing the rest of the form (see `employee-form-overlay.ts`'s `withoutFiles`).
```

Then find the "Key files" table and add a row after the `columns.tsx` row:

```md
| `resources/js/components/detail/` | Read-only "Detail" dialog (row action) — six tabs mirroring the wizard's steps, sourced from the same `hydrateEmployeeFormData` Edit uses |
```

- [ ] **Step 2: Full verification**

Run, in order:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three exit 0 with no errors.

Then start the dev server and manually verify in the browser:

1. `php artisan serve` (or your usual local server) and `npm run dev` in a second terminal.
2. Go to `/employees`. Click a row's `⋮` menu → **Detail**. Confirm the dialog opens with the
   employee's photo/initials, name, and resolved position, and that all six tabs
   (Personal, Pendidikan, Pengalaman, Ketentuan, Gaji & Bank, Dokumen Pendukung) render without
   a console error.
3. Click **Tambah Karyawan**, fill the wizard through to a document upload step, attach a small
   image or PDF (under 2MB) to KTP, and finish the wizard.
4. Re-open that same employee's row menu → **Edit** — confirm the KTP field now shows the
   uploaded file (not an empty dropzone), and clicking its eye icon opens the preview popup.
5. Open **Detail** on that same employee → Dokumen Pendukung tab — confirm KTP shows the file
   name with a working eye-preview button instead of "Belum ada".
6. Try selecting a file over 2MB in any upload step — confirm a toast error appears and the
   field stays empty.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Employee/README.md
git commit -m "docs(employee): document persisted-upload gap and the Detail dialog"
```
