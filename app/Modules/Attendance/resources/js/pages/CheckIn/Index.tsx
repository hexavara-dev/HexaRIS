import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { todayLabel } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { AttendanceIssueBanner } from './attendance-issue-banner';
import { AttendanceSummary } from './attendance-summary';
import { AttendanceTable } from './attendance-table';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Absensi', href: '/attendance/check-in' }];

export default function Index() {
    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerMeta={
                <span className="font-poppins text-sm font-normal text-[#647782] whitespace-nowrap">(Hari ini, {todayLabel()})</span>
            }
        >
            <Head title="Absensi" />
            <AttendanceIssueBanner count={10} />
            <div className="space-y-5 p-4 sm:p-6">
                <AttendanceSummary />
                <AttendanceTable />
            </div>
        </AppLayout>
    );
}
