import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Filter, PackageSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AddAssetMenu } from '../components/asset/add-asset-menu';
import { assetColumns } from '../components/asset/asset-columns';
import { AssetStatCards } from '../components/asset/asset-stat-cards';
import { ASSET_TABS, BRANCH_OPTIONS, type AssetTab } from '../lib/asset-catalog';
import { generateDummyAssets } from '../lib/asset-dummy-data';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manajemen Aset', href: '/company/asset' }];

export default function Asset() {
    const [activeTab, setActiveTab] = useState<AssetTab>('company');
    const assets = useMemo(() => generateDummyAssets(), []);

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
                            columns={assetColumns}
                            data={assets}
                            search={{ keys: ['name', 'id'], placeholder: 'Search' }}
                            filters={[{ key: 'branch', type: 'select', label: 'Cabang', options: BRANCH_OPTIONS }]}
                            actions={
                                <>
                                    <button
                                        type="button"
                                        onClick={() => toast('Segera hadir')}
                                        aria-label="Filter"
                                        title="Filter"
                                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
                                    >
                                        <Filter className="size-4" />
                                    </button>
                                    <AddAssetMenu />
                                </>
                            }
                            rowActions={() => [{ label: 'Detail', onClick: () => toast('Segera hadir') }]}
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
        </AppLayout>
    );
}
