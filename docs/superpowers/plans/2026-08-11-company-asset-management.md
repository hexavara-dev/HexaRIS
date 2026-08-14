# Company Asset Management Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/company/asset` "Manajemen Aset" page pixel-matching the provided screenshot — stat cards, a tab toggle, a `DataTable` with branch filter/search/pagination, and a "+ Aset" dropdown — using dummy in-memory data (no backend changes).

**Architecture:** Pure front-end pass inside the existing `Company` module. The page (`pages/Asset.tsx`) owns tab state and renders 4 stat cards + a `Tabs`-wrapped toolbar + `DataTable`, reusing the existing `KpiStatCard` and `DataTable` components. New small, single-purpose files hold the parts that are genuinely reusable or self-contained (stat card row, history card, add-asset dropdown, column defs, dummy data/catalog). `CompanyAssetController` and the `company.asset.index` route are unchanged — they already render `Company::pages/Asset`.

**Tech Stack:** Laravel 12 + Inertia (React 18, TypeScript), shadcn/ui primitives, `lucide-react` icons, `sonner` for toasts, Vite build via `npm run build`.

## Global Constraints

- No backend changes in this pass: no model, no migration, no permission, no controller prop changes — per spec's Scope decision (`docs/superpowers/specs/2026-08-11-company-asset-management-design.md`).
- "+ Aset" dropdown items and the row action menu both call `toast('Segera hadir')` — no real create/edit flow yet.
- The "Aset Dipakai Karyawan" tab and the "Riwayat Pinjam & Pengembalian" link both render/point to placeholders — no screenshot exists for either.
- Dummy data must be **deterministic** — no `Math.random()`/`Date.now()`/`new Date()` inside `generateDummyAssets()`, so the page renders identically on every load and in tests.
- Follow existing module conventions: `Company::pages/Asset` page path, `@/components/ui/*` primitives, `route()` Ziggy helper for links, Indonesian UI copy (matches every other page in this module).
- Verify with `npm run build` and `npx tsc --noEmit` before calling any task done (per `CLAUDE.md`); no Pest/PHPStan changes needed since no PHP files change.

---

## File Structure

```
app/Modules/Company/resources/js/
  pages/Asset.tsx                          — MODIFY (replace stub): page shell
  components/asset/
    asset-stat-cards.tsx                   — CREATE: 4-card row
    asset-history-card.tsx                 — CREATE: "Riwayat Pinjam & Pengembalian" card
    add-asset-menu.tsx                     — CREATE: "+ Aset" button + dropdown
    asset-columns.tsx                      — CREATE: DataTable column defs
  lib/
    asset-catalog.ts                       — CREATE: ASSET_TABS, BRANCH_OPTIONS
    asset-dummy-data.ts                    — CREATE: Asset type + generateDummyAssets()
```

No test directory changes — this is a dummy-data FE page with no backend logic; verification is `tsc`/`build`/manual browser check per the spec's Testing section.

---

### Task 1: Asset type, dummy data generator, and catalog constants

**Files:**
- Create: `app/Modules/Company/resources/js/lib/asset-dummy-data.ts`
- Create: `app/Modules/Company/resources/js/lib/asset-catalog.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - `export interface Asset { id: string; category: string; name: string; totalUnits: number; loanedUnits: number; availableUnits: number; procurementDate: string; branch: string; }`
  - `export function generateDummyAssets(): Asset[]` — 25 deterministic rows.
  - `export type AssetTab = 'company' | 'employee-loan';`
  - `export interface AssetTabDef { value: AssetTab; label: string; }`
  - `export const ASSET_TABS: AssetTabDef[]`
  - `export interface BranchOption { value: string; label: string; }`
  - `export const BRANCH_OPTIONS: BranchOption[]`

- [ ] **Step 1: Write `asset-catalog.ts`**

```ts
// app/Modules/Company/resources/js/lib/asset-catalog.ts

export type AssetTab = 'company' | 'employee-loan';

export interface AssetTabDef {
    value: AssetTab;
    label: string;
}

export const ASSET_TABS: AssetTabDef[] = [
    { value: 'company', label: 'Semua Aset Perusahaan' },
    { value: 'employee-loan', label: 'Aset Dipakai Karyawan' },
];

export interface BranchOption {
    value: string;
    label: string;
}

