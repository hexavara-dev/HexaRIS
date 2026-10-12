import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type Column, type FilterConfig, type SearchConfig } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createCareerRequest, deleteCareerRequest, loadCareerRequests, updateCareerDecision, updateCareerRequest } from '../storage';
import { type CareerDecisionInput, type CareerHistoryRow, type CareerRequestInput } from '../types';
import { CareerCreateDialog } from './career-create-dialog';
import { CareerDecisionDialog, CareerDetailDialog, CareerRequestDialog } from './career-dialogs';
import { CareerStatusBadge } from './career-status-badge';

function CareerActionMenu({
    row,
    onDetail,
    onEdit,
    onDelete,
    onApprove,
    onReject,
}: {
    row: CareerHistoryRow;
    onDetail: (row: CareerHistoryRow) => void;
    onEdit: (row: CareerHistoryRow) => void;
    onDelete: (row: CareerHistoryRow) => void;
    onApprove: (row: CareerHistoryRow) => void;
    onReject: (row: CareerHistoryRow) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-11 rounded-md xl:size-8" aria-label={`Aksi untuk ${row.name}`}>
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 p-0">
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="min-h-11 rounded-none px-3 py-2 text-xs xl:min-h-0"
                        disabled={row.status === 'Approved'}
                        onSelect={() => onApprove(row)}
                    >
                        Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="min-h-11 rounded-none px-3 py-2 text-xs xl:min-h-0"
                        disabled={row.status === 'Ditolak'}
                        onSelect={() => onReject(row)}
                    >
                        Tolak
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem className="min-h-11 rounded-none px-3 py-2 text-xs xl:min-h-0" onSelect={() => onEdit(row)}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem className="min-h-11 rounded-none px-3 py-2 text-xs xl:min-h-0" onSelect={() => onDetail(row)}>
                    Detail
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                    className="min-h-11 rounded-none px-3 py-2 text-xs text-[#D92D20] focus:text-[#D92D20] xl:min-h-0"
                    onSelect={() => onDelete(row)}
                >
                    Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function buildColumns(
    onDetail: (row: CareerHistoryRow) => void,
    onEdit: (row: CareerHistoryRow) => void,
    onDelete: (row: CareerHistoryRow) => void,
    onApprove: (row: CareerHistoryRow) => void,
    onReject: (row: CareerHistoryRow) => void,
): Column<CareerHistoryRow>[] {
    return [
        { key: 'employeeId', label: 'ID', sortable: true },
        { key: 'name', label: 'Nama', sortable: true },
        {
            key: 'changeType',
            label: 'Jenis',
            sortable: true,
            render: (row) => <span className="block max-w-40 leading-5 whitespace-normal">{row.changeType}</span>,
        },
        { key: 'submittedAt', label: 'Tgl Diajukan', sortable: true },
        { key: 'currentBranch', label: 'Cabang Saat Ini', sortable: true },
        { key: 'currentOrganization', label: 'Organisasi Saat Ini', sortable: true },
        { key: 'currentPosition', label: 'Posisi Jabatan Saat Ini', sortable: true },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => <CareerStatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: '',
            align: 'right',
            render: (row) => (
                <CareerActionMenu row={row} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} onApprove={onApprove} onReject={onReject} />
            ),
        },
    ];
}

const search: SearchConfig = {
    keys: ['employeeId', 'name', 'changeType', 'currentBranch', 'currentOrganization', 'currentPosition', 'status'],
    placeholder: 'Search',
};

const filters: FilterConfig[] = [
    {
        key: 'currentBranch',
        type: 'select',
        label: 'Cabang',
        options: [
            { value: 'Jakarta', label: 'Cabang: Jakarta' },
            { value: 'Surabaya', label: 'Cabang: Surabaya' },
            { value: 'Bandung', label: 'Cabang: Bandung' },
        ],
    },
];

function MobileCareerRow({
    row,
    onDetail,
    onEdit,
    onDelete,
    onApprove,
    onReject,
}: {
    row: CareerHistoryRow;
    onDetail: (row: CareerHistoryRow) => void;
    onEdit: (row: CareerHistoryRow) => void;
    onDelete: (row: CareerHistoryRow) => void;
    onApprove: (row: CareerHistoryRow) => void;
    onReject: (row: CareerHistoryRow) => void;
}) {
    const details = [
        { label: 'Jenis', value: row.changeType },
        { label: 'Tanggal Diajukan', value: row.submittedAt },
        { label: 'Cabang Saat Ini', value: row.currentBranch },
        { label: 'Organisasi Saat Ini', value: row.currentOrganization },
        { label: 'Posisi Jabatan Saat Ini', value: row.currentPosition },
    ];

    return (
        <article className="rounded-xl border border-[#E7E7E7] bg-white p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1B1B1B]">{row.name}</p>
                    <p className="mt-1 text-[11px] text-[#667085]">{row.employeeId}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <CareerStatusBadge status={row.status} />
                    <CareerActionMenu row={row} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} onApprove={onApprove} onReject={onReject} />
                </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#EEF0F3] pt-4">
                {details.map((detail, index) => (
                    <div key={detail.label} className={index === 0 ? 'col-span-2' : 'min-w-0'}>
                        <dt className="text-[11px] text-[#667085]">{detail.label}</dt>
                        <dd className="mt-1 text-xs leading-5 break-words text-[#344054]">{detail.value}</dd>
                    </div>
                ))}
            </dl>
        </article>
    );
}

