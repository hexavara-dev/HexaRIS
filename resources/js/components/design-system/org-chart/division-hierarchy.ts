import { type OrgDivision, type OrgMember } from './org-chart';

export interface OrgDivisionHierarchyNode {
    name: string;
    members: OrgMember[];
    children: OrgDivisionHierarchyNode[];
}

/**
 * Restores the division tree encoded by `toOrgTree` as slash-delimited paths.
 * Both the saved-structure editor and the index chart consume this function so
 * sibling/child relationships cannot drift between the two views.
 */
export function buildOrgDivisionHierarchy(divisions: OrgDivision[]): OrgDivisionHierarchyNode[] {
    const roots: OrgDivisionHierarchyNode[] = [];

    function findOrCreate(siblings: OrgDivisionHierarchyNode[], name: string) {
        const existing = siblings.find((division) => division.name === name);
        if (existing) return existing;

        const created: OrgDivisionHierarchyNode = { name, members: [], children: [] };
        siblings.push(created);
        return created;
    }

    divisions.forEach((division) => {
        const path = division.name
            .split('/')
            .map((part) => part.trim())
            .filter(Boolean);
        const resolvedPath = path.length > 0 ? path : [division.name];
        let siblings = roots;
        let current: OrgDivisionHierarchyNode | undefined;

        resolvedPath.forEach((name) => {
            current = findOrCreate(siblings, name);
            siblings = current.children;
        });

        if (current) current.members = division.members;
    });

    return roots;
}
