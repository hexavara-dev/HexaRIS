# Admin Design System — Plan B: DataTable + Server-Side Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A reusable, server-driven `<DataTable>` with per-column sort + filter and pagination, backed by `spatie/laravel-query-builder`, proven end-to-end on the Users module.

**Architecture:** The backend index uses `QueryBuilder` with whitelisted `allowedSorts`/`allowedFilters` (invalid params ignored, never 500). The frontend `<DataTable>` reads the Laravel paginator + current `sort`/`filters` from props, and pushes `?sort=` / `?filter[col]=` via `router.get` (debounced filters, `preserveState`/`preserveScroll`/`replace`). Built on a new shadcn `table` primitive.

**Tech Stack:** Laravel 12.61, spatie/laravel-query-builder, spatie/laravel-data, Inertia React TS, Tailwind v4, Pest.

---

## Task 1: Install spatie/laravel-query-builder + config

**Files:** `composer.json` (require), publish `config/query-builder.php`

- [ ] **Step 1: Require the package**

```bash
composer require spatie/laravel-query-builder
```

- [ ] **Step 2: Publish + soften invalid-param handling**

```bash
php artisan vendor:publish --provider="Spatie\QueryBuilder\QueryBuilderServiceProvider" --tag="query-builder-config"
```
In `config/query-builder.php`, set both to `true` so a stale/typo'd `sort`/`filter` param is **ignored** rather than throwing 400 (friendlier for bookmarked URLs):

```php
'disable_invalid_filter_query_exception' => true,
'disable_invalid_sort_query_exception' => true,
```

- [ ] **Step 3: Verify gate**

Run: `composer check`
Expected: green (no code uses it yet).

- [ ] **Step 4: Commit**

```bash
git add composer.json composer.lock config/query-builder.php
git commit -m "feat(table): install spatie/laravel-query-builder (ignore invalid params)"
```

---

## Task 2: shadcn `table` primitive

**Files:** Create `resources/js/components/ui/table.tsx`

- [ ] **Step 1: Create the primitive**

Create `resources/js/components/ui/table.tsx` (standard shadcn/Tailwind-v4 table):

```tsx
import { cn } from '@/lib/utils';
import * as React from 'react';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
    return (
        <div className="relative w-full overflow-x-auto">
            <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
    return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
    return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
    return <tfoot className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
    return <tr className={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)} {...props} />;
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
    return (
        <th
            className={cn('text-muted-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td className={cn('p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)} {...props} />;
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
    return <caption className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />;
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
```

- [ ] **Step 2: Lint + build**

```bash
npx prettier --write resources/js/components/ui/table.tsx
npx eslint resources/js/components/ui/table.tsx
npm run build
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/ui/table.tsx
git commit -m "feat(table): add shadcn table primitive"
```

---

## Task 3: `Paginated<T>` type + `<Pagination>` component

**Files:** Modify `resources/js/types/index.ts`; Create `resources/js/components/pagination.tsx`

- [ ] **Step 1: Add the `Paginated<T>` type**

In `resources/js/types/index.ts`, add (anywhere top-level):

```typescript
export interface Paginated<T> {
    data: T[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}
```

- [ ] **Step 2: Create the Pagination component**

Create `resources/js/components/pagination.tsx`:

```tsx
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    const cls = 'rounded-md border px-2.5 py-1 text-sm';
    return (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
            <div>{page.total === 0 ? 'No results' : `${page.from}–${page.to} of ${page.total}`}</div>
            <div className="flex items-center gap-2">
                <span>
                    Page {page.current_page} of {page.last_page}
                </span>
                {page.prev_page_url ? (
                    <Link href={page.prev_page_url} preserveScroll className={`${cls} hover:bg-accent`}>
                        Prev
                    </Link>
                ) : (
                    <span className={`${cls} opacity-50`}>Prev</span>
                )}
                {page.next_page_url ? (
                    <Link href={page.next_page_url} preserveScroll className={`${cls} hover:bg-accent`}>
                        Next
                    </Link>
                ) : (
                    <span className={`${cls} opacity-50`}>Next</span>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 3: Lint + build + commit**

```bash
npx prettier --write resources/js/components/pagination.tsx resources/js/types/index.ts
npx eslint resources/js/components/pagination.tsx
npm run build
git add resources/js/components/pagination.tsx resources/js/types/index.ts
git commit -m "feat(table): add Paginated type and Pagination component"
```

---

## Task 4: `<DataTable>` component

**Files:** Create `resources/js/components/data-table.tsx`

- [ ] **Step 1: Create the component**

Create `resources/js/components/data-table.tsx`:

```tsx
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Paginated } from '@/types';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (row: T) => ReactNode;
}

interface Props<T> {
    columns: Column<T>[];
    rows: Paginated<T>;
    sort?: string | null;
    filters?: Record<string, string>;
}

