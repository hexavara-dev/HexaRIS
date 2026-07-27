import { Fragment, type ReactNode } from 'react';

export interface OverviewStat {
    icon: ReactNode;
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
                        <div className="flex w-[132px] items-start gap-2">
                            <div className="flex w-fit flex-col items-center justify-center rounded-lg border border-[#58A5D5] bg-[#EEF8FF] p-2">
                                {stat.icon}
                            </div>
                            <div className="flex w-fit flex-col items-start gap-1">
                                <p className="w-fit text-xs tracking-[0.01em] text-black">{stat.label}</p>
                                <p className="w-fit text-sm font-semibold tracking-[0.01em] text-black">{stat.value}</p>
                            </div>
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

function IconActiveEmployees() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path
                d="M10.6669 14V12.6667C10.6669 11.9594 10.3859 11.2811 9.88577 10.781C9.38563 10.281 8.7073 10 8 10H3.99968C3.29238 10 2.61405 10.281 2.11391 10.781C1.61377 11.2811 1.3328 11.9594 1.3328 12.6667V14M10.6669 2.08529C11.2388 2.23353 11.7452 2.56746 12.1068 3.03466C12.4683 3.50186 12.6645 4.07588 12.6645 4.66662C12.6645 5.25736 12.4683 5.83138 12.1068 6.29858C11.7452 6.76578 11.2388 7.09971 10.6669 7.24795M14.6672 13.9999V12.6666C14.6668 12.0757 14.4701 11.5018 14.1081 11.0348C13.746 10.5678 13.2392 10.2343 12.667 10.0866M8.66672 4.66667C8.66672 6.13943 7.47272 7.33333 5.99984 7.33333C4.52696 7.33333 3.33296 6.13943 3.33296 4.66667C3.33296 3.19391 4.52696 2 5.99984 2C7.47272 2 8.66672 3.19391 8.66672 4.66667Z"
                stroke="#1980C0"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconInactiveEmployees() {
    return (
        <div className="relative size-4 overflow-hidden">
            <div className="absolute top-0.5 left-0.5 h-3 w-[11px]">
                <svg
                    width="7"
                    height="7"
                    viewBox="0 0 7 7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-0 left-px size-1.5"
                >
                    <path
                        d="M5.62132 1.37868C6.18393 1.94129 6.5 2.70435 6.5 3.5C6.5 4.29565 6.18393 5.05871 5.62132 5.62132C5.05871 6.18393 4.29565 6.5 3.5 6.5C2.70435 6.5 1.94129 6.18393 1.37868 5.62132C0.816071 5.05871 0.5 4.29565 0.5 3.5C0.5 2.70435 0.816071 1.94129 1.37868 1.37868C1.94129 0.816071 2.70435 0.5 3.5 0.5C4.29565 0.5 5.05871 0.816071 5.62132 1.37868Z"
                        stroke="#1980C0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <svg
                    width="12"
                    height="6"
                    viewBox="0 0 12 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-[7px] left-0 h-[5px] w-[11px]"
                >
                    <path
                        d="M8.2 5.5C8.2 4.40793 7.79438 3.36059 7.07236 2.58838C6.35035 1.81618 5.37108 1.38235 4.35 1.38235C3.32892 1.38235 2.34965 1.81618 1.62764 2.58838C0.905624 3.36059 0.5 4.40793 0.5 5.5M11.5 0.5H8.2"
                        stroke="#1980C0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
}

function IconNewEmployees() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path
                d="M11.5 8V4.5M11.5 4.5V4M11.5 4.5C11.5 5 13.5 7 13.5 7.5M13.5 7.5V4M13.5 7.5V8M2.5 14V13.5C2.5 12.4391 2.92143 11.4217 3.67157 10.6716C4.42172 9.92143 5.43913 9.5 6.5 9.5H7.5C8.56087 9.5 9.57828 9.92143 10.3284 10.6716C11.0786 11.4217 11.5 12.4391 11.5 13.5V14M9.5 5C9.5 5.66304 9.23661 6.29893 8.76777 6.76777C8.29893 7.23661 7.66304 7.5 7 7.5C6.33696 7.5 5.70107 7.23661 5.23223 6.76777C4.76339 6.29893 4.5 5.66304 4.5 5C4.5 4.33696 4.76339 3.70107 5.23223 3.23223C5.70107 2.76339 6.33696 2.5 7 2.5C7.66304 2.5 8.29893 2.76339 8.76777 3.23223C9.23661 3.70107 9.5 4.33696 9.5 5Z"
                stroke="#1980C0"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function OverviewCardDemo() {
    return (
        <OverviewCard
            title="Overview of 2026"
            stats={[
                { icon: <IconActiveEmployees />, label: 'Total Karyawan Aktif', value: 248 },
                { icon: <IconInactiveEmployees />, label: 'Karyawan Non Aktif', value: 248 },
                { icon: <IconNewEmployees />, label: 'Karyawan Baru', value: 248 },
            ]}
        />
    );
}

export function EmployeeOverviewCardDemo() {
    return (
        <OverviewCard
            title="DATA KARYAWAN"
            stats={[
                { icon: <IconActiveEmployees />, label: 'Karyawan Aktif', value: 248 },
                { icon: <IconInactiveEmployees />, label: 'Karyawan Non Aktif', value: 248 },
                { icon: <IconNewEmployees />, label: 'Karyawan Baru', value: 248 },
            ]}
        />
    );
}

function IconTotalAssets() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path
                d="M2 5.33333L8 2L14 5.33333M2 5.33333L8 8.66667M2 5.33333V10.6667L8 14M14 5.33333L8 8.66667M14 5.33333V10.6667L8 14M8 8.66667V14"
                stroke="#1980C0"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconAssetsBorrowed() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path d="M2 8H10M10 8L7 5M10 8L7 11M14 3.33333V12.6667" stroke="#1980C0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconAssetsAvailable() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path d="M13.5 4L6 11.5L2.5 8" stroke="#1980C0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function AssetOverviewCardDemo() {
    return (
        <OverviewCard
            title="DATA ASET"
            stats={[
                { icon: <IconTotalAssets />, label: 'Total Semua Aset', value: 980 },
                { icon: <IconAssetsBorrowed />, label: 'Aset Dipinjam Karyawan', value: 600 },
                { icon: <IconAssetsAvailable />, label: 'Aset Yang Tersedia', value: 6 },
            ]}
        />
    );
}
