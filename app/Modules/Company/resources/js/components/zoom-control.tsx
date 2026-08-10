import { Minus, Plus } from 'lucide-react';

interface ZoomControlProps {
    /** Whole-number percentage for display, e.g. `80` — see `useZoom`. */
    percentage: number;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
}

/** The −/NN%/+ stepper, shared by the template editor's toolbar and the read-only detail dialog. */
export function ZoomControl({ percentage, canZoomIn, canZoomOut, onZoomIn, onZoomOut }: ZoomControlProps) {
    return (
        <div className="flex items-center rounded-lg border border-[#E2E8F0]">
            <button
                type="button"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className="flex cursor-pointer items-center p-1.5 text-[#94A3B8] disabled:cursor-default disabled:opacity-40"
                aria-label="Perkecil"
            >
                <Minus className="size-3.5" />
            </button>
            <span className="w-10 text-center text-xs text-[#0F172A]">{percentage}%</span>
            <button
                type="button"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className="flex cursor-pointer items-center p-1.5 text-[#94A3B8] disabled:cursor-default disabled:opacity-40"
                aria-label="Perbesar"
            >
                <Plus className="size-3.5" />
            </button>
        </div>
    );
}
