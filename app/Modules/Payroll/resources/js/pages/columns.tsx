import { type Column } from '@/components/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type PayrollStatus } from '@/data/Payroll/payrollEntry';
import { cn } from '@/lib/utils';
import { SquarePen } from 'lucide-react';
import { allowanceTotal, deductionTotal, formatCurrency, thp, type PayrollRow } from '../lib/payroll-row';

const STATUS_LABEL: Record<PayrollStatus, string> = { selesai: 'Selesai', proses: 'Proses', belum: 'Belum' };
const STATUS_COLOR: Record<PayrollStatus, string> = { selesai: 'text-[#46B52B]', proses: 'text-[#CA8A04]', belum: 'text-[#E84A39]' };

function StatusCell({ row, onStatusChange }: { row: PayrollRow; onStatusChange: (row: PayrollRow, status: PayrollStatus) => void }) {
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
    onEdit: (row: PayrollRow) => void,
    onStatusChange: (row: PayrollRow, status: PayrollStatus) => void,
): Column<PayrollRow>[] {
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
                <button type="button" onClick={() => onEdit(row)} className="cursor-pointer rounded-md border border-[#E7E7E7] p-1.5">
                    <SquarePen className="size-3.5 text-black" />
                </button>
            ),
        },
    ];
}
