export interface PerformanceEntry {
    name: string;
    score: number;
}

interface TopPerformanceCardProps {
    title: string;
    description: string;
    data: PerformanceEntry[];
    maxScore?: number;
    scaleSteps?: number[];
}

const NAME_COLUMN_WIDTH = 'w-12';
const SCORE_COLUMN_WIDTH = 'w-8';

export function TopPerformanceCard({ title, description, data, maxScore = 100, scaleSteps = [0, 20, 40, 60, 80, 100] }: TopPerformanceCardProps) {
    return (
        <div className="flex w-full flex-col items-start gap-5 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_3px_0px_rgba(15,23,42,0.02)]">
            <div className="flex w-full flex-col items-start gap-1">
                <p className="font-poppins w-fit text-sm font-semibold text-black">{title}</p>
                <p className="w-full text-xs leading-4 text-[#475569]">{description}</p>
            </div>

            <div className="flex w-full flex-col items-start gap-3">
                <div className="flex w-full flex-col items-start gap-1.5 py-1.5">
                    {data.map((entry) => (
                        <div key={entry.name} className="flex w-full items-center gap-1.5">
                            <p className={`${NAME_COLUMN_WIDTH} shrink-0 truncate text-xs leading-4 font-medium text-[#0F172A]`}>{entry.name}</p>
                            <div className="h-2 w-full overflow-hidden rounded bg-[#E2E8F0]">
                                <div className="h-full rounded bg-[#1980C0]" style={{ width: `${Math.min(100, (entry.score / maxScore) * 100)}%` }} />
                            </div>
                            <p className={`${SCORE_COLUMN_WIDTH} shrink-0 text-xs leading-4 font-medium text-[#475569]`}>{entry.score}</p>
                        </div>
                    ))}
                </div>

                <div className="flex w-full items-center gap-1.5">
                    <div className={`${NAME_COLUMN_WIDTH} shrink-0`} />
                    <div className="flex w-full items-start justify-between border-t border-t-[#E7E7E7] py-0.5">
                        {scaleSteps.map((step) => (
                            <p key={step} className="font-poppins w-fit text-xs leading-4 font-medium text-[#94A3B8]">
                                {step}
                            </p>
                        ))}
                    </div>
                    <div className={`${SCORE_COLUMN_WIDTH} shrink-0`} />
                </div>
            </div>
        </div>
    );
}

export function TopPerformanceCardDemo() {
    return (
        <TopPerformanceCard
            title="PERFORMA"
            description="Karyawan dengan skor penialain tertinggi - terendah periode 2026"
            data={[
                { name: 'Ajeng', score: 100 },
                { name: 'Wayu', score: 87 },
                { name: 'Dandi', score: 70 },
                { name: 'Ratna', score: 70 },
                { name: 'Sakia', score: 18 },
                { name: 'Alex', score: 12 },
                { name: 'Ayu', score: 12 },
                { name: 'Andini', score: 12 },
                { name: 'Ami', score: 9 },
                { name: 'Ratu', score: 7 },
            ]}
        />
    );
}
