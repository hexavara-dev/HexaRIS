import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { LeaveSummary } from './leave-summary';
import { LeaveTable } from './leave-table';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Izin & Cuti', href: '/attendance/leave' }];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Izin & Cuti" />
            <div className="space-y-5 p-4 sm:p-6">
                <LeaveSummary />
                <LeaveTable />
            </div>
        </AppLayout>
    );
}
