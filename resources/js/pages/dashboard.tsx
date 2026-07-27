import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { ApprovalRequestList, type ApprovalRequest } from '@/components/design-system/card/approval-list';
import { OverviewCard } from '@/components/design-system/card/card';
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
import { type SharedData } from '@/types';

const PERIODS = ['Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026'];
const DEFAULT_PERIOD = 'Juli 2026';

// "Lihat Semua (N)" should honestly reflect the total size of APPROVAL_REQUESTS below,
// which backs every period regardless of which category tab is active in the modal.
const APPROVAL_REQUESTS_COUNT = 10;

interface PeriodDataset {
    employee: { aktif: number; nonAktif: number; baru: number };
    asset: { total: number; dipinjam: number; tersedia: number };
    absensiOnTime: { onTime: number; terlambat: number; cuti: number };
    absensiLainnya: { alpha: number; izin: number; lembur: number };
    approvalCounts: { cuti: number; izin: number; lembur: number };
    viewAllCount: number;
}

const PERIOD_DATA: Record<string, PeriodDataset> = {
    'Mei 2026': {
        employee: { aktif: 230, nonAktif: 18, baru: 5 },
        asset: { total: 940, dipinjam: 560, tersedia: 12 },
        absensiOnTime: { onTime: 198, terlambat: 15, cuti: 40 },
        absensiLainnya: { alpha: 5, izin: 70, lembur: 60 },
        approvalCounts: { cuti: 12, izin: 18, lembur: 3 },
        viewAllCount: APPROVAL_REQUESTS_COUNT,
    },
    'Juni 2026': {
        employee: { aktif: 239, nonAktif: 20, baru: 9 },
        asset: { total: 965, dipinjam: 580, tersedia: 9 },
        absensiOnTime: { onTime: 205, terlambat: 18, cuti: 47 },
        absensiLainnya: { alpha: 7, izin: 80, lembur: 75 },
        approvalCounts: { cuti: 15, izin: 22, lembur: 4 },
        viewAllCount: APPROVAL_REQUESTS_COUNT,
    },
    'Juli 2026': {
        employee: { aktif: 248, nonAktif: 248, baru: 248 },
        asset: { total: 980, dipinjam: 600, tersedia: 6 },
        absensiOnTime: { onTime: 213, terlambat: 21, cuti: 53 },
        absensiLainnya: { alpha: 89, izin: 89, lembur: 89 },
        approvalCounts: { cuti: 20, izin: 30, lembur: 5 },
        viewAllCount: APPROVAL_REQUESTS_COUNT,
    },
    'Agustus 2026': {
        employee: { aktif: 255, nonAktif: 26, baru: 14 },
        asset: { total: 1005, dipinjam: 620, tersedia: 15 },
        absensiOnTime: { onTime: 220, terlambat: 12, cuti: 58 },
        absensiLainnya: { alpha: 10, izin: 95, lembur: 82 },
        approvalCounts: { cuti: 24, izin: 19, lembur: 6 },
        viewAllCount: APPROVAL_REQUESTS_COUNT,
    },
};

function avatarFor(seed: string) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
}

const APPROVAL_REQUESTS: ApprovalRequest[] = [
    {
        name: 'Aditya Wijaya',
        avatarUrl: avatarFor('Aditya Wijaya'),
        description: 'Cuti Sakit • Hari ini, 08:30',
        type: 'Cuti Sakit',
        category: 'cuti',
    },
    { name: 'Dewi Lestari', avatarUrl: avatarFor('Dewi Lestari'), description: 'Lembur • Kemarin, 19:40', type: 'Lembur', category: 'lembur' },
    {
        name: 'Rian Setiawan',
        avatarUrl: avatarFor('Rian Setiawan'),
        description: 'Cuti Tahunan • 24 Okt, 14:15',
        type: 'Cuti Tahunan',
        category: 'cuti',
    },
    {
        name: 'Putri Ayu',
        avatarUrl: avatarFor('Putri Ayu'),
        description: 'Cuti Melahirkan • 20 Okt, 09:00',
        type: 'Cuti Melahirkan',
        category: 'cuti',
    },
    {
        name: 'Galih Prakoso',
        avatarUrl: avatarFor('Galih Prakoso'),
        description: 'Cuti Tahunan • 18 Okt, 11:30',
        type: 'Cuti Tahunan',
        category: 'cuti',
    },
    {
        name: 'Yusuf Maulana',
        avatarUrl: avatarFor('Yusuf Maulana'),
        description: 'Izin Sakit • Hari ini, 07:45',
        type: 'Izin Sakit',
        category: 'izin',
    },
    {
        name: 'Melati Sari',
        avatarUrl: avatarFor('Melati Sari'),
        description: 'Izin Keperluan Keluarga • Kemarin, 10:20',
        type: 'Izin Keperluan Keluarga',
        category: 'izin',
    },
    {
        name: 'Hendra Gunawan',
        avatarUrl: avatarFor('Hendra Gunawan'),
        description: 'Izin Terlambat • Hari ini, 08:10',
        type: 'Izin Terlambat',
        category: 'izin',
    },
    { name: 'Sri Wahyuni', avatarUrl: avatarFor('Sri Wahyuni'), description: 'Izin Sakit • 22 Okt, 09:15', type: 'Izin Sakit', category: 'izin' },
    { name: 'Bagas Saputra', avatarUrl: avatarFor('Bagas Saputra'), description: 'Lembur • 23 Okt, 20:15', type: 'Lembur', category: 'lembur' },
];

