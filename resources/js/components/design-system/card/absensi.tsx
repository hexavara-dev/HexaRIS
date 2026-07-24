export interface KpiStat {
    label: string;
    value: string | number;
}

interface KpiCardProps {
    title: string;
    stats: KpiStat[];
}

export function KpiCard({ title, stats }: KpiCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_3px_0px_rgba(15,23,42,0.02)]">
            <p className="font-poppins w-fit text-sm font-semibold text-black">{title}</p>
            <div className="flex w-full items-start gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex w-full flex-col items-start gap-1">
                        <p className="w-fit text-xs tracking-[0.01em] text-black">{stat.label}</p>
                        <p className="w-fit text-sm font-semibold tracking-[0.01em] text-black">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function KpiCardDemo() {
    return (
        <KpiCard
            title="DATA KARYAWAN"
            stats={[
                { label: 'Karyawan Aktif', value: 248 },
                { label: 'Karyawan Non Aktif', value: 248 },
                { label: 'Karyawan Baru', value: 248 },
            ]}
        />
    );
}
