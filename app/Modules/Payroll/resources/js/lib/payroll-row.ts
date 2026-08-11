import { type Employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { branch } from '@/data/Payroll/branch';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { jobPosition } from '@/data/Position/jobPosition';

export const STATUS_LABEL: Record<PayrollStatus, string> = { selesai: 'Selesai', proses: 'Proses', belum: 'Belum' };
export const STATUS_COLOR: Record<PayrollStatus, string> = { selesai: 'text-[#46B52B]', proses: 'text-[#CA8A04]', belum: 'text-[#E84A39]' };

export interface PayrollRow extends PayrollEntry {
    employee_number: string;
    full_name: string;
    position_title: string;
    branch_name: string;
}

function positionTitleFor(employeeId: string): string {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId && a.is_active);
    if (!assignment) return '-';
    return jobPosition.find((p) => p.id === assignment.job_position_id)?.title ?? '-';
}

export function toPayrollRow(entry: PayrollEntry, employeeById: Map<string, Employee>): PayrollRow {
    const employee = employeeById.get(entry.employee_id);

    return {
        ...entry,
        employee_number: employee?.employee_number ?? '-',
        full_name: employee?.full_name ?? '-',
        position_title: positionTitleFor(entry.employee_id),
        branch_name: branch.find((b) => b.id === entry.branch_id)?.name ?? '-',
    };
}

export function allowanceTotal(row: Pick<PayrollEntry, 'earnings'>): number {
    return row.earnings.position_allowance + row.earnings.meal_allowance + row.earnings.transport_allowance;
}

export function deductionTotal(row: Pick<PayrollEntry, 'deductions'>): number {
    return row.deductions.alpha + row.deductions.late + row.deductions.bpjs_health + row.deductions.bpjs_employment + row.deductions.pph21;
}

export function totalEarnings(row: Pick<PayrollEntry, 'base_salary' | 'earnings'>): number {
    return row.base_salary + allowanceTotal(row) + row.earnings.overtime;
}

export function thp(row: Pick<PayrollEntry, 'base_salary' | 'earnings' | 'deductions'>): number {
    return totalEarnings(row) - deductionTotal(row);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}
