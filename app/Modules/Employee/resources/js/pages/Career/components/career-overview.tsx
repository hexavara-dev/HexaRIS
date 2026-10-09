import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { averageMutationByBranch, careerChartDataByYear, organizationChanges } from '../data';
import { type CareerMetricItem } from '../types';

const chartTicks = [100, 80, 60, 40, 20, 0];

function ChangeChart() {
    const [year, setYear] = useState('2026');
    const chartData = careerChartDataByYear[year];

    return (
        <section className="min-w-0 rounded-xl border border-[#E7E7E7] bg-white p-4 sm:p-5" aria-labelledby="career-chart-title">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 id="career-chart-title" className="text-sm font-semibold text-[#1B1B1B]">
                    Grafik Perubahan
                </h2>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="h-8 w-[104px] rounded-md text-xs" aria-label="Pilih tahun grafik">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div
                className="grid h-44 grid-cols-[28px_minmax(0,1fr)] gap-2"
                role="img"
                aria-label={`Grafik perubahan jabatan dan mutasi dari Januari sampai Mei ${year}`}
            >
                <div className="flex flex-col justify-between pb-5 text-right text-[9px] leading-none text-[#8A94A6]" aria-hidden="true">
                    {chartTicks.map((tick) => (
                        <span key={tick}>{tick}</span>
                    ))}
                </div>
                <div className="relative min-w-0 pb-5">
                    <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between" aria-hidden="true">
                        {chartTicks.map((tick) => (
                            <span key={tick} className="block border-t border-[#E9EDF2]" />
                        ))}
                    </div>
                    <div className="relative grid h-full grid-cols-5 gap-2 sm:gap-4">
                        {chartData.map((item) => (
                            <div key={item.month} className="flex min-w-0 flex-col items-center justify-end">
                                <div className="flex h-[124px] w-full items-end justify-center gap-1 sm:gap-1.5">
                                    <span
                                        className="block w-[min(18px,38%)] rounded-t-sm bg-[#198AC5]"
                                        style={{ height: `${item.positionChanges}%` }}
                                        title={`${item.month}: ${item.positionChanges} perubahan jabatan`}
                                    />
                                    <span
                                        className="block w-[min(18px,38%)] rounded-t-sm bg-[#B89A13]"
                                        style={{ height: `${item.mutations}%` }}
                                        title={`${item.month}: ${item.mutations} mutasi`}
                                    />
                                </div>
                                <span className="mt-2 text-[10px] text-[#667085]">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#667085]">
                <span className="flex items-center gap-2">
                    <span className="size-2 rounded-sm bg-[#198AC5]" /> Perubahan Jabatan (50)
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-2 rounded-sm bg-[#B89A13]" /> Mutasi (30)
                </span>
            </div>
        </section>
    );
}

function MetricList({ title, items }: { title: string; items: CareerMetricItem[] }) {
    return (
        <section className="min-w-0 rounded-xl border border-[#E7E7E7] bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold text-[#1B1B1B]">{title}</h2>
            <dl className="space-y-1.5">
                {items.map((item) => (
                    <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 text-[11px]">
                        <dt className="truncate text-[#667085]">{item.label}</dt>
                        <dd className="shrink-0 font-semibold text-[#1B1B1B] tabular-nums">{item.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function ApprovalSummary() {
    return (
        <section className="rounded-xl border border-[#E7E7E7] bg-white p-4" aria-labelledby="approval-summary-title">
            <div className="mb-3 flex items-center justify-between gap-4">
                <h2 id="approval-summary-title" className="text-xs font-semibold text-[#1B1B1B]">
                    Menunggu Approval
                </h2>
                <a
                    href="#career-history"
                    className="flex size-11 items-center justify-center rounded-md text-[#344054] transition-colors hover:bg-[#F2F4F7] focus-visible:ring-2 focus-visible:ring-[#198AC5] focus-visible:outline-none sm:size-8"
                    aria-label="Lihat pengajuan yang menunggu approval"
                >
                    <ArrowRight className="size-4" />
                </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[11px] text-[#667085]">Perubahan Jabatan</p>
                    <p className="mt-1 text-2xl font-semibold text-[#27A844] tabular-nums">115</p>
                </div>
                <div>
                    <p className="text-[11px] text-[#667085]">Mutasi</p>
                    <p className="mt-1 text-2xl font-semibold text-[#27A844] tabular-nums">115</p>
                </div>
            </div>
        </section>
    );
}

export function CareerOverview() {
    return (
        <div className="rounded-2xl border border-[#E7E7E7] bg-[#FAFBFC] p-3 sm:p-4">
            <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
                <ChangeChart />
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetricList title="Rata-Rata Mutasi Ke" items={averageMutationByBranch} />
                    <MetricList title="Perubahan Organisasi" items={organizationChanges} />
                    <div className="sm:col-span-2">
                        <ApprovalSummary />
                    </div>
                </div>
            </div>
        </div>
    );
}
