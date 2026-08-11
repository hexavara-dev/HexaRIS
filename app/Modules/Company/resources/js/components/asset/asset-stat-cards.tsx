import { KpiStatCard } from '@/components/design-system/card/kpi-stat';
import { Boxes, PackageCheck, Repeat } from 'lucide-react';
import { useMemo } from 'react';

import { type Asset } from '../../lib/asset-dummy-data';
import { AssetHistoryCard } from './asset-history-card';

export function AssetStatCards({ assets }: { assets: Asset[] }) {
    const totals = useMemo(
        () =>
            assets.reduce(
                (acc, asset) => ({
                    total: acc.total + asset.totalUnits,
                    loaned: acc.loaned + asset.loanedUnits,
                    available: acc.available + asset.availableUnits,
                }),
                { total: 0, loaned: 0, available: 0 },
            ),
        [assets],
    );

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiStatCard label="Total Semua Aset" iconBackground="rgba(139,92,246,0.10)" icon={<Boxes className="size-5 shrink-0 text-[#8B5CF6]" />}>
                <p className="font-poppins w-fit text-2xl font-semibold text-black">{totals.total}</p>
            </KpiStatCard>
            <KpiStatCard
                label="Total Aset Dipinjam Karyawan"
                iconBackground="rgba(234,88,12,0.10)"
                icon={<Repeat className="size-5 shrink-0 text-[#EA580C]" />}
            >
                <p className="font-poppins w-fit text-2xl font-semibold text-black">{totals.loaned}</p>
            </KpiStatCard>
            <KpiStatCard
                label="Total Aset Tersedia"
                iconBackground="rgba(22,163,74,0.10)"
                icon={<PackageCheck className="size-5 shrink-0 text-[#16A34A]" />}
            >
                <p className="font-poppins w-fit text-2xl font-semibold text-black">{totals.available}</p>
            </KpiStatCard>
            <AssetHistoryCard />
        </div>
    );
}
