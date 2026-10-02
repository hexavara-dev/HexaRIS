import { type OrgTree } from '@/components/design-system/org-chart/org-chart';

export interface StaffSlot {
    id: string;
    personId: string | null;
}

export type PositionType = 'single' | 'multi';

export interface DraftPosition {
    id: string;
    name: string;
    type: PositionType;
    reportTo: string;
}

export type PositionInput = Omit<DraftPosition, 'id'>;

export interface DraftDivision {
    id: string;
    name: string;
    headPersonId: string | null;
    staff: StaffSlot[];
    divisions: DraftDivision[];
    positions: DraftPosition[];
}

export interface DraftDepartment {
    id: string;
    name: string;
    hasDivisions: boolean;
    headPersonId: string | null;
    staff: StaffSlot[];
    divisions: DraftDivision[];
    positions: DraftPosition[];
}

export type BranchChoice = 'existing' | 'new' | null;

export interface BranchOption {
    value: string;
    name: string;
    address: string;
}

export interface CreateStructureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tree: OrgTree) => void;
    hasSavedCabang?: boolean;
    savedCabangOptions?: string[];
    savedStructure?: OrgTree | null;
}
