# Company — Manajemen Aset (Asset Management) — Design

**Date:** 2026-08-11
**Status:** FE-only pass. Builds out `Asset.tsx` (currently an empty stub) into a pixel-matched
list page based on a provided screenshot mockup, using dummy in-memory data. Backend (real `Asset`
model, migration, DTO, controller data) is an explicit follow-up, not part of this pass.

## Goal

Give a company admin a page at `/company/asset` that lists company assets in a data table, with:
stat cards summarizing counts, a tab toggle between "Semua Aset Perusahaan" and "Aset Dipakai
Karyawan", a branch ("Cabang") filter, free-text search, a filter button, and a "+ Aset" button
whose dropdown offers "Aset Perusahaan" / "Dipinjam Karyawan".

## Scope decision

Pure front-end mock, same posture as the rest of the `Company` module's earlier passes (see
`2026-07-28-company-org-structure-design.md`, `2026-08-07-document-template-editor-design.md`): no
model, no migration, no API — dummy data generated client-side. `CompanyAssetController` keeps
rendering `Company::pages/Asset` with no props.

Explicitly **not** in scope for this pass:
- Real `Asset` Eloquent model / migration / DTO / permissions — dummy data only.
- Real create/edit forms behind "+ Aset" or the row action menu — both surface
  `toast('Segera hadir')` for now (per user decision).
- Real content for the "Aset Dipakai Karyawan" tab or the "Riwayat Pinjam & Pengembalian" link — no
  screenshot exists for either, so both render a placeholder `EmptyState`.
- Real branch data — a small hardcoded list of branch names, same pattern as other placeholder
  option lists in this module.
- Mobile/responsive treatment — desktop-first, matching the rest of the module.

## Architecture

### Component breakdown

Following `Document.tsx`'s established decomposition (page owns orchestration state; toolbar +
tabs live inline in the page like `Document.tsx` does, since they're a single cohesive top bar; only
genuinely reusable/self-contained pieces get their own file):

```
app/Modules/Company/resources/js/
  pages/Asset.tsx                          — page shell: breadcrumb, stat cards, Tabs+toolbar, DataTable
  components/asset/
    asset-stat-cards.tsx                   — the 4-card row (3x KpiStatCard + AssetHistoryCard)
    asset-history-card.tsx                 — the "Riwayat Pinjam & Pengembalian" card w/ "Lihat >" link
    add-asset-menu.tsx                     — "+ Aset" Button + DropdownMenu (2 items → toast)
    asset-columns.tsx                      — DataTable Column<Asset>[] definitions
  lib/
    asset-catalog.ts                       — ASSET_TABS (tab id/label pairs), BRANCH_OPTIONS
    asset-dummy-data.ts                    — generateDummyAssets(): Asset[] (~25 rows), Asset type
```

`KpiStatCard` (`resources/js/components/design-system/card/kpi-stat.tsx`) and `DataTable`
(`resources/js/components/data-table.tsx`) are reused as-is, no changes.

### Data shape

```ts
// lib/asset-dummy-data.ts
export interface Asset {
    id: string;              // "EM87-001" etc.
    category: string;        // "Laptop"
    name: string;             // "Macbook Air M4"
    thumbnailUrl: string;     // placeholder image
    totalUnits: number;
    loanedUnits: number;
    availableUnits: number;
    procurementDate: string;  // "12/09/26"
    branch: string;           // matches BRANCH_OPTIONS values, used by the DataTable branch filter
}

export function generateDummyAssets(): Asset[] // ~25 rows, deterministic (no Math.random/Date.now)
```

Stat card numbers (`Total Semua Aset`, `Total Aset Dipinjam Karyawan`, `Total Aset Tersedia`) are
**derived from `generateDummyAssets()`** (`reduce` over `totalUnits`/`loanedUnits`/`availableUnits`),
not copied from the screenshot's literal 980/600/6 — the screenshot's own numbers don't reconcile
internally either, so deriving from the dummy set keeps this page internally consistent.

### Page composition (`Asset.tsx`)

```tsx
<AppLayout breadcrumbs={[{ title: 'Manajemen Aset', href: '/company/asset' }]}>
  <Head title="Manajemen Aset" />
  <div className="space-y-4 p-6">
    <AssetStatCards assets={assets} />
    <Tabs value={activeTab} onValueChange={...}>
      <div className="flex items-center justify-between">
        <TabsList variant="pill">{ASSET_TABS.map(...)}</TabsList>
      </div>
      <TabsContent value="company">
        <DataTable
          columns={assetColumns}
          data={assets}
          search={{ keys: ['name', 'id'], placeholder: 'Search' }}
          filters={[{ key: 'branch', type: 'select', label: 'Cabang', options: BRANCH_OPTIONS }]}
          actions={<><FilterButton onClick={...} /><AddAssetMenu /></>}
          rowActions={(row) => [{ label: 'Detail', onClick: () => toast('Segera hadir') }]}
        />
      </TabsContent>
      <TabsContent value="employee-loan">
        <EmptyState title="Belum Ada Data" description="Fitur ini akan segera hadir." />
      </TabsContent>
    </Tabs>
  </div>
</AppLayout>
```

The filter icon button (next to "+ Aset") is a plain icon button that shows a toast for now — no
filter dialog exists yet in this pass, since the `DataTable`'s own `branch` select filter already
covers the one filterable field shown in the screenshot.

### Column definitions (`asset-columns.tsx`)

Id Aset, Kategori, Nama Aset (thumbnail image + text, `render`), Total Semua, Total Dipinjam, Total
Tersedia, Tgl Pengadaan — all `sortable: true` except the thumbnail/name composite render. Row
actions column is auto-appended by `DataTable`'s `rowActions` prop (no manual column needed).

### Pagination

`DataTable`'s client mode already provides Prev/Next pagination (`Pagination` component,
`design-system` variant) over the in-memory array — no extra work needed, `perPage` left at its
default (10), giving 3 pages over 25 dummy rows.

## Testing

Pure front-end/dummy-data page, no backend logic to unit test. Verify manually via `npm run dev` +
visiting `/company/asset`: stat cards render derived numbers, tab switch shows placeholder on the
second tab, search/branch-filter/sort/pagination all work against the dummy set, "+ Aset" and row
action menu both toast "Segera hadir".

## Follow-up (out of scope here)

A later pass wires this to a real `Asset` model: migration, `assets.<action>` permissions in
`app/Modules/Company/permissions.php`, DTO, and a real `CompanyAssetController@index` returning
actual data — following the `add-resource` skill, same shape as `Employee`/`Iam` users.
