import { cn } from '@/lib/utils';
import { ArrowDown, ArrowRight, ArrowUp, Clock, Users, Wallet } from 'lucide-react';

type OvertimeMetric = {
    label: string;
    value: string;
    prefix?: string;
    unit?: string;
    change: string;
    changeTone: 'positive' | 'negative';
    color: string;
    softColor: string;
    icon: typeof Clock;
    // The first card is drawn with a blue border and a link arrow in the design.
    highlighted?: boolean;
};

const metrics: OvertimeMetric[] = [
    { label: 'Menunggu Approval', value: '21', change: '5%', changeTone: 'negative', color: '#F4B63F', softColor: '#FFF1DC', icon: Clock, highlighted: true },
    { label: 'Total Jam Lembur', value: '246', unit: 'jam', change: '12%', changeTone: 'positive', color: '#1980C0', softColor: '#E3F0FB', icon: Clock },
    { label: 'Karyawan Lembur', value: '38', change: '10%', changeTone: 'positive', color: '#8B5CF6', softColor: '#EFE9FD', icon: Users },
    { label: 'Est. Biaya Lembur', value: '12,5', prefix: 'Rp', unit: 'jt', change: '8%', changeTone: 'positive', color: '#16B89A', softColor: '#DDF6EF', icon: Wallet },
];

export function OvertimeSummary() {
    return (
        <section aria-label="Ringkasan lembur" className="font-poppins grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                const isPositive = metric.changeTone === 'positive';
                const TrendIcon = isPositive ? ArrowUp : ArrowDown;

                return (
                    <article
                        key={metric.label}
                        className={cn(
                            'flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]',
                            metric.highlighted ? 'border-[#A8D2F0]' : 'border-[#E8EEF6]',
                        )}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <span className="grid size-12 shrink-0 place-items-center rounded-full" style={{ backgroundColor: metric.softColor }}>
                                <Icon className="size-6" style={{ color: metric.color }} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#1E293B]">{metric.label}</p>
                                <p className="mt-0.5 text-2xl leading-tight font-semibold text-[#1E293B]">
                                    {metric.prefix && <span className="mr-1 text-sm">{metric.prefix}</span>}
                                    {metric.value}
                                    {metric.unit && <span className="ml-1 text-sm">{metric.unit}</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[10px] text-[#8A94A6]">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium',
                                        isPositive ? 'bg-[#E4F6EC] text-[#17A673]' : 'bg-[#FDE9E9] text-[#E5484D]',
                                    )}
                                >
                                    <TrendIcon className="size-3" />
                                    {metric.change}
                                </span>
                                <span>dari bulan lalu</span>
                            </div>
                            {metric.highlighted && <ArrowRight className="size-4 shrink-0 text-[#1E293B]" />}
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
