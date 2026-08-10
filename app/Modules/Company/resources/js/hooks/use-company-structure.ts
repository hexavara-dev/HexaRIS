import { ORG_CHART_DEMO, type OrgDepartment, type OrgMember } from '@/components/design-system/org-chart/org-chart';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'hexaris.company-structure';
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredStructure {
    ceo: OrgMember | null;
    departments: OrgDepartment[];
    savedAt: number;
}

function defaultStructure(): StoredStructure {
    return { ceo: ORG_CHART_DEMO.ceo, departments: ORG_CHART_DEMO.departments, savedAt: Date.now() };
}

function loadStoredStructure(): StoredStructure {
    if (typeof window === 'undefined') return defaultStructure();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultStructure();

        const parsed = JSON.parse(raw) as Partial<StoredStructure>;
        if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > STORAGE_TTL_MS) {
            return defaultStructure();
        }

        return { ceo: parsed.ceo ?? null, departments: parsed.departments ?? [], savedAt: parsed.savedAt };
    } catch {
        return defaultStructure();
    }
}

/**
 * Owns the org structure's state and its localStorage persistence — the seam
 * to swap for a real backend later without touching any page/view component.
 */
export function useCompanyStructure() {
    const [initialStructure] = useState(loadStoredStructure);
    const [ceo, setCeo] = useState<OrgMember | null>(initialStructure.ceo);
    const [departments, setDepartments] = useState<OrgDepartment[]>(initialStructure.departments);

    const hasStructure = ceo !== null && departments.length > 0;

    useEffect(() => {
        const stored: StoredStructure = { ceo, departments, savedAt: Date.now() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }, [ceo, departments]);

    function findDepartmentByLabel(label: string) {
        return departments.find((department) => department.name.replace(/^Dept\.\s*/, '') === label);
    }

    function saveDepartment(editingDepartment: OrgDepartment | null, updated: OrgDepartment) {
        setDepartments((current) => current.map((department) => (department === editingDepartment ? updated : department)));
        toast.success('Departemen Berhasil Diperbarui');
    }

    function saveStructure(tree: { ceo: OrgMember; departments: OrgDepartment[] }) {
        setCeo(tree.ceo);
        setDepartments(tree.departments);
        toast.success('Struktur Organisasi Berhasil Diperbarui');
    }

    return { ceo, departments, hasStructure, findDepartmentByLabel, saveDepartment, saveStructure };
}
