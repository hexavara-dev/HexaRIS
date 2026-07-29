// Column filtering for DataTable's toolbar:
// - text columns: a search Input, case-insensitive substring match.
// - select columns: a Select dropdown, exact match on the chosen option
//   (an empty value means "Semua" — no filtering).

export type FilterType = 'text' | 'select';

/** Active filters: { columnKey: value }. Empty/absent means "no filter". */
export type ColumnFilters = Record<string, string>;

export function matchesFilter(cellValue: unknown, type: FilterType, filterValue: string): boolean {
    if (!filterValue) return true;

    const cellStr = String(cellValue ?? '');

    if (type === 'select') return cellStr === filterValue;

    return cellStr.toLowerCase().includes(filterValue.toLowerCase());
}