export const BRANCH_OPTIONS: BranchOption[] = [
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'bandung', label: 'Bandung' },
    { value: 'surabaya', label: 'Surabaya' },
    { value: 'yogyakarta', label: 'Yogyakarta' },
];
```

- [ ] **Step 2: Write `asset-dummy-data.ts`**

```ts
// app/Modules/Company/resources/js/lib/asset-dummy-data.ts
import { BRANCH_OPTIONS } from './asset-catalog';

export interface Asset {
    id: string;
    category: string;
    name: string;
    totalUnits: number;
    loanedUnits: number;
    availableUnits: number;
    procurementDate: string;
    branch: string;
}

const CATEGORIES = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Printer'];
const NAMES: Record<string, string[]> = {
    Laptop: ['Macbook Air M4', 'Macbook Pro M3', 'ThinkPad X1 Carbon', 'Dell XPS 13'],
    Monitor: ['LG UltraFine 27"', 'Dell UltraSharp 24"'],
    Keyboard: ['Keychron K8', 'Logitech MX Keys'],
    Mouse: ['Logitech MX Master 3', 'Apple Magic Mouse'],
    Printer: ['Epson L3210', 'HP LaserJet Pro'],
};
const PROCUREMENT_DATES = ['12/09/26', '03/04/26', '21/11/25', '08/01/26', '17/06/26'];

