import { type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Employee } from '@/data/Employee/employee';
import { employeeAddress } from '@/data/Employee/employeeAddress';
import { employeeAssignment } from '@/data/Employee/employeeAssignment';
import { organization } from '@/data/Organization/organization';
import { regency } from '@/data/Region/regency';
import { MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

/** No dedicated branch/location module yet — approximated from the employee's city. */
function branchName(employeeId: string): string {
    const address = employeeAddress.find((a) => a.employee_id === employeeId && a.is_primary) ?? employeeAddress.find((a) => a.employee_id === employeeId);
    if (!address) return '-';
    const cityName = regency.find((r) => r.id === address.regency_id)?.name;
    return cityName ? cityName.replace(/^Kota\s+/i, '').replace(/^Kabupaten\s+/i, '') : '-';
}

function assignedOrgUnit(employeeId: string) {
    const assignment = employeeAssignment.find((a) => a.employee_id === employeeId);
    if (!assignment) return null;
    return organization.find((u) => u.id === assignment.organization_unit_id) ?? null;
}

function departmentName(employeeId: string): string {
    const unit = assignedOrgUnit(employeeId);
    if (!unit) return '-';
    if (unit.unit_type === 'DIVISION') {
        return organization.find((u) => u.id === unit.parent_id)?.name ?? '-';
    }
    return unit.name;
}

function divisionName(employeeId: string): string {
    const unit = assignedOrgUnit(employeeId);
    return unit?.unit_type === 'DIVISION' ? unit.name : '-';
}

export function buildEmployeeColumns(onEdit: (employee: Employee) => void): Column<Employee>[] {
    return [
        { key: 'employee_number', label: 'ID', sortable: true },
        { key: 'full_name', label: 'Nama', sortable: true },
        { key: 'branch', label: 'Cabang', render: (row) => branchName(row.id) },
        { key: 'department', label: 'Departemen', render: (row) => departmentName(row.id) },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Aktif' : 'Nonaktif'}</Badge>,
        },
        { key: 'division', label: 'Divisi', render: (row) => divisionName(row.id) },
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
                        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
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
}
