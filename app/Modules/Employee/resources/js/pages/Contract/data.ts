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

export interface ContractApplicationHistoryRow {
    id: string;
    submitted_at: string;
    name: string;
    branch: string;
    department: string;
    division: string;
    position: string;
    requested_contract: string;
    status: 'Menunggu' | 'Ditolak' | 'Updated';
    details: ContractApplicationDetails;
}

export interface ContractApplicationDetails {
    contract_type: string;
    start_date: string;
    end_date: string;
    duration: string;
    previous_branch: string;
    current_branch: string;
    transfer_reason: string;
    new_organization: string;
    new_position: string;
    position_change_reason: string;
    latest_salary: string;
    new_allowance: string;
    bpjs_number: string;
    document_name: string;
    document_size: string;
}

const exampleContractApplicationDetails: ContractApplicationDetails = {
    contract_type: 'PKWT',
    start_date: '12/09/2026',
    end_date: '12/09/2027',
    duration: '1 Tahun',
    previous_branch: 'Jakarta',
    current_branch: 'Surabaya',
    transfer_reason: 'Kebijakan Kantor',
    new_organization: 'Creatif',
    new_position: 'Staff Videografer',
    position_change_reason: 'Performa bagus dan layak naik jabatan',
    latest_salary: 'Rp. 10.000.000',
    new_allowance: 'BPJS Kesehatan, Makan, Internet',
    bpjs_number: '092389391',
    document_name: 'Kontrak.PDF',
    document_size: '0.8 Mb',
};

export const contractApplicationHistory: ContractApplicationHistoryRow[] = [
    {
        id: 'application-1',
        submitted_at: '12-12-26',
        name: 'Saskya',
        branch: 'Jakarta',
        department: 'Creatif',
        division: 'Videografer',
        position: 'Staff',
        requested_contract: 'PKWT 1 Thn',
        status: 'Menunggu',
        details: exampleContractApplicationDetails,
    },
    {
        id: 'application-2',
        submitted_at: '12-12-26',
        name: 'Saskya',
        branch: 'Jakarta',
        department: 'Creatif',
        division: 'Videografer',
        position: 'Staff',
        requested_contract: 'PKWT 1 Thn',
        status: 'Menunggu',
        details: exampleContractApplicationDetails,
    },
    {
        id: 'application-3',
        submitted_at: '12-12-26',
        name: 'Saskya',
        branch: 'Jakarta',
        department: 'Creatif',
        division: 'Videografer',
        position: 'Staff',
        requested_contract: 'PKWT 1 Thn',
        status: 'Ditolak',
        details: exampleContractApplicationDetails,
    },
    {
        id: 'application-4',
        submitted_at: '12-12-26',
        name: 'Saskya',
        branch: 'Jakarta',
        department: 'Creatif',
        division: 'Videografer',
        position: 'Staff',
        requested_contract: 'PKWT 1 Thn',
        status: 'Ditolak',
        details: exampleContractApplicationDetails,
    },
    {
        id: 'application-5',
        submitted_at: '12-12-26',
        name: 'Saskya',
        branch: 'Jakarta',
        department: 'Creatif',
        division: 'Videografer',
        position: 'Staff',
        requested_contract: 'PKWT 1 Thn',
        status: 'Updated',
        details: exampleContractApplicationDetails,
    },
    {
        id: 'application-6',
        submitted_at: '12-12-26',
        name: 'Saskya',
        branch: 'Jakarta',
        department: 'Creatif',
        division: 'Videografer',
        position: 'Staff',
        requested_contract: 'PKWT 1 Thn',
        status: 'Updated',
        details: exampleContractApplicationDetails,
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
