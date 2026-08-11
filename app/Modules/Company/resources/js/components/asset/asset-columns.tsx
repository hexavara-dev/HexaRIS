import { type Column } from '@/components/data-table';
import { Image } from 'lucide-react';

import { type Asset } from '../../lib/asset-dummy-data';

export const assetColumns: Column<Asset>[] = [
    { key: 'id', label: 'Id Aset', sortable: true },
    { key: 'category', label: 'Kategori', sortable: true },
    {
        key: 'name',
        label: 'Nama Aset',
        sortable: true,
        render: (row) => (
            <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#F1F5F9] text-[#94A3B8]">
                    <Image className="size-4" />
                </span>
                <span>{row.name}</span>
            </div>
        ),
    },
    { key: 'totalUnits', label: 'Total Semua', sortable: true, align: 'right' },
    { key: 'loanedUnits', label: 'Total Dipinjam', sortable: true, align: 'right' },
    { key: 'availableUnits', label: 'Total Tersedia', sortable: true, align: 'right' },
    { key: 'procurementDate', label: 'Tgl Pengadaan', sortable: true },
];
