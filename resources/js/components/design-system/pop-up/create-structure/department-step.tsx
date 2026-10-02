import { ExpandablePreviewLayout } from './expandable-preview-layout';
import { PositionTree } from './position-tree';
import { StructureFlowPreview } from './structure-flow-preview';
import { type DraftDepartment, type PositionInput } from './types';

interface DepartmentStepProps {
    departments: DraftDepartment[];
    selectedId: string;
    previewExpanded: boolean;
    onSelect: (id: string) => void;
    onTogglePreview: () => void;
    onRemoveDepartment: (departmentId: string) => void;
    onRemoveDivision: (departmentId: string, divisionId: string) => void;
    onAddPosition: (targetId: string, input: PositionInput) => void;
    onRemovePosition: (targetId: string, positionId: string) => void;
}

export function DepartmentStep({
    departments,
    selectedId,
    previewExpanded,
    onSelect,
    onTogglePreview,
    onRemoveDepartment,
    onRemoveDivision,
    onAddPosition,
    onRemovePosition,
}: DepartmentStepProps) {
    return (
        <ExpandablePreviewLayout
            expanded={previewExpanded}
            sidebar={
                <PositionTree
                    departments={departments}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onRemoveDepartment={onRemoveDepartment}
                    onRemoveDivision={onRemoveDivision}
                    onAddPosition={onAddPosition}
                    onRemovePosition={onRemovePosition}
                />
            }
            preview={
                <StructureFlowPreview
                    mode="dynamic"
                    departments={departments}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    expanded={previewExpanded}
                    onToggleExpanded={onTogglePreview}
                />
            }
        />
    );
}
