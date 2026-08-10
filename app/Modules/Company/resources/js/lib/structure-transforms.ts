import { type OrgDepartment, type OrgDivision } from '@/components/design-system/org-chart/org-chart';
import { type DepartmentStaff } from '@/components/design-system/pop-up/department-detail-panel';
import { type DivisionStaff } from '@/components/design-system/pop-up/division-detail-panel';

export interface StructureRow {
    divisi: string;
    nama: string;
}

export interface StructureGroup {
    id: string;
    department: string;
    rows: StructureRow[];
}

/** Flattens each department (head + direct members + every division's members) into table rows, one group per department. */
export function toStructureGroups(departments: OrgDepartment[]): StructureGroup[] {
    return departments.map((department, index) => {
        const rows: StructureRow[] = [];
        if (department.head) rows.push({ divisi: department.head.role, nama: department.head.name });
        department.members?.forEach((member) => rows.push({ divisi: member.role, nama: member.name }));
        department.divisions?.forEach((division) => division.members.forEach((member) => rows.push({ divisi: member.role, nama: member.name })));

        return {
            id: `EM${187 + index}`,
            department: department.name.replace(/^Dept\.\s*/, ''),
            rows,
        };
    });
}

export function divisionToStaff(division: OrgDivision): DivisionStaff[] {
    return division.members.map((member, index) => ({
        id: `${division.name}-${index}`,
        name: member.name,
        role: member.role,
        avatarUrl: member.avatarUrl,
    }));
}

export function divisionPositionStats(division: OrgDivision) {
    const counts = new Map<string, number>();
    division.members.forEach((member) => counts.set(member.role, (counts.get(member.role) ?? 0) + 1));
    return Array.from(counts, ([label, count]) => ({ label, count }));
}

export function departmentAllMembers(department: OrgDepartment) {
    const members = [...(department.members ?? [])];
    department.divisions?.forEach((division) => members.push(...division.members));
    return members;
}

export function departmentToStaff(department: OrgDepartment): DepartmentStaff[] {
    return departmentAllMembers(department).map((member, index) => ({
        id: `${department.name}-${index}`,
        name: member.name,
        role: member.role,
        avatarUrl: member.avatarUrl,
    }));
}

export function departmentPositionStats(department: OrgDepartment) {
    const counts = new Map<string, number>();
    departmentAllMembers(department).forEach((member) => counts.set(member.role, (counts.get(member.role) ?? 0) + 1));
    return Array.from(counts, ([label, count]) => ({ label, count }));
}
