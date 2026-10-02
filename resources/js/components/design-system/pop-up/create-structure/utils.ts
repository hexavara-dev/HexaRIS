import { type OrgDepartment, type OrgDivision, type OrgMember, type OrgTree } from '@/components/design-system/org-chart/org-chart';
import { type NewDepartmentDraft } from '@/components/design-system/pop-up/add-department-dialog';
import { type PersonOption } from '@/components/design-system/pop-up/people-picker';
import { avatarFor, STAFF_POOL } from '@/components/design-system/pop-up/person-select';
import { type DraftDepartment, type DraftDivision, type DraftPosition, type PositionInput, type StaffSlot } from './types';

export const COMPANY_NAME = 'PT. Abadi Jaya';
export const COMPANY_CEO_NAME = 'Nicholas Raharja';

export function newId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function shortName(name: string) {
    return name.replace(/^Dept\.\s*/, '');
}

/** Ids of every node in the draft — the company, every department, and every nested division. */
export function collectFolderIds(departments: DraftDepartment[]): string[] {
    const ids = ['company', ...departments.map((department) => department.id)];

    function collectDivisions(divisions: DraftDivision[]) {
        divisions.forEach((division) => {
            ids.push(division.id);
            collectDivisions(division.divisions);
        });
    }

    departments.forEach((department) => collectDivisions(department.divisions));
    return ids;
}

export function emptyStaffSlots(): StaffSlot[] {
    return [
        { id: newId('slot'), personId: null },
        { id: newId('slot'), personId: null },
    ];
}

export function emptyDraftDivision(name: string): DraftDivision {
    return { id: newId('div'), name, headPersonId: null, staff: emptyStaffSlots(), divisions: [], positions: [] };
}

export function emptyDraftPosition(input: PositionInput): DraftPosition {
    return { id: newId('pos'), ...input };
}

export function draftsToDepartments(drafts: NewDepartmentDraft[]): DraftDepartment[] {
    return drafts.map((draft) => ({
        id: newId('dept'),
        name: `Dept. ${draft.name}`,
        hasDivisions: draft.hasDivisions,
        headPersonId: null,
        staff: draft.hasDivisions ? [] : emptyStaffSlots(),
        divisions: draft.hasDivisions ? draft.divisionNames.map((name) => emptyDraftDivision(name)) : [],
        positions: [],
    }));
}

function collectPickedPersonIdsFromDivisions(divisions: DraftDivision[], ids: Set<string>) {
    divisions.forEach((division) => {
        if (division.headPersonId) ids.add(division.headPersonId);
        division.staff.forEach((slot) => slot.personId && ids.add(slot.personId));
        collectPickedPersonIdsFromDivisions(division.divisions, ids);
    });
}

export function pickedPersonIds(departments: DraftDepartment[]): Set<string> {
    const ids = new Set<string>();
    departments.forEach((department) => {
        if (department.headPersonId) ids.add(department.headPersonId);
        department.staff.forEach((slot) => slot.personId && ids.add(slot.personId));
        collectPickedPersonIdsFromDivisions(department.divisions, ids);
    });
    return ids;
}

export function findPerson(id: string | null) {
    return id ? (STAFF_POOL.find((person) => person.id === id) ?? null) : null;
}

function personIdByName(name: string): string | null {
    return STAFF_POOL.find((person) => person.name === name)?.id ?? null;
}

function slotsFromMembers(members: OrgMember[]): StaffSlot[] {
    const slots = members.map((member) => ({ id: newId('slot'), personId: personIdByName(member.name) }));
    return slots.length > 0 ? slots : emptyStaffSlots();
}

function draftDivisionFromMembers(name: string, members: OrgMember[]): DraftDivision {
    const headIndex = members.findIndex((member) => member.role.startsWith('Kepala Divisi'));
    const head = headIndex >= 0 ? members[headIndex] : null;

    return {
        id: newId('div'),
        name,
        headPersonId: head ? personIdByName(head.name) : null,
        staff: slotsFromMembers(members.filter((_, index) => index !== headIndex)),
        divisions: [],
        positions: [],
    };
}

