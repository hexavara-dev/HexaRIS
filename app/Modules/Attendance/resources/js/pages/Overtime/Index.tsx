import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import OvertimeTable from './overtime-table';
import { OvertimeSummary } from './overtime-summary';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Lembur', href: '/attendance/overtime' }];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-4 p-6">
                <OvertimeSummary />
                <OvertimeTable />
            </div>
        </AppLayout>
    );
}
