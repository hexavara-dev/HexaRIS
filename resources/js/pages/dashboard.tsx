import { Head, usePage } from '@inertiajs/react';

import { ApprovalRequestListDemo } from '@/components/design-system/card/approval-list';
import { AssetOverviewCardDemo, EmployeeOverviewCardDemo } from '@/components/design-system/card/card';
import { TrainingSummaryCardDemo } from '@/components/design-system/card/pelatihan';
import { PayrollSummaryCardDemo } from '@/components/design-system/card/penggajian';
import { TopPerformanceCardDemo } from '@/components/design-system/card/performa';
import { RecruitmentPipelineCardDemo } from '@/components/design-system/card/rekrutment';
import { AttendanceStatusSummary } from '@/components/design-system/card/status-kehadiran';
import { WeeklyShiftScheduleDemo } from '@/components/design-system/jadwal-shift/jadwal-shift';
import { FloatingAssistantButton } from '@/components/floating-assistant-button';
import { NotificationBell } from '@/components/notification-bell';
import { PeriodDropdown } from '@/components/period-dropdown';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const PERIODS = ['Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026'];
const DEFAULT_PERIOD = 'Juli 2026';

function getGreetingWord(hour: number) {
    if (hour < 11) return 'pagi';
    if (hour < 15) return 'siang';
    if (hour < 18) return 'sore';
    return 'malam';
}

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const greeting = getGreetingWord(new Date().getHours());

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={<NotificationBell count={5} />}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                        <p className="font-poppins text-lg font-semibold text-[#0F172A]">
                            Selamat {greeting} {auth.user.name}
                        </p>
                        <p className="text-sm text-[#4F4F4F]">berikut adalah Ringkasan aktivitas HRIS periode terpilih {DEFAULT_PERIOD}.</p>
                    </div>
                    <PeriodDropdown periods={PERIODS} defaultPeriod={DEFAULT_PERIOD} />
                </div>

                <div className="grid w-full grid-cols-2 gap-5">
                    <EmployeeOverviewCardDemo />
                    <AssetOverviewCardDemo />
                </div>

                <div className="grid w-full grid-cols-2 items-start gap-5">
                    <div className="flex w-full flex-col items-start gap-5 rounded-xl border border-[#E2E8F0] p-5">
                        <p className="font-poppins text-sm font-semibold text-black">ABSENSI</p>
                        <div className="flex w-full flex-col gap-4">
                            <AttendanceStatusSummary
                                stats={[
                                    { label: 'On Time', value: 213 },
                                    { label: 'Terlambat', value: 21 },
                                    { label: 'Cuti', value: 53 },
                                ]}
                            />
                            <AttendanceStatusSummary
                                stats={[
                                    { label: 'Alpha', value: 89 },
                                    { label: 'Izin', value: 89 },
                                    { label: 'Lembur', value: 89 },
                                ]}
                            />
                        </div>
                        <ApprovalRequestListDemo />
                    </div>
                    <TopPerformanceCardDemo />
                </div>

                <WeeklyShiftScheduleDemo />

                <div className="grid w-full grid-cols-2 items-start gap-5">
                    <div className="flex w-full flex-col gap-5">
                        <TrainingSummaryCardDemo />
                        <PayrollSummaryCardDemo />
                    </div>
                    <RecruitmentPipelineCardDemo />
                </div>
            </div>

            <FloatingAssistantButton />
        </AppLayout>
    );
}
