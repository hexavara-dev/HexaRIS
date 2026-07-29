import { type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { type Employee } from '@/data/Employee/employee';

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
];
