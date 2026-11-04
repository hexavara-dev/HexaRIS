import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type Column, type FilterConfig, type SearchConfig } from '@/components/data-table';
import {
    type AttendanceDetailRow,
    type AttendanceStatusVariant,
    DialogAttendanceDetail,
} from '@/components/design-system/pop-up/dialog-attendance-detail';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AttendanceFilterPanel, type AttendanceFilterValue, defaultAttendanceFilter } from './attendance-filter-panel';
import { AttendanceStatusBadge } from './attendance-status-badge';
import { attendanceRows } from './data';
import { type AttendanceRow, type AttendanceStatus } from './types';

const detailStatusVariant: Record<AttendanceStatus, AttendanceStatusVariant> = {
    'On Time': 'success',
    Terlambat: 'warning',
    Cuti: 'info',
    Izin: 'purple',
    Alpha: 'danger',
};

function buildColumns(
    onDetail: (row: AttendanceRow) => void,
    onDelete: (row: AttendanceRow) => void,
): Column<AttendanceRow>[] {
    return [
        { key: 'employeeId', label: 'ID' },
        { key: 'name', label: 'Nama Karyawan' },
        { key: 'organization', label: 'Organisasi' },
        { key: 'date', label: 'Tanggal Absen' },
        { key: 'shift', label: 'Jam Kerja' },
        { key: 'checkIn', label: 'Check In' },
        { key: 'checkOut', label: 'Check Out' },
        { key: 'totalHours', label: 'Total Jam' },
        { key: 'location', label: 'Lokasi' },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <AttendanceStatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Aksi untuk ${row.name}`}>
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="font-poppins text-xs" onSelect={() => onDetail(row)}>
                                Detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="font-poppins text-xs">Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="font-poppins text-xs text-[#E84A39] focus:text-[#E84A39]" onSelect={() => onDelete(row)}>
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];
}

const search: SearchConfig = {
    keys: ['employeeId', 'name', 'organization', 'location'],
    placeholder: 'Search',
};

const filters: FilterConfig[] = [
    {
        key: 'branch',
        type: 'select',
        label: 'Cabang',
        options: [
            { value: 'Jakarta', label: 'Cabang: Jakarta' },
            { value: 'Surabaya', label: 'Cabang: Surabaya' },
            { value: 'Bandung', label: 'Cabang: Bandung' },
        ],
    },
];

export function AttendanceTable() {
    const [rows, setRows] = useState<AttendanceRow[]>(attendanceRows);
    const [filter, setFilter] = useState<AttendanceFilterValue>(defaultAttendanceFilter);
    const [detailRow, setDetailRow] = useState<AttendanceRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<AttendanceRow | null>(null);

    const columns = useMemo(() => buildColumns(setDetailRow, setDeleteRow), []);

    const organizations = useMemo(() => [...new Set(rows.map((row) => row.organization))], [rows]);

    const visibleRows = useMemo(
        () =>
            rows.filter(
                (row) =>
                    (filter.organization === 'all' || row.organization === filter.organization) &&
                    (filter.statuses.length === 0 || filter.statuses.includes(row.status)),
            ),
        [rows, filter],
    );

    const detailItems: AttendanceDetailRow[] = detailRow
        ? [
              { label: 'Cabang', value: detailRow.branch },
              { label: 'Posisi Jabatan', value: detailRow.position ?? '-' },
              { label: 'Nama Karyawan', value: detailRow.name },
              { label: 'Tanggal Absen', value: detailRow.date },
              { label: 'Organisasi', value: detailRow.organization },
              { label: 'Jadwal Shift', value: detailRow.shift },
          ]
        : [];

    const deleteAttendance = () => {
        if (!deleteRow) return;

        setRows((current) => current.filter((row) => row.id !== deleteRow.id));
        setDeleteRow(null);
        toast.success('Data absensi berhasil dihapus.');
    };

    return (
        <section aria-label="Daftar absensi karyawan">
            <DataTable
                columns={columns}
                data={visibleRows}
                search={search}
                filters={filters}
                filtersFirst
                initialFilters={{ branch: 'Jakarta' }}
                perPage={10}
                actions={<AttendanceFilterPanel value={filter} organizations={organizations} onApply={setFilter} />}
            />
            <DialogAttendanceDetail
                open={detailRow !== null}
                onOpenChange={(open) => !open && setDetailRow(null)}
                status={{
                    label: detailRow?.status ?? 'On Time',
                    variant: detailRow ? detailStatusVariant[detailRow.status] : 'success',
                }}
                details={detailItems}
                checkIn={detailRow ? { time: detailRow.checkIn } : undefined}
                checkOut={detailRow ? { time: detailRow.checkOut } : undefined}
                summary={detailRow ? { totalHours: detailRow.totalHours, location: detailRow.location, note: '-' } : undefined}
            />
            <ConfirmDialog
                open={deleteRow !== null}
                onOpenChange={(open) => !open && setDeleteRow(null)}
                onConfirm={deleteAttendance}
                title="Hapus Data Absensi?"
                description={
                    deleteRow
                        ? `Data absensi ${deleteRow.name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                        : undefined
                }
                confirmLabel="Hapus"
                cancelLabel="Batal"
                contentClassName="font-poppins"
            />
        </section>
    );
}
