import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';

import { DepartmentStep } from '@/components/design-system/pop-up/create-structure/department-step';
import { OrganizationStructureStep } from '@/components/design-system/pop-up/create-structure/organization-structure-step';
import { PositionStep } from '@/components/design-system/pop-up/create-structure/position-step';
import { StructureStep } from '@/components/design-system/pop-up/create-structure/structure-step';
import { useStructureDraft } from '@/components/design-system/pop-up/create-structure/use-structure-draft';
import { Step, StepForm } from '@/components/step-form';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useCompanyStructure } from '../../hooks/use-company-structure';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Struktur Organisasi',
        href: '/company/structure',
    },
    {
        title: 'Atur Struktur',
        href: '/company/structure/create',
    },
];

export default function CreateCompanyStructure() {
    const {
        cabang,
        cabangOptions,
        ceo,
        departments,
        hasStructure,
        saveStructure,
    } = useCompanyStructure();

    const hasSavedCabang = hasStructure && cabangOptions.length > 0;

    const savedStructure = useMemo(
        () =>
            hasStructure && ceo
                ? {
                      cabang,
                      cabangOptions,
                      ceo,
                      departments,
                  }
                : null,
        [hasStructure, ceo, cabang, cabangOptions, departments],
    );

    const draft = useStructureDraft(
        true,
        hasSavedCabang ? cabangOptions : [],
        savedStructure,
    );

    function handleCancel() {
        router.visit('/company/structure');
    }

    async function handleSave() {
        const tree = {
            ...draft.toOrgTree(),
            cabang: draft.cabang,
            cabangOptions: [draft.cabang],
        };

        await saveStructure(tree);

        router.visit('/company/structure');
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
                    onTogglePreview={() =>
                        draft.setBranchPreviewExpanded((current) => !current)
                    }
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
                    onTogglePreview={() =>
                        draft.setStructurePreviewExpanded((current) => !current)
                    }
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
                    onTogglePreview={() =>
                        draft.setPositionPreviewExpanded((current) => !current)
                    }
                    onRemoveDepartment={draft.removeDepartment}
                    onRemoveDivision={draft.removeDivision}
                    onAddPosition={draft.addPosition}
                    onRemovePosition={draft.removePosition}
                />
            ),
        },
        {
            label: 'Preview',
            content: <PositionStep departments={draft.departments} />,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Atur Struktur Organisasi" />

            <div className="flex min-h-0 flex-1 flex-col p-6">
                <div className="flex min-h-[700px] flex-1 flex-col rounded-xl bg-white p-4">
                    <StepForm
                        steps={steps}
                        title={
                            draft.isReconfiguring
                                ? 'Atur Ulang Struktur Organisasi Perusahaan'
                                : 'Struktur Organisasi Perusahaan'
                        }
                        finishLabel={
                            draft.isUpdatingSavedStructure
                                ? 'Perbarui'
                                : 'Simpan'
                        }
                        maxHeightClassName="h-full"
                        onCancel={handleCancel}
                        onFinish={handleSave}
                        compact
                        asPage
                    />
                </div>
            </div>
        </AppLayout>
    );
}