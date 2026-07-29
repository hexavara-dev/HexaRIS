import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SearchableMultiSelect } from '@/components/searchable-multi-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ColumnFilters, type FilterOperator, type FilterType, defaultOperator, matchesFilter, typeOperators } from '@/lib/data-table-filters';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { type RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, ListFilter, X } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

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

type Variant = 'default' | 'design-system';

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

function cellValueOf<T>(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
}

function compareValues(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return String(a ?? '').localeCompare(String(b ?? ''));
}

interface DataTableViewProps<T extends { id: number | string }> {
    columns: Column<T>[];
    variant: Variant;
    pageMeta: Paginated<T>;
    sort: string | null;
    onToggleSort: (key: string) => void;
    filters: ColumnFilters;
    onApplyFilter: (key: string, operator: FilterOperator | null, value: string) => void;
    onPageChange: (page: number) => void;
}

function DataTableView<T extends { id: number | string }>({
    columns,
    variant,
    pageMeta,
    sort,
    onToggleSort,
    filters,
    onApplyFilter,
    onPageChange,
}: DataTableViewProps<T>) {
    const styles = variantStyles[variant];

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
                                                onClick={() => onToggleSort(c.key)}
                                                className="text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5"
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
                                                onApply={(op, value) => onApplyFilter(c.key, op, value)}
                                                onClear={() => onApplyFilter(c.key, null, '')}
                                            />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageMeta.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-0">
                                    <EmptyState icon={Inbox} title="No results" description="Nothing matches the current filters." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageMeta.data.map((row) => (
                                <TableRow key={row.id} className={styles.row}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key} className={cn(c.align === 'right' && 'text-right', styles.cell)}>
                                            {c.render ? c.render(row) : String(cellValueOf(row, c.key) ?? '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Pagination page={pageMeta} variant={variant} onPageChange={onPageChange} />
        </div>
    );
}

// DataTable defaults to client-side: the full dataset is passed in as a plain
// array, and sort/filter/pagination are computed in the browser (useMemo),
// with zero network requests on interaction. This is right for small/bounded
// lists (roles, users, employees).
//
// mode="server" is the exception, for datasets that grow without bound
// (e.g. the audit log) where shipping every row to the browser up front
// would not scale — pagination stays server-driven, one page at a time.

interface ClientProps<T extends { id: number | string }> {
    mode?: 'client';
    columns: Column<T>[];
    rows: T[];
    variant?: Variant;
    perPage?: number;
}

interface ServerProps<T extends { id: number | string }> {
    mode: 'server';
    columns: Column<T>[];
    rows: Paginated<T>;
    variant?: Variant;
}

export type DataTableProps<T extends { id: number | string }> = ClientProps<T> | ServerProps<T>;

export function DataTable<T extends { id: number | string }>(props: DataTableProps<T>) {
    if (props.mode === 'server') {
        return <ServerDataTable {...props} />;
    }
    return <ClientDataTable {...props} />;
}

function ServerDataTable<T extends { id: number | string }>({ columns, rows, variant = 'design-system' }: ServerProps<T>) {
    const onPageChange = (page: number) => {
        const params = Object.fromEntries(new URLSearchParams(window.location.search)) as unknown as RequestPayload;
        router.get(window.location.pathname, { ...params, page }, { preserveState: true, preserveScroll: true, replace: true });
    };

    // The audit log doesn't declare sortable/filterable columns today, so
    // these are no-ops in practice — kept so a future sortable column just
    // works, round-tripping through the server like pagination already does.
    const onToggleSort = () => {};
    const onApplyFilter = () => {};

    return (
        <DataTableView
            columns={columns}
            variant={variant}
            pageMeta={rows}
            sort={null}
            onToggleSort={onToggleSort}
            filters={{}}
            onApplyFilter={onApplyFilter}
            onPageChange={onPageChange}
        />
    );
}

function ClientDataTable<T extends { id: number | string }>({ columns, rows, variant = 'design-system', perPage = 10 }: ClientProps<T>) {
    const [sort, setSort] = useState<string | null>(null);
    const [filters, setFilters] = useState<ColumnFilters>({});
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        return rows.filter((row) =>
            Object.entries(filters).every(([key, ops]) => {
                const column = columns.find((c) => c.key === key);
                if (!column?.filter) return true;
                const entry = Object.entries(ops)[0];
                if (!entry) return true;
                const [operator, value] = entry;
                if (!value) return true;
                return matchesFilter(cellValueOf(row, key), column.filter.type, operator as FilterOperator, value);
            }),
        );
    }, [rows, filters, columns]);

    const sorted = useMemo(() => {
        if (!sort) return filtered;
        const key = sort.startsWith('-') ? sort.slice(1) : sort;
        const direction = sort.startsWith('-') ? -1 : 1;
        return [...filtered].sort((a, b) => direction * compareValues(cellValueOf(a, key), cellValueOf(b, key)));
    }, [filtered, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const visibleRows = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

    const pageMeta: Paginated<T> = {
        data: visibleRows,
        from: visibleRows.length ? (currentPage - 1) * perPage + 1 : null,
        to: (currentPage - 1) * perPage + visibleRows.length,
        total: sorted.length,
        current_page: currentPage,
        last_page: totalPages,
        prev_page_url: null,
        next_page_url: null,
    };

    const onToggleSort = (key: string) => {
        setSort((current) => (current === key ? `-${key}` : current === `-${key}` ? null : key));
        setPage(1);
    };

    const onApplyFilter = (key: string, operator: FilterOperator | null, value: string) => {
        setFilters((current) => {
            const next = { ...current };
            if (operator && value) next[key] = { [operator]: value };
            else delete next[key];
            return next;
        });
        setPage(1);
    };

    return (
        <DataTableView
            columns={columns}
            variant={variant}
            pageMeta={pageMeta}
            sort={sort}
            onToggleSort={onToggleSort}
            filters={filters}
            onApplyFilter={onApplyFilter}
            onPageChange={setPage}
        />
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
                    className={cn('cursor-pointer rounded p-0.5', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
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
