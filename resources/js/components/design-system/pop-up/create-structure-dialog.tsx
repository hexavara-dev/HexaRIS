import { StepForm, type Step } from '@/components/step-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DepartmentStep } from './create-structure/department-step';
import { OrganizationStructureStep } from './create-structure/organization-structure-step';
import { PositionStep } from './create-structure/position-step';
import { StructureStep } from './create-structure/structure-step';
import { type CreateStructureDialogProps } from './create-structure/types';
import { useStructureDraft } from './create-structure/use-structure-draft';

export function CreateStructureDialog({
    open,
    onOpenChange,
    onSave,
    hasSavedCabang = false,
    savedCabangOptions = [],
    savedStructure = null,
}: CreateStructureDialogProps) {
    const draft = useStructureDraft(open, hasSavedCabang ? savedCabangOptions : [], savedStructure);

    function resetAndClose() {
        draft.reset();
        onOpenChange(false);
    }

    function handleSave() {
        onSave({ ...draft.toOrgTree(), cabang: draft.cabang, cabangOptions: [draft.cabang] });
        resetAndClose();
    }

    const steps: Step[] = [
        {
            label: 'Cabang',
            canProceed: draft.canProceedStep1,
            content: (
                <StructureStep
                    branchChoice={draft.branchChoice}
                    branches={draft.branches}
                    departments={draft.departments}
                    hasSavedCabang={hasSavedCabang}
                    selectedBranch={draft.selectedBranch}
                    selectedNodeId={draft.selectedNodeId}
                    previewExpanded={draft.branchPreviewExpanded}
                    onBranchChoiceChange={draft.setBranchChoice}
                    onSelectBranch={draft.setSelectedBranch}
                    onAddBranch={draft.addBranch}
                    onRemoveBranch={draft.removeBranch}
                    onSelectNode={draft.setSelectedNodeId}
                    onTogglePreview={() => draft.setBranchPreviewExpanded((current) => !current)}
                    onOpenAddDepartment={() => draft.setAddDeptOpen(true)}
                />
            ),
        },
        {
            label: 'Struktur',
            content: (
                <OrganizationStructureStep
                    departments={draft.departments}
                    selectedId={draft.selectedNodeId}
                    previewExpanded={draft.structurePreviewExpanded}
                    onSelect={draft.setSelectedNodeId}
                    onTogglePreview={() => draft.setStructurePreviewExpanded((current) => !current)}
                    onAddDepartment={draft.addDepartment}
                    onAddDivision={draft.addDivision}
                    onRemoveDepartment={draft.removeDepartment}
                    onRemoveDivision={draft.removeDivision}
                />
            ),
        },
        {
            label: 'Posisi Jabatan',
            content: (
                <DepartmentStep
                    departments={draft.departments}
                    selectedId={draft.selectedNodeId}
                    previewExpanded={draft.positionPreviewExpanded}
                    onSelect={draft.setSelectedNodeId}
                    onTogglePreview={() => draft.setPositionPreviewExpanded((current) => !current)}
                    onRemoveDepartment={draft.removeDepartment}
                    onRemoveDivision={draft.removeDivision}
                    onAddPosition={draft.addPosition}
                    onRemovePosition={draft.removePosition}
                />
            ),
        },
        { label: 'Preview', content: <PositionStep departments={draft.departments} /> },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => !next && resetAndClose()}>
                <DialogContent
                    className="flex max-h-[calc(100vh-1.5rem)] w-[min(1320px,calc(100vw-1.5rem))] max-w-none flex-col gap-0 overflow-hidden"
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    <StepForm
                        steps={steps}
                        title={draft.isReconfiguring ? 'Atur Ulang Struktur Organisasi Perusahaan' : 'Struktur Organisasi Perusahaan'}
                        finishLabel={draft.isUpdatingSavedStructure ? 'Perbarui' : 'Simpan'}
                        onCancel={resetAndClose}
                        onFinish={handleSave}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
