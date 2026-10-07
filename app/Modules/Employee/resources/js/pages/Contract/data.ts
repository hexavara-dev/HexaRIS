import { type FilterConfig, type SearchConfig } from '@/components/data-table';
import { type EmployeeContractRow } from './column';

export const contractData: EmployeeContractRow[] = [
    {
        id: 'contract-1',
        employee_number: 'EM187',
        full_name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        contract_type: 'PKWT',
        contract_end_date: '12/10/26 (1 bulan lagi)',
    },
    {
        id: 'contract-2',
        employee_number: 'EM187',
        full_name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        contract_type: 'PKWT',
        contract_end_date: '12/10/26 (1 bulan lagi)',
    },
    {
        id: 'contract-3',
        employee_number: 'EM187',
        full_name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        contract_type: 'PKWTT',
        contract_end_date: '12/10/26 (1 bulan lagi)',
    },
    {
        id: 'contract-4',
        employee_number: 'EM187',
        full_name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        contract_type: 'PKWTT',
        contract_end_date: '12/10/26 (1 bulan lagi)',
    },
    {
        id: 'contract-5',
        employee_number: 'EM187',
        full_name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        contract_type: 'PKWT',
        contract_end_date: '12/10/26 (1 bulan lagi)',
    },
    {
        id: 'contract-6',
        employee_number: 'EM187',
        full_name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        contract_type: 'PKWT',
        contract_end_date: '12/10/26 (1 bulan lagi)',
    },
];

export const contractSearch: SearchConfig = {
    keys: ['employee_number', 'full_name', 'branch', 'organization', 'position', 'contract_type'],
    placeholder: 'Cari data kontrak…',
};

export const contractFilters: FilterConfig[] = [
    {
        key: 'contract_type',
        type: 'select',
        label: 'Jenis Kontrak',
        options: [
            { value: 'PKWT', label: 'PKWT' },
            { value: 'PKWTT', label: 'PKWTT' },
        ],
    },
];
