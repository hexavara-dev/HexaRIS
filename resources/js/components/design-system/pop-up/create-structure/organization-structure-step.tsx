import { ExpandablePreviewLayout } from './expandable-preview-layout';
import { OrganizationTree } from './organization-tree';
import { StructureFlowPreview } from './structure-flow-preview';
import { type DraftDepartment } from './types';

interface OrganizationStructureStepProps {
    departments: DraftDepartment[];
    selectedId: string;
    previewExpanded: boolean;
    onSelect: (id: string) => void;
    onTogglePreview: () => void;
    onAddDepartment: (name: string) => void;
    onAddDivision: (departmentId: string, name: string) => void;
    onRemoveDepartment: (departmentId: string) => void;
    onRemoveDivision: (departmentId: string, divisionId: string) => void;
}

export function OrganizationStructureStep({
    departments,
    selectedId,
    previewExpanded,
    onSelect,
    onTogglePreview,
    onAddDepartment,
    onAddDivision,
    onRemoveDepartment,
    onRemoveDivision,
}: OrganizationStructureStepProps) {
    return (
        <ExpandablePreviewLayout
            expanded={previewExpanded}
            sidebar={
                <OrganizationTree
                    departments={departments}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAddDepartment={onAddDepartment}
                    onAddDivision={onAddDivision}
                    onRemoveDepartment={onRemoveDepartment}
                    onRemoveDivision={onRemoveDivision}
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
