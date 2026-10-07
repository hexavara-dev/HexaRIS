import { type Column } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

export interface EmployeeContractRow {
    id: string;
    employee_number: string;
    full_name: string;
    branch: string;
    organization: string;
    position: string;
    contract_type: string;
    contract_end_date: string;
}

export type ContractAction = 'extend' | 'make-permanent' | 'terminate' | 'edit';

export function buildEmployeeContractColumns(onAction: (action: ContractAction, row: EmployeeContractRow) => void): Column<EmployeeContractRow>[] {
    const openActionDialog = (action: ContractAction, row: EmployeeContractRow) => {
        window.setTimeout(() => onAction(action, row), 0);
    };

    return [
        { key: 'employee_number', label: 'ID', sortable: true },
        { key: 'full_name', label: 'Nama', sortable: true },
        { key: 'branch', label: 'Cabang', sortable: true },
        { key: 'organization', label: 'Organisasi', sortable: true },
        { key: 'position', label: 'Posisi Jabatan', sortable: true },
        { key: 'contract_type', label: 'Jenis Kontrak', sortable: true },
        { key: 'contract_end_date', label: 'Waktu Kontrak', sortable: true },
        {
            key: 'actions',
            label: '',
            align: 'right',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <MoreVertical className="size-3.5 cursor-pointer text-[#1B1B1B]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openActionDialog('extend', row)}>Perpanjang Kontrak</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openActionDialog('make-permanent', row)}>Tetapkan Karyawan Tetap</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openActionDialog('terminate', row)}>Putus Kontrak</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openActionDialog('edit', row)}>Edit Kontrak</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}
