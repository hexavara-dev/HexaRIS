import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, Clock3, FileText } from 'lucide-react';
import { useState } from 'react';
import { LeaveQuotaDialog } from './leave-quota-dialog';

type LeaveMetric = {
    label: string;
    value: number;
    change: string;
    changeTone: 'positive' | 'negative';
    color: string;
    softColor: string;
    borderColor: string;
    icon: typeof Clock3;
    interactive?: boolean;
};

const metrics: LeaveMetric[] = [
    { label: 'Menunggu Approval', value: 21, change: '5% dari bulan lalu', changeTone: 'negative', color: '#F4B63F', softColor: '#FFF2D4', borderColor: '#DBEAF6', icon: Clock3 },
    { label: 'Total Cuti', value: 487, change: '12% dari bulan lalu', changeTone: 'positive', color: '#1980C0', softColor: '#E8F3FB', borderColor: '#DBEAF6', icon: CalendarDays, interactive: true },
    { label: 'Total Izin', value: 213, change: '12% dari bulan lalu', changeTone: 'positive', color: '#16B89A', softColor: '#D9F7F0', borderColor: '#F1F4F7', icon: FileText },
];

export function LeaveSummary() {
    const [quotaOpen, setQuotaOpen] = useState(false);

    return (
        <section aria-label="Ringkasan izin dan cuti" className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                const TrendIcon = metric.changeTone === 'positive' ? ArrowUp : ArrowDown;
                return (
                    <article
                        key={metric.label}
                        role={metric.interactive ? 'button' : undefined}
                        tabIndex={metric.interactive ? 0 : undefined}
                        onClick={metric.interactive ? () => setQuotaOpen(true) : undefined}
                        onKeyDown={
                            metric.interactive
                                ? (event) => {
                                      if (event.key === 'Enter' || event.key === ' ') setQuotaOpen(true);
                                  }
                                : undefined
                        }
                        className={`font-poppins flex min-h-[112px] flex-col justify-between rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]${metric.interactive ? ' cursor-pointer hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none' : ''}`}
                        style={{ borderColor: metric.borderColor }}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-[#374151]">{metric.label}</p>
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: metric.softColor }}>
                                <Icon className="size-4" style={{ color: metric.color }} />
                            </span>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                            <div>
                                <p className="text-2xl font-semibold leading-none text-[#111827]">{metric.value}</p>
                                <p className="mt-2 flex items-center gap-1 text-[11px] text-[#6B7280]">
                                    <TrendIcon className={metric.changeTone === 'positive' ? 'size-3 text-[#16B89A]' : 'size-3 text-[#F47786]'} />
                                    <span className={metric.changeTone === 'positive' ? 'text-[#16B89A]' : 'text-[#F47786]'}>{metric.change}</span>
                                </p>
                            </div>
                            <ArrowRight className="size-4 shrink-0 text-[#111827]" />
                        </div>
                    </article>
                );
            })}
            <LeaveQuotaDialog open={quotaOpen} onOpenChange={setQuotaOpen} />
        </section>
    );
}
