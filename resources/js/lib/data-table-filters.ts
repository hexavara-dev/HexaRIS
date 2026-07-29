// Type-aware, operator-based column filtering — shared by DataTable's filter popover.
// URL contract (sent via Inertia): filter[<field>][<operator>]=value

export type FilterType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export type FilterOperator = 'eq' | 'neq' | 'contains' | 'ncontains' | 'in' | 'gt' | 'gte' | 'lt' | 'lte';

/** Operators (the "Condition" dropdown) available per column type. */
export const typeOperators: Record<FilterType, { value: FilterOperator; label: string }[]> = {
    text: [
        { value: 'contains', label: 'Contains' },
        { value: 'ncontains', label: 'Does not contain' },
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Not equal' },
    ],
    number: [
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Not equal' },
        { value: 'gt', label: 'Greater than' },
        { value: 'gte', label: 'Greater or equal' },
        { value: 'lt', label: 'Less than' },
        { value: 'lte', label: 'Less or equal' },
    ],
    date: [
        { value: 'eq', label: 'On date' },
        { value: 'neq', label: 'Not on date' },
        { value: 'gt', label: 'After' },
        { value: 'gte', label: 'From' },
        { value: 'lt', label: 'Before' },
        { value: 'lte', label: 'Until' },
    ],
    select: [
        { value: 'in', label: 'Is any of' },
        { value: 'eq', label: 'Is' },
        { value: 'neq', label: 'Is not' },
    ],
    boolean: [
        { value: 'eq', label: 'Is' },
        { value: 'neq', label: 'Is not' },
    ],
};

export const defaultOperator: Record<FilterType, FilterOperator> = {
    text: 'contains',
    number: 'eq',
    date: 'eq',
    select: 'in',
    boolean: 'eq',
};

/** Active filters: { field: { operator: value } } — matches filter[field][operator]=value. */
export type ColumnFilters = Record<string, Partial<Record<FilterOperator, string>>>;

/** Client-side counterpart to the server-side WHERE clause built from the same operator+value. */
export function matchesFilter(cellValue: unknown, type: FilterType, operator: FilterOperator, filterValue: string): boolean {
    if (type === 'number' || type === 'date') {
        const cellNum = type === 'date' ? Date.parse(String(cellValue ?? '')) : Number(cellValue);
        const filterNum = type === 'date' ? Date.parse(filterValue) : Number(filterValue);
        if (Number.isNaN(cellNum) || Number.isNaN(filterNum)) return false;
        switch (operator) {
            case 'eq':
                return cellNum === filterNum;
            case 'neq':
                return cellNum !== filterNum;
            case 'gt':
                return cellNum > filterNum;
            case 'gte':
                return cellNum >= filterNum;
            case 'lt':
                return cellNum < filterNum;
            case 'lte':
                return cellNum <= filterNum;
            default:
                return false;
        }
    }

    if (type === 'select' && operator === 'in') {
        const wanted = filterValue.split(',').filter(Boolean);
        if (wanted.length === 0) return true;
        return wanted.includes(String(cellValue ?? ''));
    }

    const cellStr = String(cellValue ?? '').toLowerCase();
    const filterStr = filterValue.toLowerCase();
    switch (operator) {
        case 'contains':
            return cellStr.includes(filterStr);
        case 'ncontains':
            return !cellStr.includes(filterStr);
        case 'eq':
            return cellStr === filterStr;
        case 'neq':
            return cellStr !== filterStr;
        default:
            return false;
    }
}
