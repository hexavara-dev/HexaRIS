import { type ReimburseEntry, reimburseEntry } from '@/data/Payroll/reimburseEntry';

const REIMBURSE_OVERRIDES_KEY = 'hexaris.payroll.reimburse.overrides';
const REIMBURSE_CREATED_KEY = 'hexaris.payroll.reimburse.created';
const REIMBURSE_DELETED_KEY = 'hexaris.payroll.reimburse.deleted';

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

function loadOverrides(): Record<string, Partial<ReimburseEntry>> {
    return loadObjectJson<Record<string, Partial<ReimburseEntry>>>(REIMBURSE_OVERRIDES_KEY, {});
}

function loadCreated(): ReimburseEntry[] {
    return loadArrayJson<ReimburseEntry>(REIMBURSE_CREATED_KEY, []);
}

function loadDeletedIds(): string[] {
    return loadArrayJson<string>(REIMBURSE_DELETED_KEY, []);
}

/** Seed rows (with any saved override applied) plus locally-created rows, minus deleted ids — the single source every Reimburse page/dialog reads from. */
export function loadReimburseEntries(): ReimburseEntry[] {
    const overrides = loadOverrides();
    const deleted = loadDeletedIds();
    const seeded = reimburseEntry.map((r) => ({ ...r, ...overrides[r.id] }));
    return [...seeded, ...loadCreated()].filter((r) => !deleted.includes(r.id));
}

/** Edit path for a seed entry — never mutates reimburseEntry.ts, only this overlay. */
function saveOverride(id: string, patch: Partial<ReimburseEntry>): void {
    const overrides = loadOverrides();
    saveJson(REIMBURSE_OVERRIDES_KEY, { ...overrides, [id]: { ...overrides[id], ...patch } });
}

/** Edit path for a locally-created entry — replaces it in place in the created list. */
function updateCreated(id: string, patch: Partial<ReimburseEntry>): void {
    const created = loadCreated();
    saveJson(
        REIMBURSE_CREATED_KEY,
        created.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
}

/** Dispatches to the override overlay or the created-list, whichever owns this id. */
export function updateReimburseEntry(id: string, patch: Partial<ReimburseEntry>): void {
    if (loadCreated().some((r) => r.id === id)) {
        updateCreated(id, patch);
    } else {
        saveOverride(id, patch);
    }
}

// Monotonic: counts every entry ever created (ignoring the deleted-ids filter
// loadReimburseEntries applies), so a new id never repeats a prior one even after some rows
// have been deleted.
function nextReimburseId(): string {
    const next = reimburseEntry.length + loadCreated().length + 1;
    return `RB-${String(next).padStart(2, '0')}`;
}

export function createReimburseEntry(data: Omit<ReimburseEntry, 'id'>): ReimburseEntry {
    const created: ReimburseEntry = { ...data, id: nextReimburseId() };
    saveJson(REIMBURSE_CREATED_KEY, [...loadCreated(), created]);
    return created;
}

export function deleteReimburseEntry(id: string): void {
    const deleted = loadDeletedIds();
    if (!deleted.includes(id)) {
        saveJson(REIMBURSE_DELETED_KEY, [...deleted, id]);
    }
}
