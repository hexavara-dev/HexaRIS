import { NotificationBell } from '@/components/notification-bell';
import AppLayout from '@/layouts/app-layout';
import { CareerOverview } from './components/career-overview';
import { CareerTable } from './components/career-table';

export default function Index() {
    return (
        <AppLayout headerTitle="Karir Karyawan" headerActions={<NotificationBell count={5} />}>
            <main className="font-poppins min-w-0 space-y-4 bg-white p-3 pb-20 sm:p-6 sm:pb-24">
                <CareerOverview />
                <CareerTable />
            </main>
        </AppLayout>
    );
}
