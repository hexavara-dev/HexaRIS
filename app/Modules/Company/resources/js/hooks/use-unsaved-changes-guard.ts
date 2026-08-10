import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Blocks navigation away from a dirty form and surfaces a confirmation instead —
 * covers both in-app navigation (any Inertia `<Link>` click: "Batal", the
 * sidebar, breadcrumbs, ...) and leaving the browser tab entirely.
 *
 * The two are fundamentally different mechanisms:
 * - In-app: `router.on('before', ...)` sees every Inertia visit fired while this
 *   hook is mounted and can cancel it (`return false`) to show our own dialog.
 * - Tab close/refresh: only the browser's native `beforeunload` prompt exists —
 *   it can't be customized or replaced with a styled dialog, by design (a page
 *   can't fake a "leaving this site" warning to keep a user captive).
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
    // Read fresh inside listeners registered once on mount, without re-registering
    // them (and losing pending state) every time `isDirty` changes.
    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    // Set right before a visit *we* triggered (via `visit()` below) — lets that
    // one specific navigation through without re-opening the dialog it's part of.
    const allowNextRef = useRef(false);
    const pendingUrlRef = useRef<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        function handleBeforeUnload(event: BeforeUnloadEvent) {
            if (!isDirtyRef.current) return;
            event.preventDefault();
            // Legacy requirement some browsers still check for the prompt to appear.
            event.returnValue = '';
        }
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(
        () =>
            router.on('before', (event) => {
                if (allowNextRef.current) {
                    allowNextRef.current = false;
                    return true;
                }
                if (!isDirtyRef.current) return true;

                pendingUrlRef.current = event.detail.visit.url.toString();
                setConfirmOpen(true);
                return false;
            }),
        [],
    );

    /** Navigate through the guard — use for any visit triggered from inside this page (e.g. a direct "Simpan"), not just the dialog's own buttons. */
    function visit(url: string) {
        allowNextRef.current = true;
        router.visit(url);
    }

    /** Dialog dismissed without choosing — stay on the page, drop the blocked navigation. */
    function stay() {
        setConfirmOpen(false);
        pendingUrlRef.current = null;
    }

    /** Continue to whichever navigation was blocked — used by both "Tetap Batal" (as-is) and a successful "Simpan" (called after saving). */
    function proceedToPending() {
        setConfirmOpen(false);
        const url = pendingUrlRef.current;
        pendingUrlRef.current = null;
        if (url) visit(url);
    }

    return { confirmOpen, stay, proceedToPending, visit };
}
