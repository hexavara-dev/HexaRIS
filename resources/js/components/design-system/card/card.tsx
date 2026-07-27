import { Fragment } from 'react';

export interface OverviewStat {
    label: string;
    value: string | number;
}

interface OverviewCardProps {
    title: string;
    stats: OverviewStat[];
}

export function OverviewCard({ title, stats }: OverviewCardProps) {
    return (
        <div className="flex w-full flex-col items-start justify-center gap-5 rounded-lg border border-[#E7E7E7] bg-white px-5 py-3">
            <p className="font-poppins w-fit text-xs font-semibold tracking-[0.01em] text-black">{title}</p>
            <div className="flex w-full items-center justify-between">
                {stats.map((stat, index) => (
                    <Fragment key={stat.label}>
                        <div className="flex w-fit flex-col items-start gap-1">
                            <p className="w-fit text-xs tracking-[0.01em] text-black">{stat.label}</p>
                            <p className="w-fit text-sm font-semibold tracking-[0.01em] text-black">{stat.value}</p>
                        </div>
                        {index < stats.length - 1 && (
                            <svg
                                width="1"
                                height="34"
                                viewBox="0 0 1 34"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-[34px] shrink-0"
                            >
                                <path d="M0.5 0V33.5" stroke="#E7E7E7" />
                            </svg>
                        )}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

export function OverviewCardDemo() {
    return (
        <OverviewCard
            title="Overview of 2026"
            stats={[
                { label: 'Total Karyawan Aktif', value: 248 },
                { label: 'Karyawan Non Aktif', value: 248 },
                { label: 'Karyawan Baru', value: 248 },
            ]}
        />
    );
}

export function EmployeeOverviewCardDemo() {
    return (
        <OverviewCard
            title="DATA KARYAWAN"
            stats={[
                { label: 'Karyawan Aktif', value: 248 },
                { label: 'Karyawan Non Aktif', value: 248 },
                { label: 'Karyawan Baru', value: 248 },
            ]}
        />
    );
}

export function AssetOverviewCardDemo() {
    return (
        <OverviewCard
            title="DATA ASET"
            stats={[
                { label: 'Total Semua Aset', value: 980 },
                { label: 'Aset Dipinjam Karyawan', value: 600 },
                { label: 'Aset Yang Tersedia', value: 6 },
            ]}
        />
    );
}