function draftDivisionsFromTree(divisions: OrgDivision[]): DraftDivision[] {
    const roots: DraftDivision[] = [];

    function findOrCreate(parentDivisions: DraftDivision[], name: string) {
        const existing = parentDivisions.find((division) => division.name === name);
        if (existing) return existing;

        const created = draftDivisionFromMembers(name, []);
        parentDivisions.push(created);
        return created;
    }

    divisions.forEach((division) => {
        const path = division.name
            .split('/')
            .map((part) => part.trim())
            .filter(Boolean);
        const fallbackPath = path.length > 0 ? path : [division.name];
        let siblings = roots;
        let current: DraftDivision | undefined;

        for (const name of fallbackPath) {
            current = findOrCreate(siblings, name);
            siblings = current.divisions;
        }

        if (current) {
            const hydrated = draftDivisionFromMembers(current.name, division.members);
            current.headPersonId = hydrated.headPersonId;
            current.staff = hydrated.staff;
        }
    });

    return roots;
}

export function draftDepartmentsFromTree(departments: OrgDepartment[]): DraftDepartment[] {
    return departments.map((department) => {
        if (department.divisions) {
            return {
                id: newId('dept'),
                name: department.name,
                hasDivisions: true,
                headPersonId: department.head ? personIdByName(department.head.name) : null,
                staff: [],
                divisions: draftDivisionsFromTree(department.divisions),
                positions: [],
            };
        }

        const members = department.members ?? [];
        const headIndex = members.findIndex((member) => /^Kepala\s+(Departemen|Bagian)/i.test(member.role));
        const head = headIndex >= 0 ? members[headIndex] : null;
        return {
            id: newId('dept'),
            name: department.name,
            hasDivisions: false,
            headPersonId: head ? personIdByName(head.name) : null,
            staff: slotsFromMembers(members.filter((_, index) => index !== headIndex)),
            divisions: [],
            positions: [],
        };
    });
}

function memberFromPerson(person: PersonOption, role: string): OrgMember {
    return { name: person.name, role, avatarUrl: avatarFor(person.name) };
}

function divisionMembers(division: DraftDivision): OrgMember[] {
    const divisionHead = findPerson(division.headPersonId);
    const members: OrgMember[] = [];
    if (divisionHead) members.push(memberFromPerson(divisionHead, `Kepala Divisi ${division.name}`));
    division.staff.forEach((slot) => {
        const person = findPerson(slot.personId);
        if (person) members.push(memberFromPerson(person, `Staff ${division.name}`));
    });
    return members;
}

function flattenDivisions(divisions: DraftDivision[], prefix = ''): OrgDivision[] {
    return divisions.flatMap((division) => {
        const name = prefix ? `${prefix} / ${division.name}` : division.name;
        return [{ name, members: divisionMembers(division) }, ...flattenDivisions(division.divisions, name)];
    });
}

export function toOrgTree(departments: DraftDepartment[]): OrgTree {
    return {
        ceo: { name: COMPANY_CEO_NAME, role: 'Direktur Utama', avatarUrl: avatarFor(COMPANY_CEO_NAME) },
        departments: departments.map((department) => {
            const short = shortName(department.name);
            const head = findPerson(department.headPersonId);

            if (department.hasDivisions || department.divisions.length > 0) {
                return {
                    name: department.name,
                    head: head ? memberFromPerson(head, `Kepala Bagian ${short}`) : undefined,
                    divisions: flattenDivisions(department.divisions),
                };
            }

            const members: OrgMember[] = [];
            if (head) members.push(memberFromPerson(head, `Kepala Bagian ${short}`));
            department.staff.forEach((slot) => {
                const person = findPerson(slot.personId);
                if (person) members.push(memberFromPerson(person, `Staff ${short}`));
            });
            return { name: department.name, members };
        }),
    };
}
