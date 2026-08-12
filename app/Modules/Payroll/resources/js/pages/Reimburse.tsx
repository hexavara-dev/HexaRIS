import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employee } from '@/data/Employee/employee';
import { branch } from '@/data/Payroll/branch';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import AppLayout from '@/layouts/app-layout';
import { Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteReimburseEntry, loadReimburseEntries } from '../lib/reimburse-storage';
import { ReimburseBuktiDialog } from './reimburse/reimburse-bukti-dialog';
import { buildReimburseColumns } from './reimburse/reimburse-columns';
import { ReimburseFormDialog } from './reimburse/reimburse-form-dialog';

const ALL_BRANCHES = 'all';

export default function Reimburse() {
    const [entries, setEntries] = useState<ReimburseEntry[]>(loadReimburseEntries);
    const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES);
    const [searchValue, setSearchValue] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [formTarget, setFormTarget] = useState<ReimburseEntry | null>(null);
    const [buktiTarget, setBuktiTarget] = useState<ReimburseEntry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ReimburseEntry | null>(null);

    const refresh = useCallback(() => setEntries(loadReimburseEntries()), []);

    const tableRows = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        return entries
            .filter((e) => branchFilter === ALL_BRANCHES || e.branch_id === branchFilter)
            .filter((e) => {
                if (!query) return true;
                const emp = employee.find((c) => c.id === e.employee_id);
                return (
                    e.keperluan.toLowerCase().includes(query) ||
                    Boolean(emp?.full_name.toLowerCase().includes(query)) ||
                    Boolean(emp?.employee_number.toLowerCase().includes(query))
                );
            });
    }, [entries, branchFilter, searchValue]);

    const openCreate = () => {
        setFormTarget(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((row: ReimburseEntry) => {
        setFormTarget(row);
        setFormOpen(true);
    }, []);

    const onDelete = useCallback((row: ReimburseEntry) => setDeleteTarget(row), []);
    const onViewBukti = useCallback((row: ReimburseEntry) => setBuktiTarget(row), []);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        deleteReimburseEntry(deleteTarget.id);
        refresh();
        toast.success('Berhasil Disimpan');
        setDeleteTarget(null);
    };

    const columns = buildReimburseColumns(openEdit, onDelete, onViewBukti);

    return (
        <AppLayout>
            <div className="flex flex-col items-start gap-[19px] p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[175px] border-[#ACACAC] bg-[#FAFBFD] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_BRANCHES}>Semua Cabang</SelectItem>
                                {branch.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        Cabang: {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative w-[244px]">
                            <Search className="absolute top-2.5 left-3 size-4 text-black" />
                            <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search" className="pl-9" />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="font-poppins flex cursor-pointer items-center gap-2 rounded-lg border border-[#1980C0] bg-[#1980C0] px-4 py-2 text-xs text-white"
                    >
                        <Plus className="size-4" />
                        Reimburse
                    </button>
                </div>

                <DataTable columns={columns} data={tableRows} variant="design-system" />
            </div>

            <ReimburseFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                target={formTarget}
                defaultBranchId={branchFilter === ALL_BRANCHES ? branch[0].id : branchFilter}
                onSaved={refresh}
            />

            <ReimburseBuktiDialog open={buktiTarget !== null} onOpenChange={(open) => !open && setBuktiTarget(null)} entry={buktiTarget} />

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus Reimburse?"
                description="Anda akan menghapus data Reimburse ini secara permanen. Tindakan ini tidak dapat dibatalkan dan seluruh informasi terkait akan hilang."
                confirmLabel="Hapus"
                cancelLabel="Batal"
            />
        </AppLayout>
    );
}