/** Deterministic — no Math.random()/Date.now(), so the list renders identically on every load. */
export function generateDummyAssets(): Asset[] {
    const rows: Asset[] = [];
    for (let i = 0; i < 25; i++) {
        const category = CATEGORIES[i % CATEGORIES.length];
        const names = NAMES[category];
        const name = names[i % names.length];
        const branch = BRANCH_OPTIONS[i % BRANCH_OPTIONS.length].value;
        const totalUnits = 10 + (i % 5) * 2;
        const loanedUnits = i % 5;
        const availableUnits = totalUnits - loanedUnits;

        rows.push({
            id: `EM${87 + i}`,
            category,
            name,
            totalUnits,
            loanedUnits,
            availableUnits,
            procurementDate: PROCUREMENT_DATES[i % PROCUREMENT_DATES.length],
            branch,
        });
    }
    return rows;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `asset-dummy-data.ts` or `asset-catalog.ts` (other pre-existing errors, if any, are unrelated — confirm by checking the error list doesn't mention these two files).

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Company/resources/js/lib/asset-dummy-data.ts app/Modules/Company/resources/js/lib/asset-catalog.ts
git commit -m "feat(company): add dummy asset data and catalog constants"
```

---

### Task 2: Asset stat cards (KPI row + history card)

**Files:**
- Create: `app/Modules/Company/resources/js/components/asset/asset-history-card.tsx`
- Create: `app/Modules/Company/resources/js/components/asset/asset-stat-cards.tsx`

**Interfaces:**
- Consumes: `Asset` type from `../../lib/asset-dummy-data` (Task 1).
- Produces:
  - `export function AssetHistoryCard(): JSX.Element` (no props — static card, link target is a placeholder).
  - `export function AssetStatCards({ assets }: { assets: Asset[] }): JSX.Element`

- [ ] **Step 1: Write `asset-history-card.tsx`**

```tsx
// app/Modules/Company/resources/js/components/asset/asset-history-card.tsx
import { ArrowRight, History } from 'lucide-react';
import { toast } from 'sonner';

export function AssetHistoryCard() {
    return (
        <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-[#E2E8F0] p-[18px]">
            <div className="flex w-full items-center justify-between">
                <div className="flex w-fit flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-xs font-medium text-[#4F4F4F]">Riwayat Pinjam & Pengembalian</p>
                    <button
                        type="button"
                        onClick={() => toast('Segera hadir')}
                        className="font-poppins flex items-center gap-1 text-sm font-semibold text-[#1980C0] hover:underline"
                    >
                        Lihat
                        <ArrowRight className="size-3.5" />
                    </button>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(25,128,192,0.10)' }}>
                    <History className="size-5 shrink-0 text-[#1980C0]" />
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Write `asset-stat-cards.tsx`**

```tsx
// app/Modules/Company/resources/js/components/asset/asset-stat-cards.tsx
import { KpiStatCard } from '@/components/design-system/card/kpi-stat';
import { Boxes, PackageCheck, Repeat } from 'lucide-react';
import { useMemo } from 'react';

import { type Asset } from '../../lib/asset-dummy-data';
import { AssetHistoryCard } from './asset-history-card';

export function AssetStatCards({ assets }: { assets: Asset[] }) {
    const totals = useMemo(
        () =>
            assets.reduce(
                (acc, asset) => ({
                    total: acc.total + asset.totalUnits,
                    loaned: acc.loaned + asset.loanedUnits,
                    available: acc.available + asset.availableUnits,
                }),
                { total: 0, loaned: 0, available: 0 },
            ),
        [assets],
    );

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiStatCard label="Total Semua Aset" iconBackground="rgba(139,92,246,0.10)" icon={<Boxes className="size-5 shrink-0 text-[#8B5CF6]" />}>
                <p className="font-poppins w-fit text-2xl font-semibold text-black">{totals.total}</p>
            </KpiStatCard>
            <KpiStatCard
                label="Total Aset Dipinjam Karyawan"
                iconBackground="rgba(234,88,12,0.10)"
                icon={<Repeat className="size-5 shrink-0 text-[#EA580C]" />}
            >
                <p className="font-poppins w-fit text-2xl font-semibold text-black">{totals.loaned}</p>
            </KpiStatCard>
            <KpiStatCard
                label="Total Aset Tersedia"
                iconBackground="rgba(22,163,74,0.10)"
                icon={<PackageCheck className="size-5 shrink-0 text-[#16A34A]" />}
            >
                <p className="font-poppins w-fit text-2xl font-semibold text-black">{totals.available}</p>
            </KpiStatCard>
            <AssetHistoryCard />
        </div>
    );
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `asset-history-card.tsx` or `asset-stat-cards.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/Modules/Company/resources/js/components/asset/asset-history-card.tsx app/Modules/Company/resources/js/components/asset/asset-stat-cards.tsx
git commit -m "feat(company): add asset stat cards row"
```

---

### Task 3: Add-asset dropdown menu

**Files:**
- Create: `app/Modules/Company/resources/js/components/asset/add-asset-menu.tsx`

**Interfaces:**
- Consumes: `Button`, `DropdownMenu*` from `@/components/ui/*`; `toast` from `sonner`.
- Produces: `export function AddAssetMenu(): JSX.Element`

- [ ] **Step 1: Write `add-asset-menu.tsx`**

```tsx
// app/Modules/Company/resources/js/components/asset/add-asset-menu.tsx
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AddAssetMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="h-9 gap-2 rounded-lg px-4 text-xs">
                    <Plus className="size-4" />
                    Aset
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast('Segera hadir')}>Aset Perusahaan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast('Segera hadir')}>Dipinjam Karyawan</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `add-asset-menu.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Company/resources/js/components/asset/add-asset-menu.tsx
git commit -m "feat(company): add asset dropdown menu"
```

---

### Task 4: DataTable column definitions

**Files:**
- Create: `app/Modules/Company/resources/js/components/asset/asset-columns.tsx`

**Interfaces:**
- Consumes: `Column` type from `@/components/data-table`; `Asset` type from `../../lib/asset-dummy-data` (Task 1).
- Produces: `export const assetColumns: Column<Asset>[]`

- [ ] **Step 1: Write `asset-columns.tsx`**

```tsx
// app/Modules/Company/resources/js/components/asset/asset-columns.tsx
import { type Column } from '@/components/data-table';
import { Image } from 'lucide-react';

import { type Asset } from '../../lib/asset-dummy-data';

export const assetColumns: Column<Asset>[] = [
    { key: 'id', label: 'Id Aset', sortable: true },
    { key: 'category', label: 'Kategori', sortable: true },
    {
        key: 'name',
        label: 'Nama Aset',
        sortable: true,
        render: (row) => (
            <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#F1F5F9] text-[#94A3B8]">
                    <Image className="size-4" />
                </span>
                <span>{row.name}</span>
            </div>
        ),
    },
    { key: 'totalUnits', label: 'Total Semua', sortable: true, align: 'right' },
    { key: 'loanedUnits', label: 'Total Dipinjam', sortable: true, align: 'right' },
    { key: 'availableUnits', label: 'Total Tersedia', sortable: true, align: 'right' },
    { key: 'procurementDate', label: 'Tgl Pengadaan', sortable: true },
];
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `asset-columns.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Company/resources/js/components/asset/asset-columns.tsx
git commit -m "feat(company): add asset table column definitions"
```

---

### Task 5: Assemble the Asset page

**Files:**
- Modify: `app/Modules/Company/resources/js/pages/Asset.tsx` (full replace — current content is a broken stub referencing an undefined `Icon` component)

**Interfaces:**
- Consumes:
  - `generateDummyAssets`, `Asset` from `../lib/asset-dummy-data` (Task 1)
  - `ASSET_TABS`, `AssetTab`, `BRANCH_OPTIONS` from `../lib/asset-catalog` (Task 1)
  - `AssetStatCards` from `../components/asset/asset-stat-cards` (Task 2)
  - `AddAssetMenu` from `../components/asset/add-asset-menu` (Task 3)
  - `assetColumns` from `../components/asset/asset-columns` (Task 4)
  - `DataTable` from `@/components/data-table`
  - `EmptyState` from `@/components/empty-state`
- Produces: default export `Asset` page component, rendered at route `company.asset.index` (`Company::pages/Asset`, unchanged controller/route).

- [ ] **Step 1: Replace `Asset.tsx`**

```tsx
// app/Modules/Company/resources/js/pages/Asset.tsx
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Filter, PackageSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AddAssetMenu } from '../components/asset/add-asset-menu';
import { assetColumns } from '../components/asset/asset-columns';
import { AssetStatCards } from '../components/asset/asset-stat-cards';
import { ASSET_TABS, BRANCH_OPTIONS, type AssetTab } from '../lib/asset-catalog';
import { generateDummyAssets } from '../lib/asset-dummy-data';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manajemen Aset', href: '/company/asset' }];

export default function Asset() {
    const [activeTab, setActiveTab] = useState<AssetTab>('company');
    const assets = useMemo(() => generateDummyAssets(), []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Aset" />

            <div className="space-y-4 p-6">
                <AssetStatCards assets={assets} />

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssetTab)} className="flex flex-col gap-4">
                    <TabsList variant="pill">
                        {ASSET_TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} variant="pill">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="company">
                        <DataTable
                            columns={assetColumns}
                            data={assets}
                            search={{ keys: ['name', 'id'], placeholder: 'Search' }}
                            filters={[{ key: 'branch', type: 'select', label: 'Cabang', options: BRANCH_OPTIONS }]}
                            actions={
                                <>
                                    <button
                                        type="button"
                                        onClick={() => toast('Segera hadir')}
                                        aria-label="Filter"
                                        title="Filter"
                                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
                                    >
                                        <Filter className="size-4" />
                                    </button>
                                    <AddAssetMenu />
                                </>
                            }
                            rowActions={() => [{ label: 'Detail', onClick: () => toast('Segera hadir') }]}
                        />
                    </TabsContent>

                    <TabsContent value="employee-loan">
                        <EmptyState
                            icon={PackageSearch}
                            title="Belum Ada Data"
                            description="Fitur aset dipakai karyawan akan segera hadir."
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `Asset.tsx`.

- [ ] **Step 3: Build the frontend bundle**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Manual verification**

Run: `php artisan serve` (or existing dev workflow) and `npm run dev` in parallel, then visit `/company/asset` while authenticated.

Check:
- 4 stat cards render at the top with non-zero derived numbers.
- "Semua Aset Perusahaan" tab is active by default and shows a 25-row table.
- Clicking "Aset Dipakai Karyawan" shows the `EmptyState` placeholder, no console errors.
- Typing in the search box filters rows by name/id; the "Cabang" select filters by branch; column sort arrows work; Prev/Next pagination moves between the 3 pages of 10/10/5 rows.
- Clicking "+ Aset" opens the dropdown; both items show a "Segera hadir" toast.
- Clicking the filter icon button and a row's "⋮" → "Detail" both show a "Segera hadir" toast.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Company/resources/js/pages/Asset.tsx
git commit -m "feat(company): assemble manajemen aset page"
```

---

## Self-Review Notes

- **Spec coverage:** stat cards (Task 2), tabs incl. placeholder second tab (Task 5), branch/search/filter-button/add-dropdown toolbar (Task 3 + 5), columns incl. thumbnail render (Task 4), pagination (reused `DataTable`, no new code), dummy data derivation for stat numbers (Task 2 reduces over Task 1's data) — all covered.
- **Determinism:** `generateDummyAssets()` uses only `i % n` arithmetic, no `Math.random`/`Date.now`/`new Date()` — safe to call directly in the component body via `useMemo` (empty deps).
- **Type consistency:** `Asset` fields (`id`, `category`, `name`, `totalUnits`, `loanedUnits`, `availableUnits`, `procurementDate`, `branch`) are used identically across Task 1 (definition), Task 2 (`reduce`), and Task 4 (`Column<Asset>` keys) — verified matching.
- **No backend task needed:** `CompanyAssetController`/route already exist and require no changes (confirmed in spec's Scope decision).
