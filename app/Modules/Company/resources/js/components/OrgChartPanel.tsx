import { OrgChart, type OrgDepartment, type OrgDivision, type OrgMember } from '@/components/design-system/org-chart/org-chart';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

interface OrgChartPanelProps {
    ceo: OrgMember;
    departments: OrgDepartment[];
    onDivisionClick: (division: OrgDivision, departmentName: string) => void;
    onDepartmentClick: (department: OrgDepartment) => void;
}

/** The "Bagan Struktur" tab — zoomable org chart. Owns its own zoom level; nothing outside this view needs it. */
export function OrgChartPanel({ ceo, departments, onDivisionClick, onDepartmentClick }: OrgChartPanelProps) {
    const [zoom, setZoom] = useState(1);

    function zoomBy(delta: number) {
        setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 10) / 10)));
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-end border-b border-[#E2E8F0] p-5">
                <div className="flex items-center rounded-lg border border-[#E2E8F0]">
                    <button
                        type="button"
                        onClick={() => zoomBy(-ZOOM_STEP)}
                        disabled={zoom <= ZOOM_MIN}
                        className="flex items-center p-2 text-[#94A3B8] disabled:opacity-40"
                        aria-label="Perkecil"
                    >
                        <Minus className="size-4" />
                    </button>
                    <span className="w-12 text-center text-[13px] text-[#0F172A]">{Math.round(zoom * 100)}%</span>
                    <button
                        type="button"
                        onClick={() => zoomBy(ZOOM_STEP)}
                        disabled={zoom >= ZOOM_MAX}
                        className="flex items-center p-2 text-[#94A3B8] disabled:opacity-40"
                        aria-label="Perbesar"
                    >
                        <Plus className="size-4" />
                    </button>
                </div>
            </div>

            <div className="bg-[#FAFBFD]">
                <OrgChart tree={{ ceo, departments }} zoom={zoom} onDivisionClick={onDivisionClick} onDepartmentClick={onDepartmentClick} />
            </div>
        </div>
    );
}
