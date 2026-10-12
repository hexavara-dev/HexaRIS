import {
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { cn } from '@/lib/utils';

interface TableHScrollBarProps {
    /** The `.table-scroll` overflow container whose horizontal scroll this bar mirrors. */
    targetRef: RefObject<HTMLDivElement | null>;
    /** Merged onto the track — use it for spacing, e.g. `mt-2`. */
    className?: string;
}

/**
 * Visible horizontal scrollbar for a wide table, rendered under the table card.
 * The native scrollbar is hidden on the container (it doesn't show reliably on
 * touch devices, so the table just looked cut off) — this bar is the always
 * visible affordance: drag the thumb, or click the track to jump. The container
 * itself keeps scrolling the same way underneath (wheel, touch drag, keyboard),
 * and the bar mirrors scrollLeft in both directions.
 */
export function TableHScrollBar({ targetRef, className }: TableHScrollBarProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [metrics, setMetrics] = useState({ scrollable: false, thumbW: 0, thumbX: 0 });
    const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number } | null>(null);

    const sync = useCallback(() => {
        const target = targetRef.current;
        const track = trackRef.current;

        if (!target || !track) return;

        const trackW = track.clientWidth;
        const { clientWidth, scrollWidth, scrollLeft } = target;

        if (trackW <= 0 || scrollWidth <= clientWidth) {
            setMetrics((previous) => (previous.scrollable ? { scrollable: false, thumbW: 0, thumbX: 0 } : previous));
            return;
        }

        const thumbW = Math.max(28, Math.round((clientWidth / scrollWidth) * trackW));
        const maxThumbX = trackW - thumbW;
        const maxScroll = scrollWidth - clientWidth;
        const thumbX = maxThumbX > 0 ? Math.round((scrollLeft / maxScroll) * maxThumbX) : 0;

        setMetrics({ scrollable: true, thumbW, thumbX });
    }, [targetRef]);

    useEffect(() => {
        const target = targetRef.current;
        const track = trackRef.current;

        if (!target || !track) return;

        sync();

        target.addEventListener('scroll', sync, { passive: true });

        const observer = new ResizeObserver(sync);
        observer.observe(target);
        observer.observe(track);
        // Row/column changes alter scrollWidth without necessarily resizing the
        // container itself — watch the table too so pagination/filter keep the bar honest.
        if (target.firstElementChild) observer.observe(target.firstElementChild);

        return () => {
            target.removeEventListener('scroll', sync);
            observer.disconnect();
        };
    }, [targetRef, sync]);

    const onThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const target = targetRef.current;
        if (!target) return;

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScroll: target.scrollLeft };
    };

    const onThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        const target = targetRef.current;
        const track = trackRef.current;

        if (!drag || drag.pointerId !== event.pointerId || !target || !track) return;

        const thumbSpan = track.clientWidth - metrics.thumbW;
        const maxScroll = target.scrollWidth - target.clientWidth;

        if (thumbSpan <= 0 || maxScroll <= 0) return;

        target.scrollLeft = drag.startScroll + ((event.clientX - drag.startX) / thumbSpan) * maxScroll;
    };

    const onThumbPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;

        dragRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const onTrackClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        // Clicks on the thumb belong to dragging; only a bare track click jumps.
        if (event.target !== trackRef.current) return;

        const target = targetRef.current;
        const track = trackRef.current;

        if (!target || !track) return;

        const rect = track.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;

        target.scrollLeft = ratio * target.scrollWidth - target.clientWidth / 2;
    };

    const { scrollable, thumbW, thumbX } = metrics;

    return (
        <div
            ref={trackRef}
            onClick={onTrackClick}
            className={cn('relative h-2 w-full cursor-pointer rounded-full bg-[#F3F4F6]', !scrollable && 'invisible', className)}
            aria-hidden
        >
            <div
                onPointerDown={onThumbPointerDown}
                onPointerMove={onThumbPointerMove}
                onPointerUp={onThumbPointerEnd}
                onPointerCancel={onThumbPointerEnd}
                style={{ width: thumbW, transform: `translateX(${thumbX}px)` }}
                className="absolute inset-y-0 left-0 cursor-grab touch-none rounded-full bg-[#D1D5DB] transition-colors hover:bg-[#9CA3AF] active:cursor-grabbing"
            />
        </div>
    );
}
