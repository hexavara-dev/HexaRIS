import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { AttendanceIssueTable } from './attendance-issue-table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Absensi', href: '/attendance/check-in' },
    { title: 'Laporan Masalah Absensi', href: '/attendance/report' },
];

export default function AttendanceReport() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Masalah Absensi" />
            <div className="p-4 sm:p-6">
                <AttendanceIssueTable />
            </div>
        </AppLayout>
    );
}
