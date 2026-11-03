import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type FilterConfig, type SearchConfig } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildLeaveColumns, type LeaveRowActions } from './leave-columns';
import { LeaveCreateDialog, type LeaveFormValues } from './leave-create-dialog';
import { leaveRequests, type LeaveRequest } from './leave-data';
import { LeaveDetailDialog } from './leave-detail-dialog';

const search: SearchConfig = {
    keys: ['employeeId', 'name', 'organization', 'reason'],
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

export function LeaveTable() {
    const [rows, setRows] = useState<LeaveRequest[]>(leaveRequests);
    const [detailRow, setDetailRow] = useState<LeaveRequest | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow] = useState<LeaveRequest | null>(null);
    const [deleteRow, setDeleteRow] = useState<LeaveRequest | null>(null);

    const openEdit = useCallback((row: LeaveRequest) => {
        setEditRow(row);
        setCreateOpen(true);
    }, []);

    const decide = useCallback((row: LeaveRequest, status: 'Disetujui' | 'Ditolak') => {
        setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status } : item)));
        toast.success(status === 'Disetujui' ? 'Berhasil Diterima' : 'Berhasil Ditolak');
    }, []);

    const actions = useMemo<LeaveRowActions>(
        () => ({ onDecide: decide, onDetail: setDetailRow, onEdit: openEdit, onDelete: setDeleteRow }),
        [decide, openEdit],
    );
    const columns = useMemo(() => buildLeaveColumns(actions), [actions]);

    // The detail dialog's Simpan applies the same decision as the row menu.
    const saveDecision = (decision: 'reject' | 'accept') => {
        if (detailRow) decide(detailRow, decision === 'accept' ? 'Disetujui' : 'Ditolak');
        setDetailRow(null);
    };

    const saveForm = (values: LeaveFormValues) => {
        // Employee-linked fields come from the matching mock employee, since the form only picks a name.
        const base = leaveRequests.find((request) => request.name === values.name) ?? leaveRequests[0];
        const fields = {
            name: values.name,
            employeeId: base.employeeId,
            organization: base.organization,
            branch: base.branch,
            type: values.type,
            period: values.period,
            days: values.days,
            reason: values.reason,
        };

        if (editRow) {
            setRows((current) => current.map((item) => (item.id === editRow.id ? { ...item, ...fields } : item)));
        } else {
            const requestedAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            setRows((current) => [{ ...fields, id: `leave-${Date.now()}`, requestedAt, status: 'Menunggu' }, ...current]);
        }

        setCreateOpen(false);
        toast.success(editRow ? 'Pengajuan berhasil diperbarui' : 'Pengajuan berhasil ditambahkan');
    };

    const deleteLeave = () => {
        if (!deleteRow) return;

        setRows((current) => current.filter((row) => row.id !== deleteRow.id));
        setDeleteRow(null);
        toast.success('Pengajuan berhasil dihapus.');
    };

    return (
        <section aria-label="Daftar pengajuan izin dan cuti" className="font-poppins">
            <DataTable
                columns={columns}
                data={rows}
                search={search}
                filters={filters}
                filtersFirst
                initialFilters={{ branch: 'Jakarta' }}
                perPage={10}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-md border-[#E3E8EF] bg-white hover:bg-[#F8FAFC]"
                            aria-label="Filter pengajuan"
                        >
                            <SlidersHorizontal className="size-4 text-[#374151]" />
                        </Button>
                        <Button
                            type="button"
                            className="h-9 gap-1.5 rounded-lg bg-[#1980C0] px-4 text-white hover:bg-[#1570AA]"
                            onClick={() => {
                                setEditRow(null);
                                setCreateOpen(true);
                            }}
                        >
                            <Plus className="size-4" />
                            Izin/Cuti
                        </Button>
                    </div>
                }
            />
            <LeaveDetailDialog
                key={detailRow?.id}
                request={detailRow}
                onOpenChange={(open) => !open && setDetailRow(null)}
                onSave={saveDecision}
            />
            <LeaveCreateDialog open={createOpen} request={editRow ?? undefined} onOpenChange={setCreateOpen} onSubmit={saveForm} />
            <ConfirmDialog
                open={deleteRow !== null}
                onOpenChange={(open) => !open && setDeleteRow(null)}
                onConfirm={deleteLeave}
                title="Hapus Pengajuan?"
                description={
                    deleteRow
                        ? `Pengajuan ${deleteRow.name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                        : undefined
                }
                confirmLabel="Hapus"
                cancelLabel="Batal"
                contentClassName="font-poppins"
            />
        </section>
    );
}
