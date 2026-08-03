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
import { createEmptyEducationEntry, createEmptyWorkExperience, type EmployeeFormData, type FileFieldFlags } from '../types/employee-form';

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
