import { type FilterConfig, type SearchConfig, DataTable } from '@/components/data-table';
import { OverviewCard } from '@/components/design-system/card/overview-card';
import { employee } from '@/data/Employee/employee';
import AppLayout from '@/layouts/app-layout';
import { UserCheck, UserPlus, UserX } from 'lucide-react';
import { employeeColumns } from './columns';

const latestJoinYear = Math.max(...employee.map((e) => new Date(e.join_date).getFullYear()));

const overviewStats = [
    { label: 'Total Karyawan Aktif', value: employee.filter((e) => e.is_active).length, icon: UserCheck },
    { label: 'Karyawan Non Aktif', value: employee.filter((e) => !e.is_active).length, icon: UserX },
    {
        label: 'Karyawan Baru',
        value: employee.filter((e) => new Date(e.join_date).getFullYear() === latestJoinYear).length,
        icon: UserPlus,
    },
];

const employeeSearch: SearchConfig = {
    keys: ['full_name', 'email_self'],
    placeholder: 'Cari nama atau email…',
};

const employeeFilters: FilterConfig[] = [
    {
        key: 'employment_type',
        type: 'select',
        label: 'Tipe Kerja',
        options: [
            { value: 'full-time', label: 'Full-time' },
            { value: 'part-time', label: 'Part-time' },
        ],
    },
];

export default function Index() {
    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <OverviewCard title={`Overview of ${latestJoinYear}`} stats={overviewStats} />
                <DataTable columns={employeeColumns} data={employee} search={employeeSearch} filters={employeeFilters} />
            </div>
        </AppLayout>
    );
}