export function DataTable<T extends { id: number | string }>({ columns, rows, sort, filters = {} }: Props<T>) {
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>(filters);
    const timer = useRef<number | undefined>(undefined);

    const visit = (params: Record<string, unknown>) => {
        router.get(window.location.pathname, params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const toggleSort = (key: string) => {
        const next = sort === key ? `-${key}` : sort === `-${key}` ? null : key;
        visit({ sort: next, filter: activeFilters });
    };

    const onFilter = (key: string, value: string) => {
        const updated = { ...activeFilters };
        if (value) updated[key] = value;
        else delete updated[key];
        setActiveFilters(updated);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => visit({ sort, filter: updated }), 300);
    };

    const sortIcon = (key: string) =>
        sort === key ? <ArrowUp className="size-3.5" /> : sort === `-${key}` ? <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />;

    const hasFilters = columns.some((c) => c.filterable);

    return (
        <div className="space-y-3">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((c) => (
                                <TableHead key={c.key}>
                                    {c.sortable ? (
                                        <button type="button" onClick={() => toggleSort(c.key)} className="hover:text-foreground inline-flex items-center gap-1">
                                            {c.label} {sortIcon(c.key)}
                                        </button>
                                    ) : (
                                        c.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                        {hasFilters && (
                            <TableRow>
                                {columns.map((c) => (
                                    <TableHead key={c.key} className="pt-0 pb-2">
                                        {c.filterable && (
                                            <Input
                                                defaultValue={activeFilters[c.key] ?? ''}
                                                onChange={(e) => onFilter(c.key, e.target.value)}
                                                placeholder={`Filter ${c.label.toLowerCase()}`}
                                                className="h-8"
                                            />
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {rows.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-muted-foreground py-8 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.data.map((row) => (
                                <TableRow key={row.id}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key}>{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}</TableCell>
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
```

- [ ] **Step 2: Lint + build + commit**

```bash
npx prettier --write resources/js/components/data-table.tsx
npx eslint resources/js/components/data-table.tsx
npm run build
git add resources/js/components/data-table.tsx
git commit -m "feat(table): add DataTable (sortable/filterable, server-driven)"
```

---

## Task 5: Users index → QueryBuilder + sort/filter tests

**Files:** Modify `app/Modules/Users/Http/Controllers/UserController.php`; Test `tests/Feature/Users/UserSortFilterTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Users/UserSortFilterTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('users.viewAny', 'web');
    $this->admin = User::factory()->create(['name' => 'Zed Admin'])->givePermissionTo('users.viewAny');
});

it('sorts by name ascending when ?sort=name', function () {
    User::factory()->create(['name' => 'Aaron']);
    User::factory()->create(['name' => 'Mona']);

    $this->actingAs($this->admin)
        ->get('/users?sort=name')
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data.0.name', 'Aaron')
            ->where('sort', 'name')
        );
});

it('sorts descending when ?sort=-name', function () {
    User::factory()->create(['name' => 'Aaron']);

    $this->actingAs($this->admin)
        ->get('/users?sort=-name')
        ->assertInertia(fn (Assert $page) => $page->where('users.data.0.name', 'Zed Admin'));
});

it('filters by name', function () {
    User::factory()->create(['name' => 'Findme Smith']);

    $this->actingAs($this->admin)
        ->get('/users?filter[name]=Findme')
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data', fn ($rows) => collect($rows)->count() === 1 && collect($rows)->first()['name'] === 'Findme Smith')
            ->where('filters.name', 'Findme')
        );
});

it('ignores a disallowed sort instead of erroring', function () {
    $this->actingAs($this->admin)
        ->get('/users?sort=password')
        ->assertOk();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `vendor/bin/pest tests/Feature/Users/UserSortFilterTest.php`
Expected: FAIL — controller doesn't apply sorting/filtering or return `sort`/`filters` yet.

- [ ] **Step 3: Refactor the controller `index`**

In `app/Modules/Users/Http/Controllers/UserController.php`, replace the `index` method and add imports `use Spatie\QueryBuilder\QueryBuilder;` and `use Illuminate\Http\Request;` (Request is likely already imported from destroy):

```php
public function index(Request $request): Response
{
    $users = QueryBuilder::for(User::class)
        ->allowedSorts(['name', 'email', 'created_at'])
        ->allowedFilters(['name', 'email'])
        ->defaultSort('-created_at')
        ->with('roles')
        ->paginate($request->integer('per_page', 25))
        ->withQueryString()
        ->through(fn (User $user) => UserData::fromModel($user));

    return Inertia::render('Users::pages/Index', [
        'users' => $users,
        'sort' => $request->string('sort')->toString() ?: null,
        'filters' => (object) $request->input('filter', []),
    ]);
}
```

> `QueryBuilder::for(User::class)` proxies Eloquent, so `->with('roles')` and `->paginate()` work. `defaultSort('-created_at')` keeps newest-first when no sort is given. `(object)` makes `filters` an object even when empty so the frontend reads `filters.name`.

- [ ] **Step 4: Run to verify it passes**

Run: `vendor/bin/pest tests/Feature/Users/UserSortFilterTest.php`
Expected: PASS (4 passed).

- [ ] **Step 5: Full gate**

Run: `composer check`
Expected: green. The earlier `UserIndexTest` / `UserFilterTest` may assert `users.data` shape — confirm they still pass (the paginator shape is unchanged; `sort`/`filters` are additive props).

- [ ] **Step 6: Commit**

```bash
git add app/Modules/Users/Http/Controllers/UserController.php tests/Feature/Users/UserSortFilterTest.php
git commit -m "feat(users): server-side sort/filter via QueryBuilder"
```

---

## Task 6: Wire the Users index page to `<DataTable>`

**Files:** Modify `app/Modules/Users/resources/js/pages/Index.tsx`

- [ ] **Step 1: Rewrite the page to use DataTable**

Replace `app/Modules/Users/resources/js/pages/Index.tsx` with (keeps the AppLayout wrapper added in Plan A; swaps the hand-rolled table for `<DataTable>`):

```tsx
import { Column, DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface Props {
    users: Paginated<UserRow>;
    sort: string | null;
    filters: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/users' }];

export default function Index({ users, sort, filters }: Props) {
    const columns: Column<UserRow>[] = [
        { key: 'name', label: 'Name', sortable: true, filterable: true },
        { key: 'email', label: 'Email', sortable: true, filterable: true },
        { key: 'roles', label: 'Roles', render: (u) => u.roles.join(', ') || '—' },
        {
            key: 'actions',
            label: '',
            render: (u) => (
                <div className="flex justify-end gap-3">
                    <Link href={`/users/${u.id}/edit`} className="text-primary">
                        Edit
                    </Link>
                    <button
                        type="button"
                        onClick={() => confirm('Delete this user?') && router.delete(`/users/${u.id}`)}
                        className="text-destructive"
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Users</h1>
                        <p className="text-muted-foreground text-sm">Manage accounts &amp; roles</p>
                    </div>
                    <Link href="/users/create" className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm">
                        New user
                    </Link>
                </div>
                <DataTable columns={columns} rows={users} sort={sort} filters={filters} />
            </div>
        </AppLayout>
    );
}
```

> The native `confirm()` here is replaced by `ConfirmDialog` in Plan C/D; kept minimal now.

- [ ] **Step 2: Lint, format, build**

```bash
npx prettier --write app/Modules/Users/resources/js/pages/Index.tsx
npx eslint app/Modules/Users/resources/js/pages/Index.tsx
npm run build
```
Expected: all pass; the Users index now renders the DataTable.

- [ ] **Step 3: PHP gate (Inertia prop tests)**

Run: `composer check`
Expected: green — the existing `UserIndexTest` asserts `users.data`; still present. If `UserIndexTest`/`UserFilterTest` asserted the OLD `filters` array shape and now it's an object, adjust those assertions minimally (object vs array) — they should still pass since `->has('users.data', N)` and `where('filters...')` are shape-compatible.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Users/resources/js/pages/Index.tsx
git commit -m "feat(users): render the users index with the new DataTable"
```

---

## Task 7: Final verification

- [ ] **Step 1: Gates**

Run: `composer check` → green.
Run: `npm run build` → succeeds, DataTable + pages compile.
Run: `npx eslint resources/js/components/data-table.tsx resources/js/components/pagination.tsx resources/js/components/ui/table.tsx` → clean.

- [ ] **Step 2: Live sanity**

Run: `php artisan route:list --name=users.index` → route present.
Run:
```bash
php artisan tinker --execute='echo \Spatie\QueryBuilder\QueryBuilder::for(\App\Models\User::class)->allowedSorts(["name"])->count();'
```
Expected: prints the user count (proves QueryBuilder resolves against the User model).

---

## Self-Review

**Spec coverage (Plan B):**
- spatie/laravel-query-builder installed + invalid params ignored → Task 1 ✅
- shadcn table primitive → Task 2 ✅
- Paginated type + Pagination → Task 3 ✅
- DataTable (sortable/filterable, debounced, server-driven) → Task 4 ✅
- Index controller convention (allowedSorts/allowedFilters, returns sort/filters) → Task 5 ✅
- Sort/filter Pest tests (incl. disallowed-sort ignored) → Task 5 ✅
- Proof on Users index page → Task 6 ✅

**Placeholder scan:** complete code in every step; no TBD.

**Type consistency:** `Paginated<T>` (Task 3) is consumed by `Pagination` (Task 3) and `DataTable` (Task 4) and the Users page (Task 6) identically. `Column<T>` (Task 4) is used in Task 6. The controller returns `users` (Paginated), `sort` (string|null), `filters` (object) matching the page's `Props`.

**Deferred to Plan C/D:** EmptyState/ConfirmDialog/PageHeader components and wiring Rbac/Audit pages + their controllers; the native `confirm()` stays until then.
