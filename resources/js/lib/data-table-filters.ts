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
