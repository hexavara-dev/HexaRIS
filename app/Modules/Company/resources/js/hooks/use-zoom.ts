import { useState } from 'react';

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;

/**
 * A clamped zoom level plus its stepper controls. Rounding each step keeps the
 * displayed percentage clean — float accumulation would otherwise show 79%
 * instead of 80% after a few clicks.
 */
export function useZoom(initial = 1) {
    const [zoom, setZoom] = useState(initial);

    function zoomBy(delta: number) {
        setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 10) / 10)));
    }

    return {
        zoom,
        zoomIn: () => zoomBy(ZOOM_STEP),
        zoomOut: () => zoomBy(-ZOOM_STEP),
        canZoomIn: zoom < ZOOM_MAX,
        canZoomOut: zoom > ZOOM_MIN,
        /** Whole-number percentage for display, e.g. `80` for 0.8. */
        percentage: Math.round(zoom * 100),
    };
}
