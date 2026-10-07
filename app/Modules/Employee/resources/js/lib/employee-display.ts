import { type Employee } from '@/data/Employee/employee';
import { organization } from '@/data/Organization/organization';
import { branchOptions, positionOptions } from '../components/steps/provision-step';
import { type DummyEmployee } from '../pages/Data/employees-dummy';
import { peekFormOverlay } from './employee-form-overlay';
import { labelFor } from './format-employee-form';

/**
 * Display id for the employee table and its search.
 *
 * Seed rows carry a ready-made `employee_id` (EM187, ...), but records created
 * through the wizard only have `employee_number` (EMP-0127) and a UUID `id`.
 * Rendering those as EM### keeps every row in the same shape instead of
 * leaking a raw UUID into the ID column — the UUID stays the last resort only
 * when neither identifier exists.
 */
export interface EmployeeIdSource {
    id: string | number;
    employee_id?: string;
    employee_number?: string | number;
}

export function displayEmployeeId(employee: EmployeeIdSource): string {
    if (employee.employee_id) {
        return employee.employee_id;
    }

    const number = employee.employee_number;

    if (typeof number === 'string' || typeof number === 'number') {
        const digits = String(number).replace(/\D/g, '');

        if (digits) {
            return `EM${String(Number(digits)).padStart(3, '0')}`;
        }
    }

    return String(employee.id);
}

/**
 * The list columns the wizard fills in but the Employee record itself does not
 * carry — they live only in the form overlay. Together with the derived id
 * and approval state they are exactly the extra columns DummyEmployee adds,
 * so a wizard row can be projected onto the same row shape as a seed row.
 */
export type WizardDisplayFields = Omit<DummyEmployee, keyof Employee>;

/** Wizard contract types mapped onto the four employment_status values the table, its stats and the Kontrak filter use. */
const EMPLOYMENT_STATUS_BY_CONTRACT: Record<string, WizardDisplayFields['employment_status']> = {
    permanent: 'Tetap',
    contract: 'PKWT',
    internship: 'Probation',
    outsource: 'Freelance',
    freelance: 'Freelance',
    other: 'Tetap',
};

/**
 * Projects a wizard-created Employee onto the row shape the data table expects,
 * reading the saved form overlay so Cabang / Organisasi / Posisi Jabatan and the
 * contract status show the picked values instead of a dash — which also lets the
 * list search and the filter chips match those employees at all.
 */
export function withWizardDisplayFields(row: Employee): Employee & WizardDisplayFields {
    const data = peekFormOverlay(row.id)?.data;

    const branch = data ? labelFor(branchOptions, data.branch) : '-';

    return {
        ...row,
        employee_id: displayEmployeeId(row),
        // "Tidak Ada Cabang" is a no-branch pick, not a branch name — keep the
        // column neutral so it never surfaces as a Cabang filter option.
        branch: data && data.branch !== 'none' ? branch : '-',
        organization: data ? organization.find((unit) => unit.id === data.department_id)?.name || '-' : '-',
        position: data ? labelFor(positionOptions, data.division_id) : '-',
        employment_status: data ? EMPLOYMENT_STATUS_BY_CONTRACT[data.contract_type] || 'Tetap' : 'Tetap',
        approval_status: 'approved',
        resign_date: null,
    };
}
