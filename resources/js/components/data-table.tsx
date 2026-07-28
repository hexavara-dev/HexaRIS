import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SearchableMultiSelect } from '@/components/searchable-multi-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ColumnFilters, type FilterOperator, type FilterType, defaultOperator, typeOperators } from '@/lib/data-table-filters';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { type RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, ListFilter, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

export interface ColumnFilterConfig {
    type: FilterType;
    options?: { value: string; label: string }[];
}

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    filter?: ColumnFilterConfig;
    align?: 'left' | 'right';
    render?: (row: T) => ReactNode;
}

interface Props<T> {
    columns: Column<T>[];
    rows: Paginated<T>;
    sort?: string | null;
    filters?: ColumnFilters;
    search?: string;
    variant?: 'default' | 'design-system';
}

const variantStyles = {
    default: {
        container: 'bg-card overflow-hidden rounded-lg border',
        headerRow: 'bg-muted/40 hover:bg-muted/40',
        headerLabel: 'text-muted-foreground text-xs font-semibold tracking-wide uppercase',
        row: '',
        cell: '',
    },
    'design-system': {
        container: 'overflow-hidden rounded-md border border-[#E7E7E7] bg-white',
        headerRow: 'border-[#E7E7E7] bg-[#FAFBFD] hover:bg-transparent',
        headerLabel: 'font-poppins text-xs font-normal text-[#0A0A0A]',
        row: 'border-[#E7E7E7] hover:bg-transparent',
        cell: 'font-poppins text-xs text-[#424242]',
    },
} as const;

export function DataTable<T extends { id: number | string }>({ columns, rows, sort, filters = {}, search, variant = 'default' }: Props<T>) {
    const styles = variantStyles[variant];
    const navigate = (next: { sort?: string | null; filters?: ColumnFilters }) => {
        const params = {
            sort: next.sort !== undefined ? next.sort : sort,
            filter: next.filters !== undefined ? next.filters : filters,
            search: search || undefined,
        } as unknown as RequestPayload;
        router.get(window.location.pathname, params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const toggleSort = (key: string) => {
        navigate({ sort: sort === key ? `-${key}` : sort === `-${key}` ? null : key });
    };

    const setColumnFilter = (key: string, operator: FilterOperator | null, value: string) => {
        const nextFilters = { ...filters };
        if (operator && value) nextFilters[key] = { [operator]: value };
        else delete nextFilters[key];
        navigate({ filters: nextFilters });
    };

    const sortIcon = (key: string) =>
        sort === key ? (
            <ArrowUp className="size-3.5" />
        ) : sort === `-${key}` ? (
            <ArrowDown className="size-3.5" />
        ) : (
            <ChevronsUpDown className="size-3.5 opacity-40" />
        );

    return (
        <div className="space-y-3">
            <div className={styles.container}>
                <Table>
                    <TableHeader>
                        <TableRow className={styles.headerRow}>
                            {columns.map((c) => (
                                <TableHead key={c.key} className={cn('h-11', c.align === 'right' && 'text-right')}>
                                    <div className={cn('flex items-center gap-1', c.align === 'right' && 'justify-end')}>
                                        <span className={styles.headerLabel}>{c.label}</span>
                                        {c.sortable && (
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(c.key)}
                                                className="text-muted-foreground hover:text-foreground rounded p-0.5"
                                                aria-label={`Sort by ${c.label}`}
                                            >
                                                {sortIcon(c.key)}
                                            </button>
                                        )}
                                        {c.filter && (
                                            <ColumnFilter
                                                config={c.filter}
                                                label={c.label}
                                                current={filters[c.key]}
                                                onApply={(op, value) => setColumnFilter(c.key, op, value)}
                                                onClear={() => setColumnFilter(c.key, null, '')}
                                            />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-0">
                                    <EmptyState icon={Inbox} title="No results" description="Nothing matches the current filters." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.data.map((row) => (
                                <TableRow key={row.id} className={styles.row}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key} className={cn(c.align === 'right' && 'text-right', styles.cell)}>
                                            {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Pagination page={rows} />
        </div>
    );
}

function ColumnFilter({
    config,
    label,
    current,
    onApply,
    onClear,
}: {
    config: ColumnFilterConfig;
    label: string;
    current?: Partial<Record<FilterOperator, string>>;
    onApply: (operator: FilterOperator, value: string) => void;
    onClear: () => void;
}) {
    const operators = typeOperators[config.type];
    const currentOperator = (current ? (Object.keys(current)[0] as FilterOperator) : defaultOperator[config.type]) ?? defaultOperator[config.type];
    const currentValue = current ? (Object.values(current)[0] ?? '') : '';
    const active = currentValue !== '';

    const [open, setOpen] = useState(false);
    const [operator, setOperator] = useState<FilterOperator>(currentOperator);
    const [value, setValue] = useState(currentValue);

    const onOpenChange = (next: boolean) => {
        if (next) {
            setOperator(currentOperator);
            setValue(currentValue);
        }
        setOpen(next);
    };

    const apply = () => {
        onApply(operator, value.trim());
        setOpen(false);
    };

    const clear = () => {
        setValue('');
        onClear();
        setOpen(false);
    };

    const selected = config.type === 'select' ? value.split(',').filter(Boolean) : [];

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`Filter ${label}`}
                    className={cn('rounded p-0.5', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
                >
                    <ListFilter className="size-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
                <div className="space-y-3 p-3">
                    <p className="text-sm font-medium">Filter {label}</p>

                    <div className="space-y-1">
                        <label className="text-muted-foreground text-xs">Condition</label>
                        <select
                            value={operator}
                            onChange={(e) => setOperator(e.target.value as FilterOperator)}
                            className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                        >
                            {operators.map((op) => (
                                <option key={op.value} value={op.value}>
                                    {op.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-muted-foreground text-xs">Value</label>
                        {config.type === 'select' && config.options ? (
                            <SearchableMultiSelect options={config.options} value={selected} onChange={(vals) => setValue(vals.join(','))} />
                        ) : (
                            <Input
                                type={config.type === 'date' ? 'date' : config.type === 'number' ? 'number' : 'text'}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && apply()}
                                placeholder="Enter value…"
                                className="h-9"
                                autoFocus
                            />
                        )}
                    </div>

                    <div className="flex gap-2 pt-1">
                        {active && (
                            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={clear}>
                                <X className="mr-1 size-3.5" /> Clear
                            </Button>
                        )}
                        <Button type="button" size="sm" className="flex-1" onClick={apply} disabled={!value.trim()}>
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
