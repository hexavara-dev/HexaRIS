import { type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Employee } from '@/data/Employee/employee';
import { MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

export const employeeColumns: Column<Employee>[] = [
    { key: 'employee_number', label: 'ID Karyawan', sortable: true },
    { key: 'full_name', label: 'Nama', sortable: true },
    { key: 'email_self', label: 'Email' },
    { key: 'phone_number', label: 'No. HP' },
    { key: 'employment_type', label: 'Tipe Kerja' },
    {
        key: 'is_active',
        label: 'Status',
        render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Aktif' : 'Nonaktif'}</Badge>,
    },
    {
        key: 'id',
        label: '',
        align: 'right',
        render: (row) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <MoreVertical className="cursor-pointer size-3.5 text-[#1B1B1B]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info(`Detail ${row.full_name} belum tersedia.`)}>Detail</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => toast.info('Hapus karyawan belum tersambung ke backend.')}
                    >
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-[#E84A39] focus:text-[#E84A39] text-red-500"
                        onClick={() => toast.info('Hapus karyawan belum tersambung ke backend.')}
                    >
                        Arsipkan
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];