function getGreetingWord(hour: number) {
    if (hour < 11) return 'pagi';
    if (hour < 15) return 'siang';
    if (hour < 18) return 'sore';
    return 'malam';
}

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const greeting = getGreetingWord(new Date().getHours());
    const [selectedPeriod, setSelectedPeriod] = useState(DEFAULT_PERIOD);
    const data = PERIOD_DATA[selectedPeriod];

    return (
        <AppLayout headerTitle="Dashboard" headerActions={<NotificationBell count={5} />}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 px-6 pt-4 pb-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                        <p className="font-poppins text-lg font-semibold text-[#0F172A]">
                            Selamat {greeting} {auth.user.name}
                        </p>
                        <p className="text-sm text-[#4F4F4F]">berikut adalah Ringkasan aktivitas HRIS periode terpilih {selectedPeriod}.</p>
                    </div>
                    <PeriodDropdown periods={PERIODS} value={selectedPeriod} onValueChange={setSelectedPeriod} />
                </div>

                <div className="grid w-full grid-cols-2 gap-5">
                    <OverviewCard
                        title="DATA KARYAWAN"
                        stats={[
                            { label: 'Karyawan Aktif', value: data.employee.aktif },
                            { label: 'Karyawan Non Aktif', value: data.employee.nonAktif },
                            { label: 'Karyawan Baru', value: data.employee.baru },
                        ]}
                    />
                    <OverviewCard
                        title="DATA ASET"
                        stats={[
                            { label: 'Total Semua Aset', value: data.asset.total },
                            { label: 'Aset Dipinjam Karyawan', value: data.asset.dipinjam },
                            { label: 'Aset Yang Tersedia', value: data.asset.tersedia },
                        ]}
                    />
                </div>

                <div className="grid w-full grid-cols-2 items-stretch gap-5">
                    <div className="flex h-full w-full flex-col items-start gap-5 rounded-xl border border-[#E2E8F0] p-5">
                        <p className="font-poppins text-sm font-semibold text-black">ABSENSI</p>
                        <div className="flex w-full flex-col gap-4">
                            <AttendanceStatusSummary
                                stats={[
                                    { label: 'On Time', value: data.absensiOnTime.onTime },
                                    { label: 'Terlambat', value: data.absensiOnTime.terlambat },
                                    { label: 'Cuti', value: data.absensiOnTime.cuti },
                                ]}
                            />
                            <AttendanceStatusSummary
                                stats={[
                                    { label: 'Alpha', value: data.absensiLainnya.alpha },
                                    { label: 'Izin', value: data.absensiLainnya.izin },
                                    { label: 'Lembur', value: data.absensiLainnya.lembur },
                                ]}
                            />
                        </div>
                        <ApprovalRequestList
                            title="Pengajuan Menunggu Approval"
                            counts={[
                                { key: 'cuti', label: 'Cuti', value: data.approvalCounts.cuti, color: '#1E3A8A' },
                                { key: 'izin', label: 'Izin', value: data.approvalCounts.izin, color: '#065F46' },
                                { key: 'lembur', label: 'Lembur', value: data.approvalCounts.lembur, color: '#92400E' },
                            ]}
                            viewAllLabel="Lihat Semua"
                            viewAllCount={data.viewAllCount}
                            requests={APPROVAL_REQUESTS.slice(0, 3)}
                            allRequests={APPROVAL_REQUESTS}
                        />
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
