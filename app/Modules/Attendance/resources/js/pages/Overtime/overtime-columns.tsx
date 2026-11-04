import { type Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { type OvertimeRequest, type OvertimeStatus } from './overtime-data';

const statusStyles: Record<OvertimeStatus, string> = {
    Menunggu: 'border-[#F5CF86] bg-[#FFFBF2] text-[#B97C0A]',
    Disetujui: 'border-[#7EDCC4] bg-[#F3FDFA] text-[#0F9F87]',
    Ditolak: 'border-[#F6A9A9] bg-[#FFF7F7] text-[#D14343]',
};

export type OvertimeRowActions = {
    onDecide: (row: OvertimeRequest, status: 'Disetujui' | 'Ditolak') => void;
    onDetail: (row: OvertimeRequest) => void;
    onEdit: (row: OvertimeRequest) => void;
    onDelete: (row: OvertimeRequest) => void;
};

function Chip({ className, children }: { className: string; children: string }) {
    return (
        <span className={cn('font-poppins inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}>
            {children}
        </span>
    );
}

function formatRupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function buildOvertimeColumns(actions: OvertimeRowActions): Column<OvertimeRequest>[] {
    return [
        { key: 'employeeId', label: 'ID' },
        { key: 'requestedAt', label: 'Tgl Pengajuan' },
        { key: 'name', label: 'Nama Karyawan' },
        { key: 'organization', label: 'Organisasi' },
        {
            key: 'startTime',
            label: 'Jam',
            render: (row) => (
                <div className="flex flex-col">
                    <span>{`${row.startTime} - ${row.endTime}`}</span>
                    <span className="text-xs text-[#6B7280]">{`${row.hours} jam`}</span>
                </div>
            ),
        },
        { key: 'reason', label: 'Alasan' },
        {
            key: 'cost',
            label: 'Est. Biaya',
            render: (row) => formatRupiah(row.cost),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <Chip className={statusStyles[row.status]}>{row.status}</Chip>,
        },
        {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label={`Aksi untuk ${row.name}`}>
                            <MoreVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem className="font-poppins text-xs" onSelect={() => actions.onDecide(row, 'Disetujui')}>
                            Terima
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-poppins text-xs" onSelect={() => actions.onDecide(row, 'Ditolak')}>
                            Tolak
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-poppins text-xs" onSelect={() => actions.onDetail(row)}>
                            Detail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-poppins text-xs" onSelect={() => actions.onEdit(row)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-poppins text-xs text-[#E84A39] focus:text-[#E84A39]" onSelect={() => actions.onDelete(row)}>
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}
