import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type FilterConfig, type SearchConfig } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildOvertimeColumns, type OvertimeRowActions } from './overtime-columns';
import { type OvertimeRequest, overtimeRequests } from './overtime-data';
import { OvertimeDetailDialog } from './overtime-detail-dialog';
import { OvertimeFilterPanel, type OvertimeFilterValue, defaultOvertimeFilter } from './overtime-filter-panel';
import { OvertimeFormDialog, type OvertimeFormValues } from './overtime-form-dialog';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseRequestedAt(label: string): number | null {
    const time = Date.parse(label);
    return Number.isNaN(time) ? null : time;
}

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

export default function OvertimeTable() {
    const [rows, setRows] = useState<OvertimeRequest[]>(overtimeRequests);
    const [filter, setFilter] = useState<OvertimeFilterValue>(defaultOvertimeFilter);

    const organizations = useMemo(() => [...new Set(rows.map((row) => row.organization))], [rows]);

    const visibleRows = useMemo(() => {
        const now = Date.now();
        const fromTime = filter.from ? Date.parse(filter.from) : null;
        const toTime = filter.to ? Date.parse(filter.to) + DAY_MS - 1 : null;

        return rows.filter((row) => {
            if (filter.organization !== 'all' && row.organization !== filter.organization) return false;
            if (filter.statuses.length > 0 && !filter.statuses.includes(row.status)) return false;

            const requested = parseRequestedAt(row.requestedAt);
            if (requested === null) return true;
            if (filter.period === 'last7' && requested < now - 7 * DAY_MS) return false;
            if (filter.period === 'last30' && requested < now - 30 * DAY_MS) return false;
            if (filter.period === 'custom') {
                if (fromTime !== null && requested < fromTime) return false;
                if (toTime !== null && requested > toTime) return false;
            }
            return true;
        });
    }, [rows, filter]);
    const [detailRow, setDetailRow] = useState<OvertimeRequest | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editRow, setEditRow] = useState<OvertimeRequest | null>(null);
    const [deleteRow, setDeleteRow] = useState<OvertimeRequest | null>(null);

    const openEdit = useCallback((row: OvertimeRequest) => {
        setEditRow(row);
        setFormOpen(true);
    }, []);

    const decide = useCallback((row: OvertimeRequest, status: 'Disetujui' | 'Ditolak') => {
        setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status } : item)));
        toast.success(status === 'Disetujui' ? 'Berhasil Diterima' : 'Berhasil Ditolak');
    }, []);

    const actions = useMemo<OvertimeRowActions>(
        () => ({ onDecide: decide, onDetail: setDetailRow, onEdit: openEdit, onDelete: setDeleteRow }),
        [decide, openEdit],
    );
    const columns = useMemo(() => buildOvertimeColumns(actions), [actions]);

    // The detail dialog's Simpan applies the same decision as the row menu.
    const saveDecision = (decision: 'reject' | 'accept') => {
        if (detailRow) decide(detailRow, decision === 'accept' ? 'Disetujui' : 'Ditolak');
        setDetailRow(null);
    };

    const saveForm = (values: OvertimeFormValues) => {
        // Employee-linked fields come from the matching mock employee, since the form only picks a name.
        const base = overtimeRequests.find((request) => request.name === values.name) ?? overtimeRequests[0];
        const fields = {
            name: values.name,
            employeeId: base.employeeId,
            organization: base.organization,
            branch: base.branch,
            requestedAt: values.requestedAt,
            startTime: values.startTime,
            endTime: values.endTime,
            hours: values.hours,
            cost: values.cost,
            reason: values.reason,
        };

        if (editRow) {
            setRows((current) => current.map((item) => (item.id === editRow.id ? { ...item, ...fields } : item)));
        } else {
            setRows((current) => [{ ...fields, id: `ot-${Date.now()}`, status: 'Menunggu' }, ...current]);
        }

        setFormOpen(false);
        toast.success(editRow ? 'Lembur berhasil diperbarui' : 'Lembur berhasil ditambahkan');
    };

    const deleteOvertime = () => {
        if (!deleteRow) return;

        setRows((current) => current.filter((row) => row.id !== deleteRow.id));
        setDeleteRow(null);
        toast.success('Lembur berhasil dihapus.');
    };

    return (
        <section aria-label="Daftar pengajuan lembur" className="font-poppins">
            <DataTable
                columns={columns}
                data={visibleRows}
                search={search}
                filters={filters}
                filtersFirst
                initialFilters={{ branch: 'Jakarta' }}
                perPage={10}
                actions={
                    <div className="flex items-center gap-2">
                        <OvertimeFilterPanel value={filter} organizations={organizations} onApply={setFilter} />
                        <Button
                            type="button"
                            className="h-9 gap-1.5 rounded-lg bg-[#1980C0] px-4 text-white hover:bg-[#1570AA]"
                            onClick={() => {
                                setEditRow(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="size-4" />
                            Lembur
                        </Button>
                    </div>
                }
            />
            <OvertimeDetailDialog
                key={detailRow?.id}
                request={detailRow}
                onOpenChange={(open) => !open && setDetailRow(null)}
                onSave={saveDecision}
            />
            <OvertimeFormDialog open={formOpen} request={editRow ?? undefined} onOpenChange={setFormOpen} onSubmit={saveForm} />
            <ConfirmDialog
                open={deleteRow !== null}
                onOpenChange={(open) => !open && setDeleteRow(null)}
                onConfirm={deleteOvertime}
                title="Hapus Lembur?"
                description={
                    deleteRow
                        ? `Pengajuan lembur ${deleteRow.name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                        : undefined
                }
                confirmLabel="Hapus"
                cancelLabel="Batal"
                contentClassName="font-poppins"
            />
        </section>
    );
}
