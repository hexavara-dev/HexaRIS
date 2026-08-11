import { type Column } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PayrollAllowance } from '@/data/Payroll/payrollAllowance';
import { MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../lib/payroll-row';

const PERIODE_LABEL: Record<PayrollAllowance['periode'], string> = { bulanan: 'Bulanan', harian: 'Harian', sekali: 'Sekali' };

export function buildTunjanganColumns(
    onEdit: (row: PayrollAllowance) => void,
    onDelete: (row: PayrollAllowance) => void,
): Column<PayrollAllowance>[] {
    return [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'nama', label: 'Nama Tunjangan', sortable: true },
        { key: 'nominal', label: 'Nominal', sortable: true, render: (row) => formatCurrency(row.nominal) },
        { key: 'periode', label: 'Periode', render: (row) => PERIODE_LABEL[row.periode] },
        {
            key: 'aktif',
            label: 'Status',
            render: (row) => (
                <span
                    className={
                        row.aktif
                            ? 'inline-flex items-center rounded-[32px] border border-[#46B52B] bg-[#F7FBFE] px-2 py-0.5 font-poppins text-xs text-[#46B52B]'
                            : 'inline-flex items-center rounded-[32px] border border-[#ACACAC] bg-[#F7FBFE] px-2 py-0.5 font-poppins text-xs text-[#ACACAC]'
                    }
                >
                    {row.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            ),
        },
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
                        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[#E84A39] focus:text-[#E84A39] text-red-500" onClick={() => onDelete(row)}>
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}
