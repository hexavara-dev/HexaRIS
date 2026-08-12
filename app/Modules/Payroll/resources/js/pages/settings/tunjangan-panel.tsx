import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type SearchConfig } from '@/components/data-table';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { deleteAllowance, loadAllowances, updateAllowance } from '../../lib/payroll-settings-storage';
import { buildTunjanganColumns } from './tunjangan-columns';
import { TunjanganFormDialog } from './tunjangan-form-dialog';

const search: SearchConfig = { keys: ['nama'], placeholder: 'Search' };

export function TunjanganPanel() {
    const [allowances, setAllowances] = useState<PayrollAllowance[]>(loadAllowances);
    const [formOpen, setFormOpen] = useState(false);
    const [formTarget, setFormTarget] = useState<PayrollAllowance | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PayrollAllowance | null>(null);

    const refresh = useCallback(() => setAllowances(loadAllowances()), []);

    const openCreate = () => {
        setFormTarget(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((row: PayrollAllowance) => {
        setFormTarget(row);
        setFormOpen(true);
    }, []);

    const onDelete = useCallback((row: PayrollAllowance) => setDeleteTarget(row), []);

    const onToggleActive = useCallback(
        (row: PayrollAllowance) => {
            updateAllowance(row.id, { aktif: !row.aktif });
            refresh();
            toast.success('Berhasil Disimpan');
        },
        [refresh],
    );

    const confirmDelete = () => {
        if (!deleteTarget) return;
        deleteAllowance(deleteTarget.id);
        refresh();
        toast.success('Berhasil Disimpan');
        setDeleteTarget(null);
    };

    const columns = buildTunjanganColumns(openEdit, onDelete, onToggleActive);

    return (
        <div className="flex w-full flex-col gap-4">
            <DataTable
                columns={columns}
                data={allowances}
                search={search}
                variant="design-system"
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="font-poppins flex cursor-pointer items-center gap-2 rounded-lg bg-[#1980C0] px-4 py-2 text-xs text-white"
                    >
                        <Plus className="size-4" />
                        Tunjangan
                    </button>
                }
            />

            <TunjanganFormDialog open={formOpen} onOpenChange={setFormOpen} target={formTarget} onSaved={refresh} />

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus Tunjangan?"
                description={'Anda akan menghapus data Tunjangan ini secara permanen.\nTindakan ini tidak dapat dibatalkan dan seluruh informasi terkait\nakan hilang.'}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                destructive={false}
                preventOutsideClose
            />
        </div>
    );
}
