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
