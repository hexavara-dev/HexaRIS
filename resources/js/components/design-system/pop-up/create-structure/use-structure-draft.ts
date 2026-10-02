import { type OrgTree } from '@/components/design-system/org-chart/org-chart';
import { type NewDepartmentDraft } from '@/components/design-system/pop-up/add-department-dialog';
import { useEffect, useRef, useState } from 'react';
import { type BranchChoice, type BranchOption, type DraftDepartment, type DraftDivision, type DraftPosition, type PositionInput } from './types';
import { draftDepartmentsFromTree, draftsToDepartments, emptyDraftDivision, emptyDraftPosition, newId, pickedPersonIds, toOrgTree } from './utils';

const DEFAULT_BRANCHES: BranchOption[] = [
    { value: 'jakarta', name: 'Jakarta', address: 'Jl Ahmad Yani No. 19 Kertajaya Jakarta Timur' },
    { value: 'surabaya', name: 'Surabaya', address: 'Jl Ahmad Yani No. 19 Kertajaya Surabaya Timur' },
];

function branchValue(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

function branchOptionsFromNames(names: string[]): BranchOption[] {
    return names.filter(Boolean).map((name) => {
        const defaultBranch = DEFAULT_BRANCHES.find((branch) => branch.name.toLowerCase() === name.toLowerCase());
        return { value: branchValue(name), name, address: defaultBranch?.address ?? '-' };
    });
}

export function useStructureDraft(open: boolean, savedCabangOptions: string[] = [], savedStructure: OrgTree | null = null) {
    const [departments, setDepartments] = useState<DraftDepartment[]>([]);
    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const [isReconfiguring, setIsReconfiguring] = useState(false);
    const [isUpdatingSavedStructure, setIsUpdatingSavedStructure] = useState(false);
    const [branchChoice, setBranchChoice] = useState<BranchChoice>(null);
    const [branches, setBranches] = useState<BranchOption[]>(DEFAULT_BRANCHES);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState('company');
    const [branchPreviewExpanded, setBranchPreviewExpanded] = useState(false);
    const [structurePreviewExpanded, setStructurePreviewExpanded] = useState(false);
    const [positionPreviewExpanded, setPositionPreviewExpanded] = useState(false);
    const seededRef = useRef(false);

    useEffect(() => {
        if (!open) {
            seededRef.current = false;
            return;
        }
        if (seededRef.current) return;
        seededRef.current = true;
        const savedBranches = branchOptionsFromNames(savedCabangOptions);
        const hasSavedBranches = savedBranches.length > 0;

        setDepartments([]);
        setIsReconfiguring(hasSavedBranches);
        setIsUpdatingSavedStructure(false);
        setBranchChoice(hasSavedBranches ? 'existing' : null);
        setBranches(hasSavedBranches ? savedBranches : DEFAULT_BRANCHES);
        setSelectedBranch('');
        setSelectedNodeId('company');
    }, [open, savedCabangOptions]);

    function selectBranch(value: string) {
        setSelectedBranch(value);

        if (!isReconfiguring) return;
        if (!value) {
            setDepartments([]);
            setIsUpdatingSavedStructure(false);
            setSelectedNodeId('company');
            return;
        }

        const branch = branches.find((branch) => branch.value === value);
        const isSavedBranch = Boolean(branch && savedStructure?.cabang && branch.name.toLowerCase() === savedStructure.cabang.toLowerCase());
        setIsUpdatingSavedStructure(isSavedBranch);
        setDepartments(isSavedBranch && savedStructure ? draftDepartmentsFromTree(savedStructure.departments) : []);
        setSelectedNodeId('company');
    }

    function addBranch(name: string, address: string) {
        const value = branchValue(name);
        setBranches((current) => [...current, { value, name, address }]);
        setSelectedBranch(value);
        setBranchChoice('existing');
        setIsUpdatingSavedStructure(false);
        setDepartments([]);
        setSelectedNodeId('company');
    }

    function removeBranch(value: string) {
        setBranches((current) => current.filter((branch) => branch.value !== value));
        setSelectedBranch((current) => (current === value ? '' : current));
        setBranchChoice(null);
        setIsUpdatingSavedStructure(false);
        setDepartments([]);
        setSelectedNodeId('company');
    }

    function addDepartments(drafts: NewDepartmentDraft[]) {
        setDepartments((current) => [...current, ...draftsToDepartments(drafts)]);
    }

    function addDepartment(name: string) {
        setDepartments((current) => [...current, ...draftsToDepartments([{ name, hasDivisions: false, divisionNames: [] }])]);
    }

    function setDepartmentHead(departmentId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) => (department.id === departmentId ? { ...department, headPersonId: personId } : department)),
        );
    }

    function addStaffSlot(departmentId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId ? { ...department, staff: [...department.staff, { id: newId('slot'), personId: null }] } : department,
            ),
        );
    }

    function removeStaffSlot(departmentId: string, slotId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId ? { ...department, staff: department.staff.filter((slot) => slot.id !== slotId) } : department,
            ),
        );
    }

    function setStaffPerson(departmentId: string, slotId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? { ...department, staff: department.staff.map((slot) => (slot.id === slotId ? { ...slot, personId } : slot)) }
                    : department,
            ),
        );
    }

    function setDivisionHead(departmentId: string, divisionId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: mapDivisionTree(department.divisions, divisionId, (division) => ({ ...division, headPersonId: personId })),
                      }
                    : department,
            ),
        );
    }

    function mapDivisionTree(divisions: DraftDivision[], divisionId: string, updater: (division: DraftDivision) => DraftDivision): DraftDivision[] {
        return divisions.map((division) => {
            if (division.id === divisionId) return updater(division);
            return { ...division, divisions: mapDivisionTree(division.divisions, divisionId, updater) };
        });
    }

    function removeDivisionFromTree(divisions: DraftDivision[], divisionId: string): DraftDivision[] {
        return divisions
            .filter((division) => division.id !== divisionId)
            .map((division) => ({ ...division, divisions: removeDivisionFromTree(division.divisions, divisionId) }));
    }

    /** Applies `updater` to the positions of a department OR any nested division, whichever matches `targetId`. */
    function updateNodePositions(
        departments: DraftDepartment[],
        targetId: string,
        updater: (positions: DraftPosition[]) => DraftPosition[],
    ): DraftDepartment[] {
        return departments.map((department) => {
            if (department.id === targetId) return { ...department, positions: updater(department.positions) };

            return {
                ...department,
                divisions: mapDivisionTree(department.divisions, targetId, (division) => ({
                    ...division,
                    positions: updater(division.positions),
                })),
            };
        });
    }

    function addPosition(targetId: string, input: PositionInput) {
        setDepartments((current) => updateNodePositions(current, targetId, (positions) => [...positions, emptyDraftPosition(input)]));
    }

    function removePosition(targetId: string, positionId: string) {
        setDepartments((current) =>
            updateNodePositions(current, targetId, (positions) => positions.filter((position) => position.id !== positionId)),
        );
    }

    function addDivisionStaffSlot(departmentId: string, divisionId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: mapDivisionTree(department.divisions, divisionId, (division) => ({
                              ...division,
                              staff: [...division.staff, { id: newId('slot'), personId: null }],
                          })),
                      }
                    : department,
            ),
        );
    }

    function removeDivisionStaffSlot(departmentId: string, divisionId: string, slotId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: mapDivisionTree(department.divisions, divisionId, (division) => ({
                              ...division,
                              staff: division.staff.filter((slot) => slot.id !== slotId),
                          })),
                      }
                    : department,
            ),
        );
    }

    function setDivisionStaffPerson(departmentId: string, divisionId: string, slotId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: mapDivisionTree(department.divisions, divisionId, (division) => ({
                              ...division,
                              staff: division.staff.map((slot) => (slot.id === slotId ? { ...slot, personId } : slot)),
                          })),
                      }
                    : department,
            ),
        );
    }

    function addDivision(departmentId: string, name: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          hasDivisions: true,
                          staff: department.hasDivisions ? department.staff : [],
                          divisions: [...department.divisions, emptyDraftDivision(name)],
                      }
                    : {
                          ...department,
                          divisions: mapDivisionTree(department.divisions, departmentId, (division) => ({
                              ...division,
                              divisions: [...division.divisions, emptyDraftDivision(name)],
                          })),
                      },
            ),
        );
    }

    function removeDepartment(departmentId: string) {
        setDepartments((current) => current.filter((department) => department.id !== departmentId));
        if (selectedNodeId === departmentId) setSelectedNodeId('company');
    }

    function removeDivision(departmentId: string, divisionId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId ? { ...department, divisions: removeDivisionFromTree(department.divisions, divisionId) } : department,
            ),
        );
        if (selectedNodeId === divisionId) setSelectedNodeId('company');
    }

    function reset() {
        setDepartments([]);
        setAddDeptOpen(false);
        setIsReconfiguring(false);
        setIsUpdatingSavedStructure(false);
        setBranchChoice(null);
        setBranches(DEFAULT_BRANCHES);
        setSelectedBranch('');
        setSelectedNodeId('company');
        setBranchPreviewExpanded(false);
        setStructurePreviewExpanded(false);
        setPositionPreviewExpanded(false);
    }

    const cabang = branchChoice === 'existing' ? (branches.find((branch) => branch.value === selectedBranch)?.name ?? '') : DEFAULT_BRANCHES[0].name;
    const cabangOptions = branches.map((branch) => branch.name);
    const canProceedStep1 = branchChoice === 'existing' ? selectedBranch !== '' : branchChoice !== null;

    return {
        cabang,
        cabangOptions,
        departments,
        addDeptOpen,
        isReconfiguring,
        isUpdatingSavedStructure,
        branchChoice,
        branches,
        selectedBranch,
        selectedNodeId,
        branchPreviewExpanded,
        structurePreviewExpanded,
        positionPreviewExpanded,
        taken: pickedPersonIds(departments),
        canProceedStep1,
        setAddDeptOpen,
        setBranchChoice,
        setSelectedBranch: selectBranch,
        setSelectedNodeId,
        setBranchPreviewExpanded,
        setStructurePreviewExpanded,
        setPositionPreviewExpanded,
        addBranch,
        removeBranch,
        addDepartment,
        addDepartments,
        addDivision,
        removeDepartment,
        removeDivision,
        addPosition,
        removePosition,
        setDepartmentHead,
        addStaffSlot,
        removeStaffSlot,
        setStaffPerson,
        setDivisionHead,
        addDivisionStaffSlot,
        removeDivisionStaffSlot,
        setDivisionStaffPerson,
        reset,
        toOrgTree: () => toOrgTree(departments),
    };
}
