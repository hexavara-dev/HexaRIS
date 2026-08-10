import { companyDocumentTemplate, type DocumentTemplate } from '@/data/Company/companyDocumentTemplate';

/**
 * localStorage layer for document templates — mirrors Employee's
 * `employee-storage.ts`. The seed array is never mutated: new templates go into
 * their own key, editing a seed template records a patch in the overrides map,
 * and deleting one records its id as hidden.
 */
const LOCAL_RECORDS_KEY = 'hexaris.company-document.local-records';
const DELETED_SEED_IDS_KEY = 'hexaris.company-document.deleted-seed-ids';
const OVERRIDES_KEY = 'hexaris.company-document.overrides';

export function loadLocalTemplates(): DocumentTemplate[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(LOCAL_RECORDS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as DocumentTemplate[]) : [];
    } catch {
        return [];
    }
}

function newTemplateId() {
    return `tpl-${crypto.randomUUID()}`;
}

/** Appends a newly authored template to localStorage and returns the full local list. */
export function saveLocalTemplate(template: Omit<DocumentTemplate, 'id'>): DocumentTemplate[] {
    const local = loadLocalTemplates();
    const templates = [...local, { ...template, id: newTemplateId() }];
    window.localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(templates));
    return templates;
}

/** Removes a locally-created template outright — it was never part of the seed. */
export function removeLocalTemplate(id: string): DocumentTemplate[] {
    const templates = loadLocalTemplates().filter((template) => template.id !== id);
    window.localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(templates));
    return templates;
}

export function loadDeletedSeedIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = window.localStorage.getItem(DELETED_SEED_IDS_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw) as unknown;
        return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
    } catch {
        return new Set();
    }
}

/** Delete path for seed templates — never mutates the imported seed array, only hides it by id. */
export function markSeedTemplateDeleted(id: string): Set<string> {
    const deleted = loadDeletedSeedIds();
    deleted.add(id);
    window.localStorage.setItem(DELETED_SEED_IDS_KEY, JSON.stringify(Array.from(deleted)));
    return deleted;
}

export function isSeedTemplate(id: string): boolean {
    return companyDocumentTemplate.some((template) => template.id === id);
}

/** Replaces a locally-created template in place — the edit path for non-seed templates. */
export function updateLocalTemplate(id: string, updated: DocumentTemplate): DocumentTemplate[] {
    const templates = loadLocalTemplates().map((template) => (template.id === id ? updated : template));
    window.localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(templates));
    return templates;
}

export function loadTemplateOverrides(): Record<string, Partial<DocumentTemplate>> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(OVERRIDES_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, Partial<DocumentTemplate>>) : {};
    } catch {
        return {};
    }
}

/** Edit path for seed templates — never mutates the imported seed array, only this overlay, merged at read time. */
export function saveTemplateOverride(id: string, patch: Partial<DocumentTemplate>): Record<string, Partial<DocumentTemplate>> {
    const overrides = loadTemplateOverrides();
    const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
    return next;
}
