export type PengajuanDecision = 'approved' | 'rejected' | 'deleted';

const STORAGE_KEY = 'hexaris.employee.pengajuan-decisions';

/**
 * Decisions already taken on the change-request queue. Kept in localStorage so
 * an approved/rejected/deleted pengajuan does not reappear after a refresh —
 * the queue itself is static dummy data.
 */
export function loadPengajuanDecisions(): Record<string, PengajuanDecision> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return {};
        }

        const parsed: unknown = JSON.parse(raw);

        return typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, PengajuanDecision>)
            : {};
    } catch {
        return {};
    }
}

export function savePengajuanDecision(id: string, decision: PengajuanDecision): Record<string, PengajuanDecision> {
    const next = { ...loadPengajuanDecisions(), [id]: decision };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    return next;
}
