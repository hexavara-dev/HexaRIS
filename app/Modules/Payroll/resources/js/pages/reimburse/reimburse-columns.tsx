import { type Column } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { employee } from '@/data/Employee/employee';
import { type ReimburseEntry } from '@/data/Payroll/reimburseEntry';
import { MoreVertical } from 'lucide-react';
import { positionTitleFor } from '../../lib/payroll-row';

const METODE_LABEL: Record<ReimburseEntry['metode_bayar'], string> = { tunai: 'Tunai', transfer: 'Transfer' };

function karyawanLabel(employeeId: string): string {
    const emp = employee.find((e) => e.id === employeeId);
    if (!emp) return '-';
    const position = positionTitleFor(employeeId);
    return position === '-' ? emp.full_name : `${emp.full_name} - ${position}`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRupiah(nominal: number): string {
    return `Rp. ${nominal.toLocaleString('id-ID')}`;
}

export function buildReimburseColumns(
    onEdit: (row: ReimburseEntry) => void,
    onDelete: (row: ReimburseEntry) => void,
    onViewBukti: (row: ReimburseEntry) => void,
): Column<ReimburseEntry>[] {
    return [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'karyawan', label: 'Karyawan', render: (row) => karyawanLabel(row.employee_id) },
        { key: 'tanggal_pengeluaran', label: 'Tgl Pengeluaran', sortable: true, render: (row) => formatDate(row.tanggal_pengeluaran) },
        { key: 'tanggal_reimburse', label: 'Tgl Reimburse', sortable: true, render: (row) => formatDate(row.tanggal_reimburse) },
        { key: 'keperluan', label: 'Keperluan' },
        { key: 'nominal', label: 'Nominal', sortable: true, render: (row) => formatRupiah(row.nominal) },
        { key: 'metode_bayar', label: 'Met. Bayar', render: (row) => METODE_LABEL[row.metode_bayar] },
        {
            key: 'bukti',
            label: 'Bukti',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => onViewBukti(row)}
                    className="font-poppins cursor-pointer text-xs font-semibold text-[#1980C0]"
                >
                    Lihat Bukti
                </button>
            ),
        },
        {
            key: 'actions',
            label: '',
            align: 'right',
            cellClassName: 'border-l border-[#E7E7E7]',
            render: (row) => (
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <MoreVertical className="size-3.5 cursor-pointer text-[#1B1B1B]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[#E84A39] focus:text-[#E84A39]" onClick={() => onDelete(row)}>
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];
}
