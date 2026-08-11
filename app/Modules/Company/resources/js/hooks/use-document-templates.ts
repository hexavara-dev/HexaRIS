import { useMemo, useState } from 'react';

import { companyDocumentTemplate, type DocumentTemplate } from '@/data/Company/companyDocumentTemplate';

import {
    isSeedTemplate,
    loadDeletedSeedIds,
    loadLocalTemplates,
    loadTemplateOverrides,
    markSeedTemplateDeleted,
    removeLocalTemplate,
    saveLocalTemplate,
    saveTemplateOverride,
    updateLocalTemplate,
} from '../lib/document-storage';

/**
 * Merges the seed template library with the localStorage overlay — same shape as
 * Employee's `Index.tsx`: `[...seed.map(apply overrides), ...local]`, recomputed
 * with `useMemo` whenever the overlay changes. The seed array itself is never
 * mutated, so edits to a seed template live in the overrides map.
 */
export function useDocumentTemplates() {
    const [localTemplates, setLocalTemplates] = useState<DocumentTemplate[]>(loadLocalTemplates);
    const [deletedSeedIds, setDeletedSeedIds] = useState<Set<string>>(loadDeletedSeedIds);
    const [overrides, setOverrides] = useState<Record<string, Partial<DocumentTemplate>>>(loadTemplateOverrides);

    const templates = useMemo(
        () => [
            ...companyDocumentTemplate
                .filter((template) => !deletedSeedIds.has(template.id))
                .map((template) => ({ ...template, ...overrides[template.id] })),
            ...localTemplates,
        ],
        [localTemplates, deletedSeedIds, overrides],
    );

    function addTemplate(template: Omit<DocumentTemplate, 'id'>) {
        setLocalTemplates(saveLocalTemplate(template));
    }

    function deleteTemplate(id: string) {
        if (isSeedTemplate(id)) {
            setDeletedSeedIds(markSeedTemplateDeleted(id));
        } else {
            setLocalTemplates(removeLocalTemplate(id));
        }
    }

    /** Applies an edit — patching the overrides map for seed templates, replacing the record for local ones. */
    function updateTemplate(id: string, patch: Omit<DocumentTemplate, 'id'>) {
        if (isSeedTemplate(id)) {
            setOverrides(saveTemplateOverride(id, patch));
        } else {
            setLocalTemplates(updateLocalTemplate(id, { ...patch, id }));
        }
    }

    function findTemplate(id: string): DocumentTemplate | undefined {
        return templates.find((template) => template.id === id);
    }

    return { templates, addTemplate, updateTemplate, deleteTemplate, findTemplate };
}
