import { type Employee } from '@/data/Employee/employee';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { branch } from '@/data/Payroll/branch';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { type PayrollDeductionSettings } from '@/data/Payroll/payrollDeductionSettings';
import { type PayrollEntry, type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { type PayrollOvertimeSettings, DEFAULT_LEMBUR_RATE } from '@/data/Payroll/payrollOvertimeSettings';
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

export interface AllowanceItem {
    id: string;
    nama: string;
    nominal: number;
}

export interface RecomputedPayrollRow extends PayrollRow {
    allowance_items: AllowanceItem[];
}

/**
 * Overrides a seed PayrollRow's earnings/deductions with values derived from the current Pengaturan
 * Gaji settings, so a settings change is visible in Data Gaji without regenerating payrollEntry.ts.
 * See docs/superpowers/specs/2026-08-11-payroll-pengaturan-gaji-design.md for the per-field rules.
 */
export function recomputeRow(
    row: PayrollRow,
    settings: { allowances: PayrollAllowance[]; deductions: PayrollDeductionSettings; overtime: PayrollOvertimeSettings },
): RecomputedPayrollRow {
    const allowance_items: AllowanceItem[] = settings.allowances
        .filter((a) => a.aktif)
        .map((a) => ({ id: a.id, nama: a.nama, nominal: a.nominal }));

    const assumedHours = Math.round(row.earnings.overtime / DEFAULT_LEMBUR_RATE);
    const overtime = assumedHours * settings.overtime.nominal_per_jam;

    const { deductions } = settings;
    const bpjs_health = deductions.bpjs_kesehatan.aktif
        ? Math.round((row.base_salary * deductions.bpjs_kesehatan.persentase_karyawan) / 100)
        : 0;
    const bpjs_employment = deductions.bpjs_ketenagakerjaan.aktif
        ? Math.round((row.base_salary * deductions.bpjs_ketenagakerjaan.persentase_karyawan) / 100)
        : 0;
    const alpha = deductions.alpha.aktif && row.deductions.alpha > 0 ? deductions.alpha.nominal : 0;
    const late = deductions.terlambat.aktif && row.deductions.late > 0 ? deductions.terlambat.nominal_per_30_menit : 0;
    const pph21 = deductions.pph21.aktif && deductions.pph21.pajak_ditanggung === 'karyawan' ? row.deductions.pph21 : 0;

    return {
        ...row,
        earnings: { ...row.earnings, overtime },
        deductions: { alpha, late, bpjs_health, bpjs_employment, pph21 },
        allowance_items,
    };
}

export function allowanceTotal(row: Pick<RecomputedPayrollRow, 'allowance_items'>): number {
    return row.allowance_items.reduce((sum, item) => sum + item.nominal, 0);
}

export function deductionTotal(row: Pick<PayrollEntry, 'deductions'>): number {
    return row.deductions.alpha + row.deductions.late + row.deductions.bpjs_health + row.deductions.bpjs_employment + row.deductions.pph21;
}

export function totalEarnings(row: Pick<RecomputedPayrollRow, 'base_salary' | 'allowance_items' | 'earnings'>): number {
    return row.base_salary + allowanceTotal(row) + row.earnings.overtime;
}

export function thp(row: Pick<RecomputedPayrollRow, 'base_salary' | 'allowance_items' | 'earnings' | 'deductions'>): number {
    return totalEarnings(row) - deductionTotal(row);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}
