export interface Period {
    id: string;
    label: string;
}

// Chronological order matters: the last entry is treated as "the current period"
// (Index.tsx defaults the Periode filter to period[period.length - 1]).
export const period: Period[] = [
    { id: '2026-05', label: 'Mei 2026' },
    { id: '2026-06', label: 'Juni 2026' },
    { id: '2026-07', label: 'Juli 2026 (Bulan ini)' },
];
