import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, FileText, Timer } from 'lucide-react';

type AttendanceMetric = {
    label: string;
    value: number;
    percentage: string;
    change: string;
    changeTone: 'positive' | 'negative';
    color: string;
    softColor: string;
    icon: typeof Clock3;
};

const metrics: AttendanceMetric[] = [
    { label: 'On Time', value: 213, percentage: '72,8%', change: '5% dari kemarin', changeTone: 'positive', color: '#16B89A', softColor: '#D9F7F0', icon: CheckCircle2 },
    { label: 'Terlambat', value: 21, percentage: '7,2%', change: '2% dari kemarin', changeTone: 'positive', color: '#F4B63F', softColor: '#FFF2D4', icon: Timer },
    { label: 'Cuti', value: 53, percentage: '18,1%', change: '3% dari kemarin', changeTone: 'negative', color: '#4CA4F5', softColor: '#DCEEFF', icon: CalendarDays },
    { label: 'Izin', value: 89, percentage: '30,5%', change: '4% dari kemarin', changeTone: 'negative', color: '#9A6BE8', softColor: '#EEE5FF', icon: FileText },
    { label: 'Alpha', value: 89, percentage: '30,5%', change: '4% dari kemarin', changeTone: 'positive', color: '#F47786', softColor: '#FFE3E8', icon: AlertTriangle },
];

function AttendanceGauge({ value, color }: { value: number; color: string }) {
    return (
        <div className="relative grid size-[62px] place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${value}%, #E8F0F2 0)` }} aria-label={`${value}% tingkat kehadiran`}>
            <div className="grid size-[48px] place-items-center rounded-full bg-white text-[11px] font-semibold text-[#1E3440]">{value}%</div>
        </div>
    );
}

export function AttendanceSummary() {
    return (
        <section aria-labelledby="attendance-summary-title">
            <div className="mb-3 flex items-center gap-2">
                <Clock3 className="size-4 text-[#169F8A]" />
                <h2 id="attendance-summary-title" className="font-poppins text-sm font-semibold text-[#203B46]">Ringkasan Kehadiran</h2>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
                <article className="min-h-[122px] rounded-xl border border-[#C7E9E3] bg-[#F8FFFD] p-3 shadow-[0_3px_12px_rgba(23,69,81,0.04)]">
                    <p className="font-poppins text-[10px] font-semibold text-[#435E68]">Ringkasan Kehadiran</p>
                    <div className="mt-3 flex items-center gap-2.5">
                        <AttendanceGauge value={72.8} color="#16B89A" />
                        <div className="min-w-0">
                            <p className="font-poppins text-[10px] leading-4 text-[#64818A]">Tingkat<br />kehadiran</p>
                            <p className="font-poppins text-[10px] font-semibold text-[#1B4450]">213 dari 293</p>
                        </div>
                    </div>
                </article>
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <article key={metric.label} className="min-h-[122px] rounded-xl border bg-white p-3 shadow-[0_3px_12px_rgba(23,69,81,0.04)]" style={{ borderColor: `${metric.color}55` }}>
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-poppins text-[10px] font-semibold" style={{ color: metric.color }}>{metric.label}</p>
                                <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: metric.softColor }}><Icon className="size-3.5" style={{ color: metric.color }} /></span>
                            </div>
                            <p className="mt-1 font-poppins text-2xl font-semibold leading-none text-[#24434D]">{metric.value}</p>
                            <p className="mt-1 font-poppins text-[9px] text-[#7D939A]">{metric.percentage} dari total<br />karyawan</p>
                            <p className="mt-1 font-poppins text-[9px] text-[#82969C]"><span className={metric.changeTone === 'positive' ? 'text-[#16B89A]' : 'text-[#F47786]'}>{metric.changeTone === 'positive' ? '↗' : '↘'} {metric.change}</span></p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
