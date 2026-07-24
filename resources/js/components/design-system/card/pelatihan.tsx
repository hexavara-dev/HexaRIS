export interface TrainingStat {
    label: string;
    value: string | number;
}

interface TrainingSummaryCardProps {
    title: string;
    stats: TrainingStat[];
}

export function TrainingSummaryCard({ title, stats }: TrainingSummaryCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_3px_0px_rgba(15,23,42,0.02)]">
            <p className="font-poppins w-fit text-sm font-semibold text-black">{title}</p>
            <div className="flex w-full flex-col items-start gap-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex w-full items-center justify-between rounded-lg border border-[#E7E7E7] bg-[#FAFBFD] px-4 py-2"
                    >
                        <p className="w-fit text-xs tracking-[0.01em] text-[#4F4F4F]">{stat.label}</p>
                        <p className="font-poppins w-fit text-sm font-semibold text-[#030616]">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function TrainingSummaryCardDemo() {
    return (
        <TrainingSummaryCard
            title="PELATIHAN"
            stats={[
                { label: 'Program Pelatihan', value: 487 },
                { label: 'Total Peserta', value: 53 },
                { label: 'Sertifikat Terbit', value: 21 },
            ]}
        />
    );
}
