import { type Column } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { allowanceTotal, deductionTotal, formatCurrency, STATUS_COLOR, STATUS_LABEL, thp, type RecomputedPayrollRow } from '../lib/payroll-row';

function StatusCell({
    row,
    onStatusChange,
}: {
    row: RecomputedPayrollRow;
    onStatusChange: (row: RecomputedPayrollRow, status: PayrollStatus) => void;
}) {
    return (
        <Select value={row.status} onValueChange={(value) => onStatusChange(row, value as PayrollStatus)}>
            <SelectTrigger className={cn('h-7 w-fit gap-1.5 rounded-lg border-[#E7E7E7] px-2 py-1 font-poppins text-xs', STATUS_COLOR[row.status])}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {(Object.keys(STATUS_LABEL) as PayrollStatus[]).map((status) => (
                    <SelectItem key={status} value={status} className={STATUS_COLOR[status]}>
                        {STATUS_LABEL[status]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function buildPayrollColumns(
    onDetail: (row: RecomputedPayrollRow) => void,
    onEdit: (row: RecomputedPayrollRow) => void,
    onStatusChange: (row: RecomputedPayrollRow, status: PayrollStatus) => void,
    onDelete: (row: RecomputedPayrollRow) => void,
): Column<RecomputedPayrollRow>[] {
    return [
        { key: 'employee_number', label: 'ID', sortable: true },
        {
            key: 'full_name',
            label: 'Karyawan',
            sortable: true,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-poppins text-xs text-[#424242]">{row.full_name}</span>
                    <span className="font-poppins text-[11px] text-[#8F8F8F]">{row.position_title}</span>
                </div>
            ),
        },
        { key: 'base_salary', label: 'Gaji Pokok', sortable: true, render: (row) => formatCurrency(row.base_salary) },
        { key: 'tunjangan', label: 'Tunjangan', render: (row) => <span className="text-[#46B52B]">{formatCurrency(allowanceTotal(row))}</span> },
        { key: 'lembur', label: 'Lembur', render: (row) => <span className="text-[#46B52B]">{formatCurrency(row.earnings.overtime)}</span> },
        { key: 'potongan', label: 'Potongan', render: (row) => <span className="text-[#E84A39]">{formatCurrency(deductionTotal(row))}</span> },
        { key: 'thp', label: 'THP', render: (row) => formatCurrency(thp(row)) },
        { key: 'status', label: 'Status', render: (row) => <StatusCell row={row} onStatusChange={onStatusChange} /> },
        {
            key: 'actions',
            label: '',
            align: 'right',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <MoreVertical className="cursor-pointer size-3.5 text-[#1B1B1B]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDetail(row)}>Detail</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
                        {/* Hapus temporarily disabled per product request — hidden via CSS rather than removed,
                            so the already-working delete plumbing (Index.tsx, payroll-storage.ts) stays wired and
                            this can ship by just dropping the `hidden` class once the flow is ready. */}
                        <DropdownMenuSeparator className="hidden" />
                        <DropdownMenuItem
                            className="hidden text-[#E84A39] focus:text-[#E84A39] text-red-500"
                            onClick={() => onDelete(row)}
                        >
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}
