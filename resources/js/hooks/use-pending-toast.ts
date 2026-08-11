import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Client-side counterpart to `useFlash` — a success message that survives an
 * Inertia navigation and is shown on arrival at the next page.
 *
 * Needed because `<Toaster />` lives inside the layout, so it unmounts with the
 * outgoing page and a fresh one mounts with the incoming page. Sonner doesn't
 * replay toasts to a newly-subscribed `<Toaster />`, so anything emitted during
 * the page swap (e.g. from Inertia's `onSuccess`) is silently lost. Parking the
 * message in `sessionStorage` and reading it after the new layout has mounted
 * sidesteps that timing entirely.
 *
 * Use this only for flows with no server round-trip (the localStorage-backed mock
 * modules). Anything that actually hits the server should use a real Laravel
 * flash message and `useFlash` instead.
 */
const PENDING_TOAST_KEY = 'hexaris.pending-toast';

/** Queue a success toast for the page being navigated to. Call this *before* the visit. */
export function setPendingToast(message: string) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(PENDING_TOAST_KEY, message);
}

/** Shows and clears any queued message. Called once in `AppLayout`, so every page gets it. */
export function usePendingToast() {
    const { url } = usePage();

    useEffect(() => {
        const message = window.sessionStorage.getItem(PENDING_TOAST_KEY);
        if (!message) return;
        window.sessionStorage.removeItem(PENDING_TOAST_KEY);
        toast.success(message);
    }, [url]);
}
