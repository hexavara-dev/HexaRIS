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

/** The subset of Employee columns the wizard actually collects — shared by create and update so a new wizard field can't be wired into only one of them. Also what saveEmployeeOverride should be given, so an override patch never freezes untouched columns (email, NIK, blood type, ...) at their edit-time value. */
export function wizardEditableFields(data: EmployeeFormData): Pick<Employee, 'full_name' | 'phone_number' | 'gender' | 'religion' | 'birth_date' | 'is_married' | 'join_date' | 'employment_type'> {
    return {
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
        birth_place: '-',
        blood_type: 'O',
        email_company: null,
        email_self: '-',
        work_arrangement: 'onsite',
        work_location_type: 'center',
        time_off_amount: 12,
        nationality: 'WNI',
        is_active: true,
        company_id: COMPANY_ID,
        ...wizardEditableFields(data),
    };
}

/**
 * Applies wizard-editable fields onto an existing Employee — used when
 * updating, so identity columns (id, employee_number, NIK, email, ...) that
 * the wizard doesn't collect are preserved untouched instead of being reset
 * to buildEmployeeFromForm's create-time placeholders.
 */
export function applyFormDataToEmployee(existing: Employee, data: EmployeeFormData): Employee {
    return { ...existing, ...wizardEditableFields(data) };
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
