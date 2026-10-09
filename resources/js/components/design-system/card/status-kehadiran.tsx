export interface AttendanceStat {
    label: string;
    value: string | number;
}

interface AttendanceStatusSummaryProps {
    stats: AttendanceStat[];
}

export function AttendanceStatusSummary({ stats }: AttendanceStatusSummaryProps) {
    return (
        <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#E7E7E7] bg-[#FAFBFD] px-4 py-2"
                >
                    <p className="font-poppins min-w-0 text-[10px] text-[#4F4F4F]">{stat.label}</p>
                    <p className="font-poppins shrink-0 text-xs font-semibold text-[#030616]">{stat.value}</p>
                </div>
            ))}
        </div>
    );
}

export function AttendanceStatusSummaryDemo() {
    return (
        <AttendanceStatusSummary
            stats={[
                { label: 'On Time', value: 213 },
                { label: 'Terlambat', value: 21 },
                { label: 'Cuti', value: 53 },
                { label: 'Izin', value: 89 },
                { label: 'Alpha', value: 89 },
            ]}
        />
    );
}
