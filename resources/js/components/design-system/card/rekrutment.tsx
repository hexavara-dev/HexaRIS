export interface RecruitmentSummaryStat {
    label: string;
    value: string | number;
}

export interface RecruitmentPipelineStage {
    label: string;
    value: string | number;
}

interface RecruitmentPipelineCardProps {
    title: string;
    description: string;
    summary: RecruitmentSummaryStat[];
    stages: RecruitmentPipelineStage[];
}

export function RecruitmentPipelineCard({ title, description, summary, stages }: RecruitmentPipelineCardProps) {
    return (
        <div className="flex w-full flex-col items-start justify-between gap-5 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_3px_0px_rgba(15,23,42,0.02)]">
            <div className="flex w-full flex-col items-start gap-1">
                <p className="font-poppins w-fit text-sm font-semibold text-black">{title}</p>
                <p className="w-full text-xs leading-4 text-[#475569]">{description}</p>
            </div>

            <div className="flex w-full items-start gap-3">
                {summary.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex w-full items-center justify-between rounded-lg border border-[#E7E7E7] bg-[#FAFBFD] px-4 py-2"
                    >
                        <p className="w-fit text-xs tracking-[0.01em] text-[#4F4F4F]">{stat.label}</p>
                        <p className="font-poppins w-fit text-sm font-semibold text-[#030616]">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex w-full flex-col items-start gap-3">
                {stages.map((stage) => (
                    <div key={stage.label} className="flex w-full items-center justify-between">
                        <p className="w-fit text-xs leading-4 font-medium text-[#0F172A]">{stage.label}</p>
                        <p className="w-fit text-xs leading-4 font-medium text-[#475569]">{stage.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function RecruitmentPipelineCardDemo() {
    return (
        <RecruitmentPipelineCard
            title="REKRUTMENT"
            description="Lamaran masuk → Hired"
            summary={[
                { label: 'Total Semua Lowongan', value: 487 },
                { label: 'Total Sema Pendaftar', value: 21 },
            ]}
            stages={[
                { label: 'Pendaftar', value: 120 },
                { label: 'Screening CV', value: 42 },
                { label: 'Interview HR', value: 18 },
                { label: 'Interview User', value: 9 },
                { label: 'Tes Psikotes / Assessment', value: 5 },
                { label: 'Teknikal Tes', value: 5 },
                { label: 'Interview Final', value: 5 },
                { label: 'Offering', value: 5 },
                { label: 'Dibatalkan/Ditolak', value: 5 },
                { label: 'Bergabung', value: 5 },
            ]}
        />
    );
}
