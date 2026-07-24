export interface AttendanceStat {
    label: string;
    value: string | number;
}

interface AttendanceStatusSummaryProps {
    stats: AttendanceStat[];
}

export function AttendanceStatusSummary({ stats }: AttendanceStatusSummaryProps) {
    return (
        <div className="flex w-full items-start gap-4">
            {stats.map((stat) => (
                <div key={stat.label} className="flex w-full items-center justify-between rounded-lg border border-[#E7E7E7] bg-[#FAFBFD] px-4 py-2">
                    <p className="font-poppins w-fit text-[10px] text-[#4F4F4F]">{stat.label}</p>
                    <p className="font-poppins w-fit text-xs font-semibold text-[#030616]">{stat.value}</p>
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
