import { ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The four filters the right-hand panel owns. Each option carries the design's
 * label but stores the value actually found on a row (`DummyEmployee`'s
 * employment_status / position / organization) so applying it can match data.
 */
export type EmployeeListFilter = {
    /** `'all'` or an `organization` value. */
    organization: string;
    /** `employment_status` values — empty means every contract. */
    contracts: string[];
    status: 'all' | 'active' | 'inactive';
    /** `position` values — empty means every level. */
    levels: string[];
};

export const EMPTY_LIST_FILTER: EmployeeListFilter = {
    organization: 'all',
    contracts: [],
    status: 'all',
    levels: [],
};

export const CONTRACT_FILTERS = [
    { label: 'Fulltime (PKWT)', value: 'PKWT' },
    { label: 'Fulltime (PKWTT)', value: 'Tetap' },
    { label: 'Freelance', value: 'Freelance' },
    { label: 'Intern', value: 'Probation' },
] as const;

export const LEVEL_FILTERS = [
    { label: 'Head', value: 'Kepala Bagian' },
    { label: 'Lead', value: 'Supervisor' },
    { label: 'Senior', value: 'Senior Staff' },
    { label: 'Middle', value: 'Manager' },
    { label: 'Junior', value: 'Staff' },
] as const;

const STATUS_FILTERS = [
    { label: 'Aktif', value: 'active' },
    { label: 'Non Aktif', value: 'inactive' },
] as const;

function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cn(
                'rounded-xl border px-4 py-2 text-sm transition',
                selected
                    ? 'border-[#1980C0] bg-[#EAF6FF] font-medium text-[#1980C0]'
                    : 'border-[#D9DEE5] bg-white text-[#6B7280] hover:border-[#9CCBE8]',
            )}
        >
            {children}
        </button>
    );
}

interface FilterPanelProps {
    open: boolean;
    onClose: () => void;
    /** Applied filters — seeds the draft every time the panel opens. */
    value: EmployeeListFilter;
    onApply: (value: EmployeeListFilter) => void;
    /** Distinct `organization` values found in the current rows. */
    organizationOptions: string[];
}

/**
 * The "Filter" panel from the design: a floating card pinned to the right with
 * Departemen / Kontrak / Status / Level sections and a Terapkan Filter footer.
 * Edits stay in a draft until Terapkan Filter, so closing without applying
 * leaves the table untouched.
 */
export function FilterPanel({ open, onClose, value, onApply, organizationOptions }: FilterPanelProps) {
    const [draft, setDraft] = useState<EmployeeListFilter>(value);
    const wasOpen = useRef(false);

    // Seed only on the open transition — re-running while open would throw
    // away edits the moment the parent re-renders.
    useEffect(() => {
        if (open && !wasOpen.current) setDraft(value);
        wasOpen.current = open;
    }, [open, value]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            {/* Click-away catcher — the design keeps the page undimmed. */}
            <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />

            <aside
                role="dialog"
                aria-label="Filter"
                className="fixed top-4 right-4 z-50 flex max-h-[calc(100vh-2rem)] w-[min(440px,calc(100vw-2rem))] flex-col rounded-2xl border border-[#E7E7E7] bg-white shadow-[0_18px_50px_rgba(16,24,40,0.18)]"
            >
                <header className="flex items-center justify-between px-6 pt-5 pb-4">
                    <h2 className="font-poppins text-lg font-semibold text-[#121212]">Filter</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup filter"
                        className="cursor-pointer text-[#6B7280] hover:text-[#121212]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="flex flex-col gap-5 overflow-y-auto px-6 pb-6">
                    <div className="flex flex-col gap-2.5">
                        <p className="font-poppins text-base font-semibold text-[#121212]">Departemen</p>
                        <div className="relative">
                            <select
                                value={draft.organization}
                                onChange={(event) => setDraft({ ...draft, organization: event.target.value })}
                                className="h-12 w-full appearance-none rounded-xl border border-[#D1D5DB] bg-white px-4 pr-10 text-sm text-[#374151] outline-none focus:border-[#1980C0]"
                            >
                                <option value="all">Semua Departemen</option>
                                {organizationOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <p className="font-poppins text-base font-semibold text-[#121212]">Kontrak</p>
                        <div className="flex flex-wrap gap-2">
                            {CONTRACT_FILTERS.map((option) => (
                                <Chip
                                    key={option.value}
                                    selected={draft.contracts.includes(option.value)}
                                    onClick={() => setDraft({ ...draft, contracts: toggle(draft.contracts, option.value) })}
                                >
                                    {option.label}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <p className="font-poppins text-base font-semibold text-[#121212]">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_FILTERS.map((option) => (
                                <Chip
                                    key={option.value}
                                    selected={draft.status === option.value}
                                    onClick={() =>
                                        setDraft({ ...draft, status: draft.status === option.value ? 'all' : option.value })
                                    }
                                >
                                    {option.label}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <p className="font-poppins text-base font-semibold text-[#121212]">Level</p>
                        <div className="flex flex-wrap gap-2">
                            {LEVEL_FILTERS.map((option) => (
                                <Chip
                                    key={option.value}
                                    selected={draft.levels.includes(option.value)}
                                    onClick={() => setDraft({ ...draft, levels: toggle(draft.levels, option.value) })}
                                >
                                    {option.label}
                                </Chip>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="border-t border-[#E7E7E7] p-4">
                    <button
                        type="button"
                        onClick={() => {
                            onApply(draft);
                            onClose();
                        }}
                        className="font-poppins h-12 w-full cursor-pointer rounded-xl bg-[#1980C0] text-sm font-semibold text-white hover:bg-[#1673AD]"
                    >
                        Terapkan Filter
                    </button>
                </footer>
            </aside>
        </>
    );
}
