import { type OrgDepartment, type OrgMember, type OrgTree } from '@/components/design-system/org-chart/org-chart';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'hexaris.company-structure';
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_SCHEMA_VERSION = 3;
const DEFAULT_CABANG = 'Jakarta';

interface StoredStructure {
    cabang: string;
    cabangOptions: string[];
    ceo: OrgMember | null;
    departments: OrgDepartment[];
    savedAt: number;
    configured?: boolean;
    schemaVersion?: number;
}

function emptyStructure(): StoredStructure {
    return {
        cabang: DEFAULT_CABANG,
        cabangOptions: [DEFAULT_CABANG],
        ceo: null,
        departments: [],
        savedAt: Date.now(),
        configured: false,
        schemaVersion: STORAGE_SCHEMA_VERSION,
    };
}

function structureCabangOptions(cabang: string): string[] {
    return [cabang];
}

function loadStoredStructure(): StoredStructure {
    if (typeof window === 'undefined') return emptyStructure();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyStructure();

        const parsed = JSON.parse(raw) as Partial<StoredStructure>;
        if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > STORAGE_TTL_MS) {
            return emptyStructure();
        }

        if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION || parsed.configured !== true) {
            return emptyStructure();
        }

        const ceo = parsed.ceo ?? null;
        const departments = parsed.departments ?? [];
        const cabang = typeof parsed.cabang === 'string' && parsed.cabang.trim() ? parsed.cabang : DEFAULT_CABANG;
        const cabangOptions = structureCabangOptions(cabang);

        return ceo !== null && departments.length > 0
            ? { cabang, cabangOptions, ceo, departments, savedAt: parsed.savedAt, configured: true, schemaVersion: STORAGE_SCHEMA_VERSION }
            : emptyStructure();
    } catch {
        return emptyStructure();
    }
}

/**
 * Owns the org structure's state and its localStorage persistence — the seam
 * to swap for a real backend later without touching any page/view component.
 */
export function useCompanyStructure() {
    const [initialStructure] = useState(loadStoredStructure);
    const [cabang, setCabang] = useState(initialStructure.cabang);
    const [ceo, setCeo] = useState<OrgMember | null>(initialStructure.ceo);
    const [departments, setDepartments] = useState<OrgDepartment[]>(initialStructure.departments);

    const hasStructure = ceo !== null && departments.length > 0;
    const cabangOptions = structureCabangOptions(cabang);

    useEffect(() => {
        if (!hasStructure) {
            window.localStorage.removeItem(STORAGE_KEY);
            return;
        }

        const stored: StoredStructure = {
            cabang,
            cabangOptions: structureCabangOptions(cabang),
            ceo,
            departments,
            savedAt: Date.now(),
            configured: hasStructure,
            schemaVersion: STORAGE_SCHEMA_VERSION,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }, [cabang, ceo, departments, hasStructure]);

    function findDepartmentByLabel(label: string) {
        return departments.find((department) => department.name.replace(/^Dept\.\s*/, '') === label);
    }

    function saveDepartment(editingDepartment: OrgDepartment | null, updated: OrgDepartment) {
        setDepartments((current) => current.map((department) => (department === editingDepartment ? updated : department)));
        toast.success('Departemen Berhasil Diperbarui');
    }

    function deleteDepartment(label: string) {
        setDepartments((current) => current.filter((department) => department.name.replace(/^Dept\.\s*/, '') !== label));
    }

    function saveStructure(tree: OrgTree) {
        const nextCabang = tree.cabang ?? DEFAULT_CABANG;
        setCabang(nextCabang);
        setCeo(tree.ceo);
        setDepartments(tree.departments);
        toast.success('Struktur Organisasi Berhasil Diperbarui');
    }

    return {
        cabang,
        cabangOptions,
        ceo,
        departments,
        hasStructure,
        findDepartmentByLabel,
        saveDepartment,
        deleteDepartment,
        saveStructure,
        setCabang,
    };
}
