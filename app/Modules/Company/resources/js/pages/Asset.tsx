import { type FilterConfig, type SearchConfig, DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Filter, PackageSearch } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { AddAssetMenu } from '../components/asset/add-asset-menu';
import { type NewCompanyAssetValues } from '../components/asset/add-company-asset-dialog';
import { AssetFilterDialog } from '../components/asset/asset-filter-dialog';
import { createAssetColumns } from '../components/asset/asset-columns';
import { AssetStatCards } from '../components/asset/asset-stat-cards';
import { type EmployeeLoanFormState } from '../components/asset/employee-loan-form-dialog';
import { ASSET_TABS, BRANCH_OPTIONS, type AssetTab } from '../lib/asset-catalog';
import { type Asset, formatDateDMY, generateDummyAssets } from '../lib/asset-dummy-data';
import { EMPTY_ASSET_FILTER, isAssetFilterActive, matchesAssetFilter } from '../lib/asset-filter';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manajemen Aset', href: '/company/asset' }];

const assetSearch: SearchConfig = { keys: ['name', 'id'], placeholder: 'Cari nama atau id aset…' };
const assetFilters: FilterConfig[] = [{ key: 'branch', type: 'select', label: 'Cabang', options: BRANCH_OPTIONS }];

export default function Asset() {
    const [activeTab, setActiveTab] = useState<AssetTab>('company');
    const [assets, setAssets] = useState<Asset[]>(() => generateDummyAssets());
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterValue, setFilterValue] = useState(EMPTY_ASSET_FILTER);

    // Counts up from the initial dummy set's size so newly added rows get an id
    // that never collides with an existing one, even after deletes.
    const nextSequenceRef = useRef(assets.length);
    function nextAssetId() {
        nextSequenceRef.current += 1;
        return `EM${String(9000 + nextSequenceRef.current).padStart(4, '0')}`;
    }

    const handleAddCompanyAsset = (values: NewCompanyAssetValues) => {
        const newAsset: Asset = {
            id: nextAssetId(),
            category: values.category,
            name: values.name,
            totalUnits: values.quantity,
            loanedUnits: 0,
            availableUnits: values.quantity,
            procurementDate: formatDateDMY(values.procurementDate),
            branch: values.branch,
            photoUrl: values.photoUrl,
        };
        setAssets((prev) => [newAsset, ...prev]);
    };

    const handleAddEmployeeLoan = (values: EmployeeLoanFormState) => {
        const quantity = Number(values.quantity);
        const newAsset: Asset = {
            id: nextAssetId(),
            category: values.category,
            name: values.name,
            totalUnits: quantity,
            loanedUnits: quantity,
            availableUnits: 0,
            procurementDate: formatDateDMY(values.loanDate),
            branch: values.branch,
        };
        setAssets((prev) => [newAsset, ...prev]);
    };

    const handleUpdateEmployeeLoan = (assetId: string, values: EmployeeLoanFormState) => {
        setAssets((prev) =>
            prev.map((asset) => {
                if (asset.id !== assetId) return asset;
                const loanedUnits = Number(values.quantity);
                // The form only captures the loaned quantity, not a separate total —
                // keep totalUnits at least as large as what's loaned out.
                const totalUnits = Math.max(asset.totalUnits, loanedUnits);
                return {
                    ...asset,
                    branch: values.branch,
                    category: values.category,
                    name: values.name,
                    loanedUnits,
                    totalUnits,
                    availableUnits: totalUnits - loanedUnits,
                };
            }),
        );
    };

    const handleReturnAsset = (assetId: string) => {
        setAssets((prev) =>
            prev.map((asset) =>
                asset.id === assetId ? { ...asset, availableUnits: asset.availableUnits + asset.loanedUnits, loanedUnits: 0 } : asset,
            ),
        );
    };

    const handleDeleteAsset = (assetId: string) => {
        setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    };

    const columns = useMemo(
        () => createAssetColumns({ onUpdate: handleUpdateEmployeeLoan, onReturn: handleReturnAsset, onDelete: handleDeleteAsset }),
        [],
    );

    const filteredAssets = useMemo(() => assets.filter((asset) => matchesAssetFilter(asset, filterValue)), [assets, filterValue]);
    const filterActive = isAssetFilterActive(filterValue);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Aset" />

            <div className="space-y-4 p-6">
                <AssetStatCards assets={assets} />

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssetTab)} className="flex flex-col gap-4">
                    <TabsList variant="pill">
                        {ASSET_TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} variant="pill">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="company">
                        <DataTable
                            columns={columns}
                            data={filteredAssets}
                            search={assetSearch}
                            filters={assetFilters}
                            actions={
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setFilterOpen(true)}
                                        aria-label="Filter"
                                        title="Filter"
                                        className={cn(
                                            'flex size-9 cursor-pointer items-center justify-center rounded-lg border transition-colors',
                                            filterActive
                                                ? 'border-[#1980C0] text-[#1980C0]'
                                                : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]',
                                        )}
                                    >
                                        <Filter className="size-4" />
                                    </button>
                                    <AddAssetMenu onAddCompanyAsset={handleAddCompanyAsset} onAddEmployeeLoan={handleAddEmployeeLoan} />
                                </>
                            }
                        />
                    </TabsContent>

                    <TabsContent value="employee-loan">
                        <EmptyState
                            icon={PackageSearch}
                            title="Belum Ada Data"
                            description="Fitur aset dipakai karyawan akan segera hadir."
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <AssetFilterDialog open={filterOpen} onOpenChange={setFilterOpen} value={filterValue} onApply={setFilterValue} />
        </AppLayout>
    );
}
