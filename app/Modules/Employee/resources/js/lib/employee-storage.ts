import { COMPANY_ID, employee, type Employee } from '@/data/Employee/employee';
import { type EmployeeFormData } from '../types/employee-form';

const STORAGE_KEY = 'hexaris.employee.local-records';

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
 * blood type, work arrangement, ...) — those fall back to reasonable
 * defaults here rather than being left undefined, since Employee itself
 * has no optional/nullable slot for most of them.
 */
function buildEmployeeFromForm(data: EmployeeFormData, existingCount: number): Employee {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        employee_number: nextEmployeeNumber(existingCount),
        profile_picture_path: null,
        identity_number: data.identity_number,
        npwp_number: data.npwp_number || null,
        full_name: data.full_name,
        birth_place: '-',
        birth_date: data.birth_date,
        gender: data.gender as Employee['gender'],
        religion: data.religion as Employee['religion'],
        is_married: data.is_married,
        blood_type: 'O',
        email_company: data.email_company || null,
        email_self: data.email_self,
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

/** Appends the submitted form as a new Employee to localStorage and returns the full merged list (seed + local). */
export function saveLocalEmployee(data: EmployeeFormData): Employee[] {
    const local = loadLocalEmployees();
    const created = buildEmployeeFromForm(data, employee.length + local.length);
    const updated = [...local, created];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return updated;
}
