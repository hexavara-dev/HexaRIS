import { OrgChart, type OrgDepartment, type OrgMember } from '@/components/design-system/org-chart/org-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

interface OrgChartPanelProps {
    cabang: string;
    cabangOptions: string[];
    ceo: OrgMember;
    departments: OrgDepartment[];
    onCabangChange: (cabang: string) => void;
}

/** The "Bagan Struktur" tab — zoomable org chart. Owns its own zoom level; nothing outside this view needs it. */
export function OrgChartPanel({ cabang, cabangOptions, ceo, departments, onCabangChange }: OrgChartPanelProps) {
    const [zoom, setZoom] = useState(1);

    function zoomBy(delta: number) {
        setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 10) / 10)));
    }

    return (
        <div className="relative flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-[#D9E2EC] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] p-5">
                <Select value={cabang} onValueChange={onCabangChange}>
                    <SelectTrigger className="h-10 w-[180px] rounded-lg border-[#CBD5E1] bg-white text-[13px] font-medium text-[#334155]">
                        <SelectValue placeholder="Pilih cabang" />
                    </SelectTrigger>
                    <SelectContent>
                        {cabangOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                                Cabang: {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex h-9 items-center rounded-lg border border-[#E2E8F0] bg-white">
                    <button
                        type="button"
                        onClick={() => zoomBy(-ZOOM_STEP)}
                        disabled={zoom <= ZOOM_MIN}
                        className="flex h-full items-center px-2 text-[#94A3B8] transition-colors hover:text-[#1980C0] disabled:opacity-40"
                        aria-label="Perkecil"
                    >
                        <Minus className="size-3.5" />
                    </button>
                    <span className="w-12 text-center text-[13px] text-[#0F172A]">{Math.round(zoom * 100)}%</span>
                    <button
                        type="button"
                        onClick={() => zoomBy(ZOOM_STEP)}
                        disabled={zoom >= ZOOM_MAX}
                        className="flex h-full items-center px-2 text-[#94A3B8] transition-colors hover:text-[#1980C0] disabled:opacity-40"
                        aria-label="Perbesar"
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 bg-[#F8FAFC]">
                <OrgChart tree={{ cabang, cabangOptions, ceo, departments }} zoom={zoom} />
            </div>

            <div className="pointer-events-none absolute right-5 bottom-5 w-[290px] rounded-lg border border-[#E2E8F0] bg-white px-5 py-4 shadow-lg">
                <p className="font-poppins text-[15px] font-semibold text-[#0F172A]">HRIS Assistant</p>
            </div>
        </div>
    );
}
