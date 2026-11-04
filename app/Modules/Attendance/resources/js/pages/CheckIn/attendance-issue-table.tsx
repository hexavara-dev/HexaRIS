import { DataTable, type Column, type SearchConfig } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type AttendanceIssue, attendanceIssues } from './attendance-issue-data';
import { AttendanceIssueConfirmDialog } from './attendance-issue-confirm-dialog';

const search: SearchConfig = {
    keys: ['employeeId', 'name', 'organization', 'location'],
    placeholder: 'Search',
};

function buildColumns(onAccept: (row: AttendanceIssue) => void, onReject: (row: AttendanceIssue) => void): Column<AttendanceIssue>[] {
    return [
        { key: 'employeeId', label: 'ID' },
        { key: 'name', label: 'Nama Karyawan' },
        { key: 'organization', label: 'Organisasi' },
        { key: 'reportedAt', label: 'Tgl Laporan' },
        { key: 'shift', label: 'Jam Kerja' },
        { key: 'location', label: 'Lokasi' },
        { key: 'checkIn', label: 'Check In' },
        { key: 'checkOut', label: 'Check Out' },
        { key: 'totalHours', label: 'Total Jam' },
        {
            key: 'attachments',
            label: 'Surat',
            render: (row) => (
                <div className="flex flex-col">
                    {row.attachments.map((file) => (
                        <a key={file} href="#" className="font-poppins text-xs text-[#1980C0] underline underline-offset-2">
                            {file}
                        </a>
                    ))}
                </div>
            ),
        },
        { key: 'reason', label: 'Keterangan' },
        {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md bg-[#1980C0] text-white hover:bg-[#1570AA] hover:text-white"
                        aria-label={`Terima laporan ${row.name}`}
                        title="Terima"
                        onClick={() => onAccept(row)}
                    >
                        <Check className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md bg-[#E84A39] text-white hover:bg-[#D2412F] hover:text-white"
                        aria-label={`Tolak laporan ${row.name}`}
                        title="Tolak"
                        onClick={() => onReject(row)}
                    >
                        <X className="size-3.5" />
                    </Button>
                </div>
            ),
        },
    ];
}

export function AttendanceIssueTable() {
    const [issues, setIssues] = useState<AttendanceIssue[]>(attendanceIssues);
    const [acceptRow, setAcceptRow] = useState<AttendanceIssue | null>(null);

    const removeIssue = (id: string) => setIssues((current) => current.filter((issue) => issue.id !== id));

    const columns = useMemo(
        () =>
            buildColumns(
                (row) => setAcceptRow(row),
                (row) => {
                    removeIssue(row.id);
                    toast.success('Berhasil Ditolak');
                },
            ),
        [],
    );

    const acceptIssue = (row: AttendanceIssue) => {
        removeIssue(row.id);
        setAcceptRow(null);
        toast.success('Berhasil Diterima');
    };

    return (
        <section aria-label="Daftar laporan masalah absensi">
            <DataTable columns={columns} data={issues} search={search} perPage={10} />
            <AttendanceIssueConfirmDialog issue={acceptRow} onOpenChange={(open) => !open && setAcceptRow(null)} onConfirm={acceptIssue} />
        </section>
    );
}
