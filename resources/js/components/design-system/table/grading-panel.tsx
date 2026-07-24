import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface GradingKpiRow {
    id: string;
    title: string;
    weight: number;
    target: string;
    realization: string;
    supervisorRating: string;
    accumulatedScore: number;
}

export interface GradingRatingOption {
    label: string;
    value: string;
}

interface GradingPanelProps {
    title: string;
    rows: GradingKpiRow[];
    ratingOptions: GradingRatingOption[];
    onRatingChange?: (rowId: string, rating: string) => void;
    totalScore: number;
    totalPercentage: number;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

export function GradingPanel({ title, rows, ratingOptions, onRatingChange, totalScore, totalPercentage }: GradingPanelProps) {
    return (
        <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex w-full items-center justify-between border-b border-b-[#E2E8F0] pb-3">
                <p className="font-poppins text-[15px] font-bold text-[#0F172A]">{title}</p>
            </div>

            <div className="flex w-full items-center gap-4 rounded-md bg-[#F8FAFC] px-4 py-2">
                <p className="font-poppins w-32 text-[11px] font-bold text-[#64748B]">KPI</p>
                <div className="flex w-full items-center gap-6">
                    <p className="font-poppins w-[164px] shrink-0 text-center text-[11px] font-bold text-[#64748B]">Bobot</p>
                    <p className="font-poppins w-full text-center text-[11px] font-bold text-[#64748B]">Target</p>
                    <p className="font-poppins w-full text-[11px] font-bold text-[#64748B]">Realisasi KPI</p>
                    <p className="font-poppins w-full text-[11px] font-bold text-[#64748B]">Nilai (Atasan)</p>
                    <p className="font-poppins w-full text-right text-[11px] font-bold text-[#64748B]">Skor Akumulasi</p>
                </div>
            </div>

            {rows.map((row) => (
                <div key={row.id} className="flex w-full flex-col items-start gap-4 border-b border-b-[#E2E8F0] p-4">
                    <div className="flex w-full items-center gap-[13px]">
                        <div className="flex w-[201px] flex-col items-start gap-1">
                            <p className="font-poppins w-full text-sm font-bold text-[#0F172A]">{row.title}</p>
                        </div>
                        <div className="flex w-full items-center gap-[17px]">
                            <div className="w-[156px] shrink-0">
                                <p className="font-poppins text-xs font-semibold text-black">{row.weight}%</p>
                            </div>
                            <div className="w-[101px] shrink-0">
                                <p className="font-poppins text-xs font-semibold text-black">{row.target}</p>
                            </div>
                            <div className="w-[156px] shrink-0">
                                <p className="font-poppins text-xs text-black">{row.realization}</p>
                            </div>
                            <div className="w-[122px] shrink-0">
                                <Select value={row.supervisorRating} onValueChange={(value) => onRatingChange?.(row.id, value)}>
                                    <SelectTrigger className="font-poppins h-auto rounded-md border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0F172A]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ratingOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-[132px] flex-col items-end gap-0.5">
                                <p className="font-poppins text-sm font-bold text-[#0F172A]">{formatNumber(row.accumulatedScore)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex w-full items-center justify-between rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] p-4">
                <p className="font-poppins text-sm font-bold text-[#166534]">Total Skor</p>
                <p className="font-poppins text-base font-extrabold text-[#166534]">
                    {formatNumber(totalScore)} ({formatNumber(totalPercentage)}%)
                </p>
            </div>
        </div>
    );
}
