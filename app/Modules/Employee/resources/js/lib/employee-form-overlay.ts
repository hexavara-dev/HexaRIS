import { type Employee } from '@/data/Employee/employee';
import { employeeAddress } from '@/data/Employee/employeeAddress';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { employeeBankAccount } from '@/data/Employee/employeeBankAccount';
import { employeeCompensation } from '@/data/Employee/employeeCompensation';
import { employeeDocument } from '@/data/Employee/employeeDocument';
import { employeeInsurance } from '@/data/Employee/employeeInsurance';
import { employmentContract } from '@/data/Employee/employmentContract';
import { bankOptions } from '../components/steps/financial-step';
import { resolveOrgUnit } from './employee-org';
import {
    createEmptyEducationEntry,
    createEmptyFileFieldFlags,
    createEmptyWorkExperience,
    initialEmployeeFormData,
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

/**
 * An overlay entry saved by an older EmployeeFormData shape (a field renamed
 * or added since) would otherwise hand back `undefined` nested values and
 * crash the first thing that reads them (e.g. validation's `value.trim()`).
 * Merging over `initialEmployeeFormData` guarantees every known field exists.
 */
function sanitizeOverlayEntry(entry: unknown): FormOverlayEntry | null {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = entry as Partial<FormOverlayEntry>;
    if (!candidate.data || typeof candidate.data !== 'object') return null;
    return {
        data: { ...initialEmployeeFormData, ...candidate.data },
        fileFlags: { ...createEmptyFileFieldFlags(), ...candidate.fileFlags },
    };
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

/**
 * A field newly picked this session (`data.ktp !== null`) satisfies its flag
 * on its own; ORing with `previous` means a field that was already
 * grandfathered in (or genuinely on file per the ERD) stays satisfied even
 * though this save's `data` holds `null` for every file field again.
 */
function computeFileFlags(data: EmployeeFormData, previous: FileFieldFlags): FileFieldFlags {
    return {
        ktp: data.ktp !== null || previous.ktp,
        contract: data.contract !== null || previous.contract,
        educationCertificate: data.education.certificate !== null || previous.educationCertificate,
    };
}

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

/** Raw overlay peek, with no ERD fallback — used by the list page to show wizard-only fields (branch, department, division) for employees the ERD has no assignment/address for. */
export function peekFormOverlay(employeeId: string): FormOverlayEntry | null {
    return sanitizeOverlayEntry(loadOverlayStore()[employeeId]);
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
    const overlay = sanitizeOverlayEntry(loadOverlayStore()[employee.id]);
    if (overlay) return overlay;
    return hydrateFromErd(employee);
}
