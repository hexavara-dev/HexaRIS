import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { ActiveEmployeesIcon, KpiStatCard, PayrollStatusIcon, TotalSalaryIcon } from '@/components/design-system/card/kpi-stat';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employee } from '@/data/Employee/employee';
import { branch } from '@/data/Payroll/branch';
import { payrollEntry, type PayrollEntry } from '@/data/Payroll/payrollEntry';
import { period } from '@/data/Payroll/period';
import AppLayout from '@/layouts/app-layout';
import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PayrollDetailDialog } from '../components/payroll-detail-dialog';
import { formatCurrency, recomputeRow, thp, toPayrollRow, type RecomputedPayrollRow } from '../lib/payroll-row';
import { loadAllowances, loadDeductionSettings, loadOvertimeSettings } from '../lib/payroll-settings-storage';
import { loadDeletedPayrollIds, loadPayrollOverrides, markPayrollDeleted, savePayrollOverride } from '../lib/payroll-storage';
import { buildPayrollColumns } from './columns';

const ALL_BRANCHES = 'all';
const CURRENT_PERIOD_ID = period[period.length - 1].id;

export default function Index() {
    // The reference design places Search/Cabang/Periode above the KPI cards, but DataTable's built-in
    // toolbar (its `search`/`filters` props) always renders directly above the table — so this page
    // filters `data` itself before handing it to DataTable instead of using that built-in toolbar.
    const [overrides, setOverrides] = useState(loadPayrollOverrides);
    const [deletedIds, setDeletedIds] = useState(loadDeletedPayrollIds);
    const [searchValue, setSearchValue] = useState('');
    const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES);
    const [periodFilter, setPeriodFilter] = useState(CURRENT_PERIOD_ID);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<'view' | 'edit'>('view');
    const [deleteTarget, setDeleteTarget] = useState<RecomputedPayrollRow | null>(null);

    const employeeById = useMemo(() => new Map(employee.map((e) => [e.id, e])), []);

    const settings = useMemo(
        () => ({ allowances: loadAllowances(), deductions: loadDeductionSettings(), overtime: loadOvertimeSettings() }),
        [],
    );

    const allRows = useMemo(
        () =>
            payrollEntry
                .map((entry) => toPayrollRow({ ...entry, ...overrides[entry.id] }, employeeById))
                .filter((row) => !deletedIds.includes(row.id))
                .map((row) => recomputeRow(row, settings)),
        [overrides, employeeById, deletedIds, settings],
    );

    // Derived live from `allRows` by id (rather than kept as its own state snapshot) so it's always
    // the current recomputed value — the same object the table shows — instead of going stale after
    // a Simpan that only changes part of the underlying row (see payroll-row.ts's `recomputeRow`).
    const editingRow = useMemo(() => allRows.find((row) => row.id === editingRowId) ?? null, [allRows, editingRowId]);

    const scopedRows = useMemo(
        () => allRows.filter((row) => row.period_id === periodFilter && (branchFilter === ALL_BRANCHES || row.branch_id === branchFilter)),
        [allRows, periodFilter, branchFilter],
    );

    const tableRows = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return scopedRows;
        return scopedRows.filter((row) => row.full_name.toLowerCase().includes(query) || row.employee_number.toLowerCase().includes(query));
    }, [scopedRows, searchValue]);

    // Defense in depth: count distinct employees rather than rows, so a future entry point that
    // somehow produces two rows for the same employee within a period can't inflate this KPI.
    const totalActiveEmployees = useMemo(() => new Set(scopedRows.map((row) => row.employee_id)).size, [scopedRows]);
    const totalPayable = useMemo(() => scopedRows.reduce((sum, row) => sum + thp(row), 0), [scopedRows]);
    const statusCounts = useMemo(
        () => ({
            selesai: scopedRows.filter((row) => row.status === 'selesai').length,
            belum: scopedRows.filter((row) => row.status === 'belum').length,
        }),
        [scopedRows],
    );

    const openDetail = useCallback((row: RecomputedPayrollRow) => {
        setEditingRowId(row.id);
        setInitialMode('view');
        setDialogOpen(true);
    }, []);

    const openEdit = useCallback((row: RecomputedPayrollRow) => {
        setEditingRowId(row.id);
        setInitialMode('edit');
        setDialogOpen(true);
    }, []);

    const onStatusChange = useCallback((row: RecomputedPayrollRow, status: RecomputedPayrollRow['status']) => {
        setOverrides(savePayrollOverride(row.id, { status }));
    }, []);

    const onSaved = useCallback((entryId: string, patch: Partial<PayrollEntry>) => {
        setOverrides(savePayrollOverride(entryId, patch));
    }, []);

    const onDelete = useCallback((row: RecomputedPayrollRow) => setDeleteTarget(row), []);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeletedIds(markPayrollDeleted(deleteTarget.id));
        toast.success(`Data gaji ${deleteTarget.full_name} berhasil dihapus.`);
        setDeleteTarget(null);
    };

    const columns = useMemo(
        () => buildPayrollColumns(openDetail, openEdit, onStatusChange, onDelete),
        [openDetail, openEdit, onStatusChange, onDelete],
    );

    return (
        <AppLayout>
            <div className="space-y-[19px] p-6">
                <div className="flex items-center justify-between">
                    <div className="relative w-[244px]">
                        <Search className="absolute top-2.5 left-3 size-4 text-black" />
                        <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search" className="pl-9" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[163px] border-[#ACACAC] bg-[#FAFBFD] text-xs">
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
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="w-fit border-[#ACACAC] bg-[#FAFBFD] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {period.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        Periode: {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <KpiStatCard label="Total Semua Karyawan Aktif" iconBackground="rgba(139,92,246,0.10)" icon={<ActiveEmployeesIcon />}>
                        <p className="font-poppins text-2xl font-semibold text-black">{totalActiveEmployees}</p>
                    </KpiStatCard>
                    <KpiStatCard label="Total Semua Gaji Yang Harus Dibayar" iconBackground="rgba(16,185,129,0.10)" icon={<TotalSalaryIcon />}>
                        <p className="font-poppins text-2xl font-semibold text-black">{formatCurrency(totalPayable)}</p>
                    </KpiStatCard>
                    <KpiStatCard label="Status Pembayaran Gaji" iconBackground="rgba(25,128,192,0.10)" icon={<PayrollStatusIcon />}>
                        <div className="flex items-start gap-2">
                            <p className="font-poppins text-sm text-black">{statusCounts.selesai} Selesai</p>
                            <p className="font-poppins text-sm text-black">{statusCounts.belum} Belum</p>
                        </div>
                    </KpiStatCard>
                </div>

                <DataTable columns={columns} data={tableRows} variant="design-system" />

                <PayrollDetailDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditingRowId(null);
                    }}
                    row={editingRow}
                    onSaved={onSaved}
                    initialMode={initialMode}
                />

                <ConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Data Gaji?"
                    description={
                        deleteTarget ? `Data gaji ${deleteTarget.full_name} untuk periode ini akan dihapus. Tindakan ini tidak bisa dibatalkan.` : undefined
                    }
                    confirmLabel="Hapus"
                />
            </div>
        </AppLayout>
    );
}
