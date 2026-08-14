export type AssetTab = 'company' | 'employee-loan';

export interface AssetTabDef {
    value: AssetTab;
    label: string;
}

export const ASSET_TABS: AssetTabDef[] = [
    { value: 'company', label: 'Semua Aset Perusahaan' },
    { value: 'employee-loan', label: 'Aset Dipakai Karyawan' },
];

export interface BranchOption {
    value: string;
    label: string;
}

export const BRANCH_OPTIONS: BranchOption[] = [
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'bandung', label: 'Bandung' },
    { value: 'surabaya', label: 'Surabaya' },
    { value: 'yogyakarta', label: 'Yogyakarta' },
];

export interface CategoryOption {
    value: string;
    label: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Monitor', label: 'Monitor' },
    { value: 'Keyboard', label: 'Keyboard' },
    { value: 'Mouse', label: 'Mouse' },
    { value: 'Printer', label: 'Printer' },
];

export interface EmployeeOption {
    value: string;
    label: string;
}

export const EMPLOYEE_OPTIONS: EmployeeOption[] = [
    { value: 'saskya-ayu', label: 'Saskya Ayu' },
    { value: 'budi-santoso', label: 'Budi Santoso' },
    { value: 'rina-permata', label: 'Rina Permata' },
    { value: 'andi-wijaya', label: 'Andi Wijaya' },
];
