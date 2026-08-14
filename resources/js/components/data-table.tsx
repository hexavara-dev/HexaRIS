import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { type RowAction, RowActionMenu } from '@/components/row-action-menu';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ColumnFilters, type FilterType, matchesFilter } from '@/lib/data-table-filters';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { type RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, Inbox, Search } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

// Column = purely display: what data a column shows and how a cell renders.
// SearchConfig/FilterConfig = purely behavior, passed separately to
// DataTable — a page can reuse one column set with different search/filters
// (or none), and columns.tsx never needs to know DataTable exists.
export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'right';
    render?: (row: T) => ReactNode;
    /** Extra classes on this column's <td> (e.g. a border) — a border needs to sit on the cell's own box, not a nested div, to run edge-to-edge with no per-row gap. */
    cellClassName?: string;
}

/** Global free-text search across one or more fields at once, single input. */
export interface SearchConfig {
    keys: string[];
    placeholder?: string;
}

/** One toolbar control narrowing a single column — carries its own label, independent of the column's. */
export interface FilterConfig {
    key: string;
    type: FilterType;
    label: string;
    options?: { value: string; label: string }[];
}

type Variant = 'default' | 'design-system';

/** Sentinel for the "no filter" choice — Radix Select rejects "" as an item value. */
const ALL_OPTION = '__all__';

/** Reserved key for the auto-appended row-actions column, so it can't collide with a data field. */
const ROW_ACTIONS_KEY = '__row_actions__';

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
    search?: SearchConfig;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filterConfig: FilterConfig[];
    visibility: boolean;
    actions?: ReactNode;
    rowActions?: (row: T) => RowAction[];
    variant: Variant;
    pageMeta: Paginated<T>;
    sort: string | null;
    onToggleSort: (key: string) => void;
    filterValues: ColumnFilters;
    onFilterChange: (key: string, value: string) => void;
    onPageChange: (page: number) => void;
}

