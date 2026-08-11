import { type PayrollAllowance, payrollAllowance } from '@/data/Payroll/payrollAllowance';
import { type PayrollDeductionSettings, payrollDeductionSettings } from '@/data/Payroll/payrollDeductionSettings';
import { type PayrollGeneralSettings, payrollGeneralSettings } from '@/data/Payroll/payrollGeneralSettings';
import { type PayrollOvertimeSettings, payrollOvertimeSettings } from '@/data/Payroll/payrollOvertimeSettings';

const GENERAL_KEY = 'hexaris.payroll.settings.general';
const DEDUCTIONS_KEY = 'hexaris.payroll.settings.deductions';
const OVERTIME_KEY = 'hexaris.payroll.settings.overtime';
const ALLOWANCE_OVERRIDES_KEY = 'hexaris.payroll.settings.allowances.overrides';
const ALLOWANCE_CREATED_KEY = 'hexaris.payroll.settings.allowances.created';
const ALLOWANCE_DELETED_KEY = 'hexaris.payroll.settings.allowances.deleted';

function loadObjectJson<T extends object>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as T) : fallback;
    } catch {
        return fallback;
    }
}

function loadArrayJson<T>(key: string, fallback: T[]): T[] {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
        return fallback;
    }
}

function saveJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Quota exceeded or storage disabled — this write is lost; the next successful save
        // starts from the last persisted state, not from this one.
    }
}

export function loadGeneralSettings(): PayrollGeneralSettings {
    return { ...payrollGeneralSettings, ...loadObjectJson<Partial<PayrollGeneralSettings>>(GENERAL_KEY, {}) };
}

export function saveGeneralSettings(patch: Partial<PayrollGeneralSettings>): PayrollGeneralSettings {
    const next = { ...loadGeneralSettings(), ...patch };
    saveJson(GENERAL_KEY, next);
    return next;
}

export function loadDeductionSettings(): PayrollDeductionSettings {
    return { ...payrollDeductionSettings, ...loadObjectJson<Partial<PayrollDeductionSettings>>(DEDUCTIONS_KEY, {}) };
}

export function saveDeductionSettings(patch: Partial<PayrollDeductionSettings>): PayrollDeductionSettings {
    const next = { ...loadDeductionSettings(), ...patch };
    saveJson(DEDUCTIONS_KEY, next);
    return next;
}

export function loadOvertimeSettings(): PayrollOvertimeSettings {
    return { ...payrollOvertimeSettings, ...loadObjectJson<Partial<PayrollOvertimeSettings>>(OVERTIME_KEY, {}) };
}

export function saveOvertimeSettings(patch: Partial<PayrollOvertimeSettings>): PayrollOvertimeSettings {
    const next = { ...loadOvertimeSettings(), ...patch };
    saveJson(OVERTIME_KEY, next);
    return next;
}

function loadAllowanceOverrides(): Record<string, Partial<PayrollAllowance>> {
    return loadObjectJson<Record<string, Partial<PayrollAllowance>>>(ALLOWANCE_OVERRIDES_KEY, {});
}

function loadCreatedAllowances(): PayrollAllowance[] {
    return loadArrayJson<PayrollAllowance>(ALLOWANCE_CREATED_KEY, []);
}

function loadDeletedAllowanceIds(): string[] {
    return loadArrayJson<string>(ALLOWANCE_DELETED_KEY, []);
}

/** Seed rows (with any saved override applied) plus locally-created rows, minus deleted ids — the single source every Tunjangan panel/recompute reads from. */
export function loadAllowances(): PayrollAllowance[] {
    const overrides = loadAllowanceOverrides();
    const deleted = loadDeletedAllowanceIds();
    const seeded = payrollAllowance.map((a) => ({ ...a, ...overrides[a.id] }));
    return [...seeded, ...loadCreatedAllowances()].filter((a) => !deleted.includes(a.id));
}

/** Edit path for a seed allowance — never mutates payrollAllowance.ts, only this overlay. */
export function saveAllowanceOverride(id: string, patch: Partial<PayrollAllowance>): void {
    const overrides = loadAllowanceOverrides();
    saveJson(ALLOWANCE_OVERRIDES_KEY, { ...overrides, [id]: { ...overrides[id], ...patch } });
}

/** Edit path for a locally-created allowance — replaces it in place in the created list. */
function updateCreatedAllowance(id: string, patch: Partial<PayrollAllowance>): void {
    const created = loadCreatedAllowances();
    saveJson(
        ALLOWANCE_CREATED_KEY,
        created.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
}

/** Dispatches to the override overlay or the created-list, whichever owns this id. */
export function updateAllowance(id: string, patch: Partial<PayrollAllowance>): void {
    if (loadCreatedAllowances().some((a) => a.id === id)) {
        updateCreatedAllowance(id, patch);
    } else {
        saveAllowanceOverride(id, patch);
    }
}

export function createAllowance(data: Omit<PayrollAllowance, 'id'>): PayrollAllowance {
    const created: PayrollAllowance = { ...data, id: `allowance-local-${crypto.randomUUID()}` };
    saveJson(ALLOWANCE_CREATED_KEY, [...loadCreatedAllowances(), created]);
    return created;
}

export function deleteAllowance(id: string): void {
    const deleted = loadDeletedAllowanceIds();
    if (!deleted.includes(id)) {
        saveJson(ALLOWANCE_DELETED_KEY, [...deleted, id]);
    }
}
