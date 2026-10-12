import { type OrgDepartment, type OrgDivision, type OrgMember, type OrgTree } from '@/components/design-system/org-chart/org-chart';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'hexaris.company-structure';
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

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeMember(value: unknown): OrgMember | null {
    const member = asRecord(value);
    if (!member || typeof member.name !== 'string' || typeof member.role !== 'string') return null;

    return {
        name: member.name,
        role: member.role,
        ...(typeof member.avatarUrl === 'string' ? { avatarUrl: member.avatarUrl } : {}),
    };
}

function normalizeMembers(value: unknown): OrgMember[] {
    return Array.isArray(value) ? value.map(normalizeMember).filter((member): member is OrgMember => member !== null) : [];
}

/** Converts both the current flat path format and older explicitly nested division records. */
function normalizeDivisions(value: unknown, parentPath = ''): OrgDivision[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((candidate) => {
        const division = asRecord(candidate);
        if (!division || typeof division.name !== 'string' || !division.name.trim()) return [];

        const name = division.name.trim();
        const path = parentPath ? `${parentPath} / ${name}` : name;
        const head = normalizeMember(division.head);
        const members = normalizeMembers(division.members);
        const normalizedMembers =
            head && !members.some((member) => member.name === head.name && member.role === head.role) ? [head, ...members] : members;
        const nested = Array.isArray(division.divisions) ? division.divisions : division.children;

        return [{ name: path, members: normalizedMembers }, ...normalizeDivisions(nested, path)];
    });
}

function normalizeDepartments(value: unknown): OrgDepartment[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((candidate) => {
        const department = asRecord(candidate);
        if (!department || typeof department.name !== 'string' || !department.name.trim()) return [];

        const head = normalizeMember(department.head);
        const members = normalizeMembers(department.members);
        const divisions = normalizeDivisions(department.divisions);

        return [
            {
                name: department.name.trim(),
                ...(head ? { head } : {}),
                ...(members.length > 0 ? { members } : {}),
                ...(divisions && divisions.length > 0 ? { divisions } : {}),
            },
        ];
    });
}

export function parseStoredStructure(raw: string | null): StoredStructure {
    if (!raw) return emptyStructure();

    try {
        const parsed = JSON.parse(raw) as Partial<StoredStructure>;
        if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > STORAGE_SCHEMA_VERSION) return emptyStructure();

        const ceo = normalizeMember(parsed.ceo);
        const departments = normalizeDepartments(parsed.departments);
        const cabang = typeof parsed.cabang === 'string' && parsed.cabang.trim() ? parsed.cabang.trim() : DEFAULT_CABANG;

        return ceo && departments.length > 0
            ? {
                  cabang,
                  cabangOptions: structureCabangOptions(cabang),
                  ceo,
                  departments,
                  savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
                  configured: true,
                  schemaVersion: STORAGE_SCHEMA_VERSION,
              }
            : emptyStructure();
    } catch {
        return emptyStructure();
    }
}

function loadStoredStructure(): StoredStructure {
    if (typeof window === 'undefined') return emptyStructure();
    return parseStoredStructure(window.localStorage.getItem(STORAGE_KEY));
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
    const hasPersistedStructure = useRef(hasStructure);

    useEffect(() => {
        if (!hasStructure) {
            // Do not erase an unreadable/legacy record merely because the page
            // mounted empty. Only clear after a structure existed in this session.
            if (hasPersistedStructure.current) window.localStorage.removeItem(STORAGE_KEY);
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
        hasPersistedStructure.current = true;
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