function DataTableView<T extends { id: number | string }>({
    columns,
    search,
    searchValue,
    onSearchChange,
    filterConfig,
    visibility,
    actions,
    rowActions,
    variant,
    pageMeta,
    sort,
    onToggleSort,
    filterValues,
    onFilterChange,
    onPageChange,
}: DataTableViewProps<T>) {
    const styles = variantStyles[variant];

    // Column visibility, matching shadcn's "Columns" toolbar dropdown.
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    // The row-actions column is derived from the rowActions prop rather than
    // declared in columns.tsx: it needs page state (a delete handler, the row's
    // id) that a static column list can't close over. Appended last, right-aligned,
    // and label-less so it stays out of the visibility dropdown.
    const tableColumns: Column<T>[] = rowActions
        ? [
              ...columns,
              {
                  key: ROW_ACTIONS_KEY,
                  label: '',
                  align: 'right',
                  render: (row) => {
                      const available = rowActions(row);
                      // An empty list means "this row has no permitted actions"
                      // (e.g. the super-admin role) — render the cell, not a dead menu.
                      if (available.length === 0) return null;
                      return (
                          <div className="flex justify-end">
                              <RowActionMenu actions={available} />
                          </div>
                      );
                  },
              },
          ]
        : columns;

    const visibleColumns = tableColumns.filter((c) => !hiddenColumns.includes(c.key));

    const toggleColumn = (key: string) =>
        setHiddenColumns((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

    const showToolbar = Boolean(search) || filterConfig.length > 0 || visibility || Boolean(actions);

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
            {showToolbar && (
                <div className="flex flex-wrap items-center gap-2">
                    {search && (
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                            <Input
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={search.placeholder ?? 'Search…'}
                                className="h-9 w-[220px] pl-8"
                            />
                        </div>
                    )}
                    {filterConfig.map((f) =>
                        f.type === 'select' ? (
                            <Select
                                key={f.key}
                                // Radix Select can't hold "" as a value, so the reset option
                                // carries a sentinel that maps back to "no filter".
                                value={filterValues[f.key] || ALL_OPTION}
                                onValueChange={(value) => onFilterChange(f.key, value === ALL_OPTION ? '' : value)}
                            >
                                <SelectTrigger className="h-9 w-[180px]">
                                    <SelectValue placeholder={f.label} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_OPTION}>Semua</SelectItem>
                                    {f.options?.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                key={f.key}
                                value={filterValues[f.key] ?? ''}
                                onChange={(e) => onFilterChange(f.key, e.target.value)}
                                placeholder={`Cari ${f.label.toLowerCase()}…`}
                                className="h-9 w-[220px]"
                            />
                        ),
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        {visibility && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9">
                                        Columns
                                        <ChevronDown className="ml-1 size-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {tableColumns
                                        // A column with no label is a layout slot (e.g. the row-actions
                                        // cell), so there is nothing meaningful to list or toggle.
                                        .filter((c) => c.label)
                                        .map((c) => (
                                            <DropdownMenuCheckboxItem
                                                key={c.key}
                                                className="capitalize"
                                                checked={!hiddenColumns.includes(c.key)}
                                                onCheckedChange={() => toggleColumn(c.key)}
                                            >
                                                {c.label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {actions}
                    </div>
                </div>
            )}
            <div className={styles.container}>
                <Table>
                    <TableHeader>
                        <TableRow className={styles.headerRow}>
                            {visibleColumns.map((c) => (
                                <TableHead key={c.key} className={cn('h-11', c.align === 'right' && 'text-right', c.cellClassName)}>
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
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageMeta.data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={visibleColumns.length} className="p-0">
                                    <EmptyState icon={Inbox} title="No results" description="Nothing matches the current filters." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageMeta.data.map((row) => (
                                <TableRow key={row.id} className={styles.row}>
                                    {visibleColumns.map((c) => (
                                        <TableCell key={c.key} className={cn(c.align === 'right' && 'text-right', styles.cell, c.cellClassName)}>
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
// array, and search/sort/filter/pagination are computed in the browser
// (useMemo), with zero network requests on interaction. This is right for
// small/bounded lists (roles, users, employees).
//
// mode="server" is the exception, for datasets that grow without bound
// (e.g. the audit log) where shipping every row to the browser up front
// would not scale — pagination stays server-driven, one page at a time.

interface BaseProps<T extends { id: number | string }> {
    columns: Column<T>[];
    variant?: Variant;
    /**
     * Show the "Columns" show/hide dropdown. Opt-in — most tables have a
     * deliberately chosen column set, and the control is only worth its space
     * on wide tables the user may want to trim.
     */
    visibility?: boolean;
    /**
     * Free slot at the toolbar's right edge — a "New …" button, a dialog
     * trigger, an export link. Rendered as given, so the call site owns both
     * the look and the click behaviour.
     */
    actions?: ReactNode;
    /**
     * Per-row action menu, appended as a trailing right-aligned column.
     * Receives the whole row, so handlers can read `row.id` for edit/delete.
     * Return an empty array to give a specific row no menu at all.
     */
    rowActions?: (row: T) => RowAction[];
}

interface ClientProps<T extends { id: number | string }> extends BaseProps<T> {
    mode?: 'client';
    data: T[];
    search?: SearchConfig;
    filters?: FilterConfig[];
    perPage?: number;
}

interface ServerProps<T extends { id: number | string }> extends BaseProps<T> {
    mode: 'server';
    data: Paginated<T>;
}

export type DataTableProps<T extends { id: number | string }> = ClientProps<T> | ServerProps<T>;

export function DataTable<T extends { id: number | string }>(props: DataTableProps<T>) {
    if (props.mode === 'server') {
        return <ServerDataTable {...props} />;
    }
    return <ClientDataTable {...props} />;
}

function ServerDataTable<T extends { id: number | string }>({
    columns,
    data,
    variant = 'design-system',
    visibility = false,
    actions,
    rowActions,
}: ServerProps<T>) {
    const onPageChange = (page: number) => {
        const params = Object.fromEntries(new URLSearchParams(window.location.search)) as unknown as RequestPayload;
        router.get(window.location.pathname, { ...params, page }, { preserveState: true, preserveScroll: true, replace: true });
    };

    // The audit log doesn't declare sortable/filterable/searchable columns
    // today, so these are no-ops in practice — kept so a future one just
    // works, round-tripping through the server like pagination already does.
    const onToggleSort = () => {};
    const onFilterChange = () => {};
    const onSearchChange = () => {};

    return (
        <DataTableView
            columns={columns}
            searchValue=""
            onSearchChange={onSearchChange}
            filterConfig={[]}
            visibility={visibility}
            actions={actions}
            rowActions={rowActions}
            variant={variant}
            pageMeta={data}
            sort={null}
            onToggleSort={onToggleSort}
            filterValues={{}}
            onFilterChange={onFilterChange}
            onPageChange={onPageChange}
        />
    );
}

function ClientDataTable<T extends { id: number | string }>({
    columns,
    data,
    search,
    filters: filterConfig = [],
    visibility = false,
    actions,
    rowActions,
    variant = 'design-system',
    perPage = 10,
}: ClientProps<T>) {
    const [sort, setSort] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [filterValues, setFilterValues] = useState<ColumnFilters>({});
    const [page, setPage] = useState(1);

    const searched = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!search || !query) return data;
        return data.filter((row) =>
            search.keys.some((key) =>
                String(cellValueOf(row, key) ?? '')
                    .toLowerCase()
                    .includes(query),
            ),
        );
    }, [data, search, searchValue]);

    const filtered = useMemo(() => {
        return searched.filter((row) =>
            Object.entries(filterValues).every(([key, value]) => {
                const config = filterConfig.find((f) => f.key === key);
                if (!config) return true;
                return matchesFilter(cellValueOf(row, key), config.type, value);
            }),
        );
    }, [searched, filterValues, filterConfig]);

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

    const onSearchChange = (value: string) => {
        setSearchValue(value);
        setPage(1);
    };

    const onFilterChange = (key: string, value: string) => {
        setFilterValues((current) => {
            const next = { ...current };
            if (value) next[key] = value;
            else delete next[key];
            return next;
        });
        setPage(1);
    };

    return (
        <DataTableView
            columns={columns}
            search={search}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            filterConfig={filterConfig}
            visibility={visibility}
            actions={actions}
            rowActions={rowActions}
            variant={variant}
            pageMeta={pageMeta}
            sort={sort}
            onToggleSort={onToggleSort}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            onPageChange={setPage}
        />
    );
}
