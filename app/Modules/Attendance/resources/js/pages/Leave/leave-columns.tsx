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
import { type LeaveRequest, type LeaveStatus, type LeaveType } from './leave-data';

const typeStyles: Record<LeaveType, string> = {
    Cuti: 'border-[#A8D7F9] bg-[#F5FAFF] text-[#1980C0]',
    Izin: 'border-[#7EDCC4] bg-[#F3FDFA] text-[#0F9F87]',
};

const statusStyles: Record<LeaveStatus, string> = {
    Menunggu: 'border-[#F5CF86] bg-[#FFFBF2] text-[#B97C0A]',
    Disetujui: 'border-[#7EDCC4] bg-[#F3FDFA] text-[#0F9F87]',
    Ditolak: 'border-[#F6A9A9] bg-[#FFF7F7] text-[#D14343]',
};

export type LeaveRowActions = {
    onDecide: (row: LeaveRequest, status: 'Disetujui' | 'Ditolak') => void;
    onDetail: (row: LeaveRequest) => void;
    onEdit: (row: LeaveRequest) => void;
    onDelete: (row: LeaveRequest) => void;
};

function Chip({ className, children }: { className: string; children: string }) {
    return (
        <span className={cn('font-poppins inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}>
            {children}
        </span>
    );
}

export function buildLeaveColumns(actions: LeaveRowActions): Column<LeaveRequest>[] {
    return [
        { key: 'employeeId', label: 'ID' },
        { key: 'name', label: 'Nama Karyawan' },
        { key: 'organization', label: 'Organisasi' },
        { key: 'requestedAt', label: 'Tgl Pengajuan' },
        {
            key: 'type',
            label: 'Pengajuan',
            render: (row) => <Chip className={typeStyles[row.type]}>{row.type}</Chip>,
        },
        {
            key: 'period',
            label: 'Periode',
            render: (row) => (
                <div className="flex flex-col">
                    <span>{row.period}</span>
                    <span className="text-xs text-[#6B7280]">{row.days} Hari</span>
                </div>
            ),
        },
        { key: 'reason', label: 'Keterangan' },
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
