import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { organization, type OrganizationUnit } from '@/data/Organization/organization';

/** The org unit an employee is currently assigned to, or null if no assignment exists. */
export function assignedOrgUnit(employeeId: string): OrganizationUnit | null {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId);
    if (!assignment) return null;
    return organization.find((u) => u.id === assignment.organization_unit_id) ?? null;
}

/**
 * Resolves an assignment's org unit down to a department id + optional
 * division id. A DIVISION's parent is the department; anything that isn't a
 * DEPARTMENT itself (COMPANY, DIRECTORATE, SECTION, ...) walks up parent_id
 * until it finds one, since only DEPARTMENT-level ids are valid values for
 * the wizard's Departemen field.
 */
export function resolveOrgUnit(organizationUnitId: string): { departmentId: string; divisionId: string } {
    const unit = organization.find((u) => u.id === organizationUnitId);
    if (!unit) return { departmentId: '', divisionId: '' };

    if (unit.unit_type === 'DIVISION') {
        const parent = unit.parent_id ? organization.find((u) => u.id === unit.parent_id) : undefined;
        return { departmentId: parent?.unit_type === 'DEPARTMENT' ? parent.id : '', divisionId: unit.id };
    }

    if (unit.unit_type === 'DEPARTMENT') {
        return { departmentId: unit.id, divisionId: '' };
    }

    // COMPANY/DIRECTORATE/SECTION — walk up to the nearest DEPARTMENT, if any.
    let current: OrganizationUnit | undefined = unit;
    while (current && current.unit_type !== 'DEPARTMENT') {
        current = current.parent_id ? organization.find((u) => u.id === current!.parent_id) : undefined;
    }
    return { departmentId: current?.id ?? '', divisionId: '' };
}

export function departmentName(employeeId: string): string {
    const unit = assignedOrgUnit(employeeId);
    if (!unit) return '-';
    const { departmentId } = resolveOrgUnit(unit.id);
    return departmentId ? (organization.find((u) => u.id === departmentId)?.name ?? '-') : '-';
}

export function divisionName(employeeId: string): string {
    const unit = assignedOrgUnit(employeeId);
    return unit?.unit_type === 'DIVISION' ? unit.name : '-';
}
