import { type PayrollEntry } from '@/data/Payroll/payrollEntry';

const STORAGE_KEY = 'hexaris.payroll.overrides';
const DELETED_STORAGE_KEY = 'hexaris.payroll.deleted';

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
        // Quota exceeded or storage disabled — this write is lost; the next successful save
        // starts from the last persisted state, not from this one.
    }
    return next;
}

export function loadDeletedPayrollIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(DELETED_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

export function markPayrollDeleted(id: string): string[] {
    const deleted = loadDeletedPayrollIds();
    const next = deleted.includes(id) ? deleted : [...deleted, id];
    try {
        window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Quota exceeded or storage disabled — this delete is lost; the row reappears on next load.
    }
    return next;
}
