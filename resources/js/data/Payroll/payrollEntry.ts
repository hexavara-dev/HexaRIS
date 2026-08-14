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