export function CareerTable() {
    const [rows, setRows] = useState<CareerHistoryRow[]>(() => loadCareerRequests());
    const [requestOpen, setRequestOpen] = useState(false);
    const [detailRow, setDetailRow] = useState<CareerHistoryRow | null>(null);
    const [editRow, setEditRow] = useState<CareerHistoryRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<CareerHistoryRow | null>(null);
    const [approveRow, setApproveRow] = useState<CareerHistoryRow | null>(null);
    const [rejectRow, setRejectRow] = useState<CareerHistoryRow | null>(null);

    const columns = useMemo(() => buildColumns(setDetailRow, setEditRow, setDeleteRow, setApproveRow, setRejectRow), []);

    const approveRequest = (row: CareerHistoryRow, input: CareerDecisionInput): boolean => {
        try {
            setRows(updateCareerDecision(row.id, 'Approved', input));
            setApproveRow(null);
            toast.success('Pengajuan perubahan berhasil di-approve.');
            return true;
        } catch {
            toast.error('Pengajuan gagal di-approve. Ruang penyimpanan browser mungkin penuh.');
            return false;
        }
    };

    const rejectRequest = (row: CareerHistoryRow, input: CareerDecisionInput): boolean => {
        try {
            setRows(updateCareerDecision(row.id, 'Ditolak', input));
            setRejectRow(null);
            toast.success('Pengajuan perubahan berhasil ditolak.');
            return true;
        } catch {
            toast.error('Penolakan pengajuan gagal disimpan. Silakan coba kembali.');
            return false;
        }
    };

    const saveRequest = (input: CareerRequestInput) => {
        try {
            if (editRow) {
                setRows(updateCareerRequest(editRow.id, input));
                setEditRow(null);
                toast.success('Pengajuan karir berhasil diperbarui.');
                return;
            }

            setRows(createCareerRequest(input));
            setRequestOpen(false);
            toast.success('Pengajuan karir berhasil ditambahkan.');
        } catch {
            toast.error('Pengajuan gagal disimpan. Ruang penyimpanan browser mungkin penuh.');
        }
    };

    const deleteRequest = () => {
        if (!deleteRow) return;

        try {
            setRows(deleteCareerRequest(deleteRow.id));
            toast.success('Pengajuan karir berhasil dihapus.');
            setDeleteRow(null);
        } catch {
            toast.error('Pengajuan gagal dihapus. Silakan coba kembali.');
        }
    };

    return (
        <section id="career-history" className="min-w-0 scroll-mt-4" aria-label="Daftar riwayat karir karyawan">
            <DataTable
                columns={columns}
                data={rows}
                search={search}
                filters={filters}
                initialFilters={{ currentBranch: 'Jakarta' }}
                perPage={5}
                renderMobileRow={(row) => (
                    <MobileCareerRow
                        row={row}
                        onDetail={setDetailRow}
                        onEdit={setEditRow}
                        onDelete={setDeleteRow}
                        onApprove={setApproveRow}
                        onReject={setRejectRow}
                    />
                )}
                actions={
                    <Button
                        type="button"
                        size="sm"
                        className="h-11 w-full rounded-md bg-[#198AC5] px-4 text-xs sm:h-9 sm:w-auto"
                        onClick={() => setRequestOpen(true)}
                    >
                        <Plus className="size-4" />
                        Tambah Pengajuan
                    </Button>
                }
            />
            <CareerCreateDialog open={requestOpen} onOpenChange={setRequestOpen} onSubmit={saveRequest} />
            <CareerRequestDialog
                open={editRow !== null}
                initialValue={editRow}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditRow(null);
                    }
                }}
                onSubmit={saveRequest}
            />
            <CareerDetailDialog row={detailRow} onOpenChange={(open) => !open && setDetailRow(null)} />
            <CareerDecisionDialog
                row={approveRow}
                action="approve"
                onOpenChange={(open) => !open && setApproveRow(null)}
                onDecision={approveRequest}
            />
            <CareerDecisionDialog row={rejectRow} action="reject" onOpenChange={(open) => !open && setRejectRow(null)} onDecision={rejectRequest} />
            <ConfirmDialog
                open={deleteRow !== null}
                onOpenChange={(open) => !open && setDeleteRow(null)}
                onConfirm={deleteRequest}
                title="Hapus Perubahan Karyawan?"
                description="Anda akan menghapus data Pengajuan Perubahan Karyawan ini secara permanen. Tindakan ini tidak dapat dibatalkan dan seluruh informasi terkait akan hilang."
                cancelLabel="Batal"
                confirmLabel="Hapus"
                destructive={false}
                showCloseButton={false}
                contentClassName="font-poppins sm:max-w-md"
                actionsClassName="grid grid-cols-2 gap-2 sm:grid sm:space-x-0"
            />
        </section>
    );
}
