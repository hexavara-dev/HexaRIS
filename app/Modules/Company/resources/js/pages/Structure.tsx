import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { OrgStructureEmptyState } from '@/components/design-system/empty-state/org-structure-empty-state';
import { type OrgDepartment, type OrgTree } from '@/components/design-system/org-chart/org-chart';
import { CreateStructureDialog } from '@/components/design-system/pop-up/create-structure-dialog';
import { DepartmentDetailPanel } from '@/components/design-system/pop-up/department-detail-panel';
import { EditDepartmentDialog, shortName } from '@/components/design-system/pop-up/edit-department-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { OrgChartPanel } from '../components/OrgChartPanel';
import { StructureTable } from '../components/StructureTable';
import { useCompanyStructure } from '../hooks/use-company-structure';
import { departmentPositionStats, departmentToStaff, toStructureGroups } from '../lib/structure-transforms';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Struktur Organisasi', href: '/company/structure' }];

const TABS = [
    { value: 'bagan', label: 'Bagan Struktur' },
    { value: 'tabel', label: 'Tabel Struktur' },
] as const;

export default function CompanyStructure() {
    const {
        cabang,
        cabangOptions,
        ceo,
        departments,
        hasStructure,
        findDepartmentByLabel,
        saveDepartment,
        deleteDepartment,
        saveStructure,
        setCabang,
    } = useCompanyStructure();
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['value']>('bagan');
    const [selectedDepartment, setSelectedDepartment] = useState<OrgDepartment | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<OrgDepartment | null>(null);
    const [creatingStructure, setCreatingStructure] = useState(false);

    const structureGroups = useMemo(() => toStructureGroups(departments), [departments]);
    const hasSavedCabang = hasStructure && cabangOptions.length > 0;

    function handleDepartmentSaved(updated: OrgDepartment) {
        saveDepartment(editingDepartment, updated);
        setSelectedDepartment(null);
        setEditingDepartment(null);
    }

    function handleStructureCreated(tree: OrgTree) {
        saveStructure(tree);
        setCreatingStructure(false);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Struktur Organisasi" />

            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as (typeof TABS)[number]['value'])}
                className="flex h-full flex-1 flex-col gap-6 p-6"
            >
                <div className="flex w-full items-end justify-between">
                    <TabsList variant="line">
                        {TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} variant="line">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <Button className="h-auto gap-2 rounded-lg px-4 py-2 text-xs" onClick={() => setCreatingStructure(true)}>
                        <Plus className="size-4" />
                        {hasSavedCabang ? 'Atur Ulang Struktur' : 'Atur Struktur'}
                    </Button>
                </div>

                {!hasStructure || !ceo ? (
                    <OrgStructureEmptyState />
                ) : (
                    <>
                        <TabsContent value="bagan">
                            <OrgChartPanel
                                cabang={cabang}
                                cabangOptions={cabangOptions}
                                ceo={ceo}
                                departments={departments}
                                onCabangChange={setCabang}
                            />
                        </TabsContent>
                        <TabsContent value="tabel">
                            <StructureTable
                                groups={structureGroups}
                                cabang={cabang}
                                cabangOptions={cabangOptions}
                                onCabangChange={setCabang}
                                onDetail={(label) => setSelectedDepartment(findDepartmentByLabel(label) ?? null)}
                                onDelete={deleteDepartment}
                            />
                        </TabsContent>
                    </>
                )}
            </Tabs>

            <DepartmentDetailPanel
                open={selectedDepartment !== null}
                onOpenChange={(open) => !open && setSelectedDepartment(null)}
                departmentName={selectedDepartment?.name ?? ''}
                headName={selectedDepartment?.head?.name ?? selectedDepartment?.members?.[0]?.name ?? ''}
                headRole={selectedDepartment?.head?.role ?? selectedDepartment?.members?.[0]?.role ?? ''}
                headAvatarUrl={selectedDepartment?.head?.avatarUrl ?? selectedDepartment?.members?.[0]?.avatarUrl}
                positionStats={selectedDepartment ? departmentPositionStats(selectedDepartment) : []}
                staff={selectedDepartment ? departmentToStaff(selectedDepartment) : []}
                onEdit={() => {
                    setEditingDepartment(selectedDepartment);
                    setSelectedDepartment(null);
                }}
            />

            <EditDepartmentDialog
                open={editingDepartment !== null}
                onOpenChange={(open) => !open && setEditingDepartment(null)}
                department={editingDepartment}
                siblingDepartmentNames={departments
                    .filter((sibling) => sibling.name !== editingDepartment?.name)
                    .map((sibling) => shortName(sibling.name))}
                onSave={handleDepartmentSaved}
            />

            <CreateStructureDialog
                open={creatingStructure}
                onOpenChange={setCreatingStructure}
                onSave={handleStructureCreated}
                hasSavedCabang={hasSavedCabang}
                savedCabangOptions={cabangOptions}
                savedStructure={hasStructure && ceo ? { cabang, cabangOptions, ceo, departments } : null}
            />
        </AppLayout>
    );
}
