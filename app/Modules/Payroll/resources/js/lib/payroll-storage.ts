import { type PayrollEntry } from '@/data/Payroll/payrollEntry';

const STORAGE_KEY = 'hexaris.payroll.overrides';

export function loadPayrollOverrides(): Record<string, Partial<PayrollEntry>> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, Partial<PayrollEntry>>) : {};
    } catch {
        return {};
    }
}

/** Edit path for every payroll entry — never mutates the generated seed array, only this overlay, merged at render time in Index.tsx. */
export function savePayrollOverride(id: string, patch: Partial<PayrollEntry>): Record<string, Partial<PayrollEntry>> {
    const overrides = loadPayrollOverrides();
    const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Quota exceeded or storage disabled — the returned in-memory overrides still apply
        // for this session; only cross-refresh persistence silently fails.
    }
    return next;
}
