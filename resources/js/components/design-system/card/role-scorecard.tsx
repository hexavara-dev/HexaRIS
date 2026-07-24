import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';

export interface RoleKpiItem {
    label: string;
    weight: string;
    target: string;
    result: string;
}

interface RoleScorecardProps {
    role: string;
    objectiveEmoji: string;
    objective: string;
    kpis: RoleKpiItem[];
    accentColor?: string;
    onOpenMenu?: () => void;
}

function KpiTag({ children, tone }: { children: ReactNode; tone: 'info' | 'success' }) {
    return (
        <p
            className={cn(
                'font-poppins w-fit rounded py-0.5 text-[9px] font-semibold',
                tone === 'info' ? 'bg-[#EFF6FF] px-1.5 text-[#1D4ED8]' : 'overflow-hidden bg-[#E5F7EB] px-1 text-[#148C3D]',
            )}
        >
            {children}
        </p>
    );
}

export function RoleScorecard({ role, objectiveEmoji, objective, kpis, accentColor = '#1980C0', onOpenMenu }: RoleScorecardProps) {
    return (
        <div
            className="flex w-full flex-col items-start justify-between gap-4 rounded-xl border-x border-t-4 border-b bg-white p-5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05),0px_1px_4px_0px_rgba(0,0,0,0.05)]"
            style={{ borderColor: accentColor }}
        >
            <p className="font-poppins w-full text-[15px] font-bold text-[#1E293B]">{role}</p>

            <div className="flex w-full items-center gap-2">
                <p className="w-fit text-base text-black">{objectiveEmoji}</p>
                <p className="font-poppins w-full text-xs font-semibold text-[#0F172A]">{objective}</p>
            </div>

            <div className="flex w-full flex-col items-start gap-3.5">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="flex w-full flex-col items-start gap-1.5">
                        <p className="font-poppins line-clamp-1 w-fit overflow-hidden text-[11px] font-medium text-ellipsis text-[#1E293B]">
                            KPI : {kpi.label}
                        </p>
                        <div className="flex w-full items-center gap-2">
                            <KpiTag tone="info">Bobot {kpi.weight}</KpiTag>
                            <KpiTag tone="info">Target: {kpi.target}</KpiTag>
                            <KpiTag tone="success">Realisasi: {kpi.result}</KpiTag>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex w-full items-center justify-end gap-2.5">
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Opsi lainnya"
                    className="flex w-fit items-center gap-3 rounded-md border border-[#E7E7E7] bg-white p-1"
                >
                    <MoreVertical className="size-5 text-[#1D1B20]" />
                </button>
            </div>
        </div>
    );
}

export function RoleScorecardDemo() {
    return (
        <RoleScorecard
            role="Product Manager"
            objectiveEmoji="🎯"
            objective="Menurunkan jumlah komplain terkait produk"
            kpis={[
                { label: 'Tingkat kepuasan fitur (CSAT)', weight: '40%', target: '≥ 90%', result: '85%' },
                { label: 'User Story tervalidasi sebelum development', weight: '30%', target: '≥ 90%', result: '90%' },
                { label: 'Feature Requirement selesai tepat waktu', weight: '30%', target: '≥ 90%', result: '80%' },
            ]}
        />
    );
}
