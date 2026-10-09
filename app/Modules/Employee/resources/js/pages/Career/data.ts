import { type CareerChartItem, type CareerHistoryRow, type CareerMetricItem } from './types';

export const careerChartData: CareerChartItem[] = [
    { month: 'Jan', positionChanges: 60, mutations: 42 },
    { month: 'Feb', positionChanges: 90, mutations: 58 },
    { month: 'Mar', positionChanges: 72, mutations: 72 },
    { month: 'Apr', positionChanges: 96, mutations: 84 },
    { month: 'Mei', positionChanges: 91, mutations: 80 },
];

export const careerChartDataByYear: Record<string, CareerChartItem[]> = {
    '2026': careerChartData,
    '2025': [
        { month: 'Jan', positionChanges: 48, mutations: 38 },
        { month: 'Feb', positionChanges: 65, mutations: 51 },
        { month: 'Mar', positionChanges: 58, mutations: 62 },
        { month: 'Apr', positionChanges: 78, mutations: 67 },
        { month: 'Mei', positionChanges: 73, mutations: 70 },
    ],
};

export const averageMutationByBranch: CareerMetricItem[] = [
    { label: 'Surabaya', value: 72 },
    { label: 'Jakarta', value: 31 },
    { label: 'Malang', value: 15 },
    { label: 'Bandung', value: 10 },
    { label: 'Mojokerto', value: 8 },
];

export const organizationChanges: CareerMetricItem[] = [
    { label: 'HR', value: 12 },
    { label: 'IT', value: 28 },
    { label: 'Finance', value: 11 },
    { label: 'Produksi', value: 10 },
    { label: 'Creative', value: 8 },
];

export const careerHistory: CareerHistoryRow[] = [
    {
        id: 'career-1',
        employeeId: 'EM187',
        name: 'Dwi Ayu',
        changeType: 'Mutasi',
        submittedAt: '12-09-26',
        currentBranch: 'Jakarta',
        currentOrganization: 'Creative',
        currentPosition: 'Staff',
        status: 'Menunggu',
    },
    {
        id: 'career-2',
        employeeId: 'EM187',
        name: 'Dwi Ayu',
        changeType: 'Mutasi',
        submittedAt: '12-09-26',
        currentBranch: 'Jakarta',
        currentOrganization: 'Creative',
        currentPosition: 'Staff',
        status: 'Menunggu',
    },
    {
        id: 'career-3',
        employeeId: 'EM187',
        name: 'Dwi Ayu',
        changeType: 'Mutasi & Perubahan Jabatan',
        submittedAt: '12-09-26',
        currentBranch: 'Jakarta',
        currentOrganization: 'Creative',
        currentPosition: 'Staff',
        status: 'Ditolak',
    },
    {
        id: 'career-4',
        employeeId: 'EM187',
        name: 'Dwi Ayu',
        changeType: 'Mutasi & Perubahan Jabatan',
        submittedAt: '12-09-26',
        currentBranch: 'Jakarta',
        currentOrganization: 'Creative',
        currentPosition: 'Staff',
        status: 'Ditolak',
    },
    {
        id: 'career-5',
        employeeId: 'EM187',
        name: 'Dwi Ayu',
        changeType: 'Mutasi',
        submittedAt: '12-09-26',
        currentBranch: 'Jakarta',
        currentOrganization: 'Creative',
        currentPosition: 'Staff',
        status: 'Approved',
    },
    {
        id: 'career-6',
        employeeId: 'EM214',
        name: 'Rizky Pratama',
        changeType: 'Perubahan Jabatan',
        submittedAt: '10-09-26',
        currentBranch: 'Surabaya',
        currentOrganization: 'IT',
        currentPosition: 'Mobile Developer',
        status: 'Approved',
    },
    {
        id: 'career-7',
        employeeId: 'EM203',
        name: 'Siti Aisyah',
        changeType: 'Mutasi',
        submittedAt: '08-09-26',
        currentBranch: 'Bandung',
        currentOrganization: 'Customer Support',
        currentPosition: 'Staff',
        status: 'Menunggu',
    },
];
