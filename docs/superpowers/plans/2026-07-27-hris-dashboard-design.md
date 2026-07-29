# HRIS Dashboard Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `resources/js/pages/dashboard.tsx` with the real HRIS dashboard, assembled from existing `design-system` components plus four new small components (approval list, notification bell, period dropdown, floating assistant button), all backed by static/mock data except the greeting name.

**Architecture:** Pure front-end (React + TypeScript + Inertia) change. No backend module, route, or migration is touched. Build bottom-up: extend the shared header to accept an optional actions slot, add the four missing presentational components, then assemble `dashboard.tsx` last.

**Tech Stack:** React 19, TypeScript, Tailwind v4, shadcn/Radix primitives (`dropdown-menu`, `avatar`, `button`), lucide-react icons, Inertia.js (`usePage`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-hris-dashboard-design.md` — read it before starting.
- No JS unit test runner exists in this repo (`package.json` has no `test` script, no vitest/jest). Per the spec's Testing section, verification for every task is `npm run types` (TypeScript compile check) — the closest thing to a "test" this stack has — not a Jest/Vitest red-green cycle. The final task adds `npm run lint`, `npm run build`, and a manual browser check.
- Every new/edited `.tsx` file must pass `npm run types` with zero errors before its commit.
- Do not touch `resources/js/pages/*` login-related files — the Login page is a separate, still-pending piece of work.
- Follow the existing design-system font convention: `font-poppins` for semibold titles/labels (see `card/performa.tsx`, `card/kpi-stat.tsx`), no class (default `font-sans` = Instrument Sans) for body text. Do **not** use `font-inter` / `font-geist` classes — they are not configured in this project's Tailwind theme (see `resources/css/app.css`) and would silently no-op.
- Reuse existing `design-system` components exactly as documented below — do not restyle their outer containers to chase pixel-perfect mockup match; the spec explicitly accepts this (Testing section: "not pixel-tuned").
- We are on branch `feature/hris-dashboard-page` (already created, spec already committed there). Keep committing to this branch; do not touch `main`.

---

### Task 1: Add an optional `actions` slot to the shared sidebar header

**Files:**
- Modify: `resources/js/components/app-sidebar-header.tsx`
- Modify: `resources/js/layouts/app/app-sidebar-layout.tsx`
- Modify: `resources/js/layouts/app-layout.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `AppLayout` (default export of `resources/js/layouts/app-layout.tsx`) gains an optional prop `headerActions?: ReactNode`. Later tasks pass `<NotificationBell count={5} />` as this prop from `dashboard.tsx`. Every other current caller of `AppLayout` omits `headerActions` and is unaffected (default `undefined`, header layout unchanged when absent).

- [ ] **Step 1: Edit `app-sidebar-header.tsx` to accept and render `actions`**

Replace the full file with:

```tsx
import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    actions?: ReactNode;
}

export function AppSidebarHeader({ breadcrumbs = [], actions }: AppSidebarHeaderProps) {
    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 md:hidden" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>
    );
}
```

- [ ] **Step 2: Thread `headerActions` through `AppSidebarLayout`**

Replace the full file `resources/js/layouts/app/app-sidebar-layout.tsx` with:

```tsx
import type { ReactNode } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';

interface AppSidebarLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
}

export default function AppSidebarLayout({ children, breadcrumbs = [], headerActions }: AppSidebarLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} actions={headerActions} />
                {children}
            </AppContent>
        </AppShell>
    );
}
```

- [ ] **Step 3: Thread `headerActions` through the top-level `AppLayout`**

Replace the full file `resources/js/layouts/app-layout.tsx` with:

```tsx
import type { ReactNode } from 'react';

import { Toaster } from '@/components/toaster';
import { useFlash } from '@/hooks/use-flash';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
}

export default function AppLayout({ children, breadcrumbs, headerActions, ...props }: AppLayoutProps) {
    useFlash();
    return (
        <>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} headerActions={headerActions} {...props}>
                {children}
            </AppLayoutTemplate>
            <Toaster />
        </>
    );
}
```

- [ ] **Step 4: Type-check**

Run: `npm run types`
Expected: exits 0, no errors (every existing page that imports `AppLayout` still compiles because `headerActions` is optional).

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/app-sidebar-header.tsx resources/js/layouts/app/app-sidebar-layout.tsx resources/js/layouts/app-layout.tsx
git commit -m "feat(dashboard): add optional header actions slot to AppLayout"
```

---

### Task 2: `NotificationBell` component

**Files:**
- Create: `resources/js/components/notification-bell.tsx`

**Interfaces:**
- Consumes: nothing (no notification backend exists — this is a static UI element, per spec).
- Produces: `NotificationBell({ count?: number })` — default export is a named export `NotificationBell`, consumed by `dashboard.tsx` in Task 7 via `headerActions={<NotificationBell count={5} />}`.

- [ ] **Step 1: Create the component**

```tsx
import { Bell } from 'lucide-react';

interface NotificationBellProps {
    count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
    return (
        <button
            type="button"
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] text-[#0F172A]"
            aria-label={count > 0 ? `${count} notifikasi belum dibaca` : 'Notifikasi'}
        >
            <Bell className="size-[18px]" />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/notification-bell.tsx
git commit -m "feat(dashboard): add static notification bell component"
```

---

### Task 3: "DATA KARYAWAN" / "DATA ASET" overview card demos

**Files:**
- Modify: `resources/js/components/design-system/card/card.tsx`

**Interfaces:**
- Consumes: `OverviewCard` (already defined in the same file, unchanged) and its existing `IconActiveEmployees` / `IconInactiveEmployees` / `IconNewEmployees` icon helpers.
- Produces: two new named exports, `EmployeeOverviewCardDemo` and `AssetOverviewCardDemo`, consumed by `dashboard.tsx` in Task 7. The existing `OverviewCardDemo` export is left untouched (not deleted, not renamed — nothing else in the codebase references it, but removing it is out of scope for this feature).

- [ ] **Step 1: Append three new asset icon helpers and two new demo exports**

Add this to the end of `resources/js/components/design-system/card/card.tsx` (after the existing `OverviewCardDemo` function, keeping every existing line above unchanged):

```tsx
export function EmployeeOverviewCardDemo() {
    return (
        <OverviewCard
            title="DATA KARYAWAN"
            stats={[
                { icon: <IconActiveEmployees />, label: 'Karyawan Aktif', value: 248 },
                { icon: <IconInactiveEmployees />, label: 'Karyawan Non Aktif', value: 248 },
                { icon: <IconNewEmployees />, label: 'Karyawan Baru', value: 248 },
            ]}
        />
    );
}

function IconTotalAssets() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path
                d="M2 5.33333L8 2L14 5.33333M2 5.33333L8 8.66667M2 5.33333V10.6667L8 14M14 5.33333L8 8.66667M14 5.33333V10.6667L8 14M8 8.66667V14"
                stroke="#1980C0"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconAssetsBorrowed() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path d="M2 8H10M10 8L7 5M10 8L7 11M14 3.33333V12.6667" stroke="#1980C0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconAssetsAvailable() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0">
            <path d="M13.5 4L6 11.5L2.5 8" stroke="#1980C0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function AssetOverviewCardDemo() {
    return (
        <OverviewCard
            title="DATA ASET"
            stats={[
                { icon: <IconTotalAssets />, label: 'Total Semua Aset', value: 980 },
                { icon: <IconAssetsBorrowed />, label: 'Aset Dipinjam Karyawan', value: 600 },
                { icon: <IconAssetsAvailable />, label: 'Aset Yang Tersedia', value: 6 },
            ]}
        />
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/design-system/card/card.tsx
git commit -m "feat(dashboard): add employee and asset overview card demos"
```

---

### Task 4: `ApprovalRequestList` component (with wired-up `DialogApproval`)

**Files:**
- Create: `resources/js/components/design-system/card/approval-list.tsx`

**Interfaces:**
- Consumes: `DialogApproval` and its `ApprovalDetailRow` type from `resources/js/components/design-system/pop-up/dialog-approval.tsx` (props: `open`, `onOpenChange`, `title?`, `details`, `decision?`, `onDecisionChange`, `onSave` — all already defined, unchanged); `Avatar`/`AvatarFallback`/`AvatarImage` from `@/components/ui/avatar`; `Button` from `@/components/ui/button`.
- Produces: named exports `ApprovalRequestList` (props: `title: string`, `counts: ApprovalCategoryCount[]`, `viewAllLabel: string`, `viewAllCount: number`, `requests: ApprovalRequest[]`) and `ApprovalRequestListDemo`, consumed by `dashboard.tsx` in Task 7.

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';

import { DialogApproval } from '@/components/design-system/pop-up/dialog-approval';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export interface ApprovalCategoryCount {
    label: string;
    value: number;
    color: string;
}

export interface ApprovalRequest {
    name: string;
    avatarUrl?: string;
    description: string;
    type: string;
}

interface ApprovalRequestListProps {
    title: string;
    counts: ApprovalCategoryCount[];
    viewAllLabel: string;
    viewAllCount: number;
    requests: ApprovalRequest[];
}

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function ApprovalRequestList({ title, counts, viewAllLabel, viewAllCount, requests }: ApprovalRequestListProps) {
    const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
    const [decision, setDecision] = useState<'reject' | 'accept' | undefined>(undefined);

    function openApproval(request: ApprovalRequest) {
        setActiveRequest(request);
        setDecision(undefined);
    }

    function closeApproval() {
        setActiveRequest(null);
        setDecision(undefined);
    }

    return (
        <div className="flex w-full flex-col items-start gap-2 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex w-full items-center justify-between border-b border-b-[#E2E8F0] pb-4">
                <div className="flex flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-base font-semibold text-[#0F172A]">{title}</p>
                    <div className="flex items-center gap-3 py-1">
                        {counts.map((count, index) => (
                            <span key={count.label} className="flex items-center gap-3">
                                {index > 0 && <span className="h-[11px] w-px bg-[#E7E7E7]" />}
                                <span className="text-[13px] leading-[1.4em] font-bold" style={{ color: count.color }}>
                                    {count.label}: {count.value}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
                <p className="w-fit text-xs font-medium text-[#0D9488]">
                    {viewAllLabel} ({viewAllCount}) →
                </p>
            </div>

            <div className="flex w-full flex-col items-start">
                {requests.map((request, index) => (
                    <div
                        key={request.name}
                        className={`flex w-full items-center gap-3 py-3 ${index < requests.length - 1 ? 'border-b border-b-[#E2E8F0]' : ''}`}
                    >
                        <Avatar className="size-8 shrink-0">
                            <AvatarImage src={request.avatarUrl} alt={request.name} />
                            <AvatarFallback className="text-xs">{initials(request.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex w-full flex-col items-start gap-0.5">
                            <p className="w-full text-sm font-medium text-[#0F172A]">{request.name}</p>
                            <p className="w-full text-xs text-[#475569]">{request.description}</p>
                        </div>
                        <Button size="sm" className="h-auto w-fit shrink-0 rounded-lg px-3 py-1.5 text-xs" onClick={() => openApproval(request)}>
                            Approve
                        </Button>
                    </div>
                ))}
            </div>

            <DialogApproval
                open={activeRequest !== null}
                onOpenChange={(open) => !open && closeApproval()}
                title="Approve Pengajuan"
                details={
                    activeRequest
                        ? [
                              { label: 'Nama', value: activeRequest.name },
                              { label: 'Jenis', value: activeRequest.type },
                              { label: 'Keterangan', value: activeRequest.description },
                          ]
                        : []
                }
                decision={decision}
                onDecisionChange={setDecision}
                onSave={closeApproval}
            />
        </div>
    );
}

export function ApprovalRequestListDemo() {
    return (
        <ApprovalRequestList
            title="Pengajuan Menunggu Approval"
            counts={[
                { label: 'Cuti', value: 20, color: '#1E3A8A' },
                { label: 'Izin', value: 30, color: '#065F46' },
                { label: 'Lembur', value: 5, color: '#92400E' },
            ]}
            viewAllLabel="Lihat Semua"
            viewAllCount={8}
            requests={[
                { name: 'Aditya Wijaya', description: 'Cuti Sakit • Hari ini, 08:30', type: 'Cuti Sakit' },
                { name: 'Dewi Lestari', description: 'Lembur • Kemarin, 19:40', type: 'Lembur' },
                { name: 'Rian Setiawan', description: 'Cuti Tahunan • 24 Okt, 14:15', type: 'Cuti Tahunan' },
            ]}
        />
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/design-system/card/approval-list.tsx
git commit -m "feat(dashboard): add approval request list wired to DialogApproval"
```

---

### Task 5: `PeriodDropdown` component

**Files:**
- Create: `resources/js/components/period-dropdown.tsx`

**Interfaces:**
- Consumes: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from `@/components/ui/dropdown-menu` (existing shadcn primitives).
- Produces: `PeriodDropdown({ periods: string[], defaultPeriod: string })`, consumed by `dashboard.tsx` in Task 7. Purely local `useState` — selecting an item only changes the displayed label, no side effects (per spec: nothing in this page refetches on period change since all data is static).

- [ ] **Step 1: Create the component**

```tsx
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PeriodDropdownProps {
    periods: string[];
    defaultPeriod: string;
}

export function PeriodDropdown({ periods, defaultPeriod }: PeriodDropdownProps) {
    const [selected, setSelected] = useState(defaultPeriod);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] font-semibold text-[#0F172A] outline-none">
                {selected}
                <ChevronDown className="size-3.5 text-[#475569]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {periods.map((period) => (
                    <DropdownMenuItem key={period} onSelect={() => setSelected(period)}>
                        {period}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/period-dropdown.tsx
git commit -m "feat(dashboard): add static period dropdown component"
```

---

### Task 6: `FloatingAssistantButton` component

**Files:**
- Create: `resources/js/components/floating-assistant-button.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `FloatingAssistantButton()` (no props), consumed by `dashboard.tsx` in Task 7. Static only — no click handler, no panel (per spec, this is a visual placeholder for a feature that doesn't exist yet).

- [ ] **Step 1: Create the component**

```tsx
import { Sparkles } from 'lucide-react';

export function FloatingAssistantButton() {
    return (
        <button
            type="button"
            className="fixed right-6 bottom-6 flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] shadow-[0px_4px_16px_0px_rgba(15,23,42,0.12)]"
        >
            <Sparkles className="size-4 text-[#1980C0]" />
            HRIS Assistant
        </button>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/floating-assistant-button.tsx
git commit -m "feat(dashboard): add static floating HRIS assistant button"
```

---

### Task 7: Assemble the Dashboard page

**Files:**
- Modify: `resources/js/pages/dashboard.tsx`

**Interfaces:**
- Consumes everything produced by Tasks 1–6, plus existing unmodified exports: `AttendanceStatusSummary` (`@/components/design-system/card/status-kehadiran`), `TopPerformanceCardDemo` (`@/components/design-system/card/performa`), `WeeklyShiftScheduleDemo` (`@/components/design-system/jadwal-shift/jadwal-shift`), `TrainingSummaryCardDemo` (`@/components/design-system/card/pelatihan`), `RecruitmentPipelineCardDemo` (`@/components/design-system/card/rekrutment`), `PayrollSummaryCardDemo` (`@/components/design-system/card/penggajian`). Also consumes `SharedData` / `Auth` / `User` types and `usePage` from `@inertiajs/react` for the logged-in user's name.
- Produces: the page Inertia renders at `GET /dashboard` (route already exists, unchanged — see `routes/web.php`).

- [ ] **Step 1: Replace `resources/js/pages/dashboard.tsx`**

```tsx
import { Head, usePage } from '@inertiajs/react';

import { ApprovalRequestListDemo } from '@/components/design-system/card/approval-list';
import { AssetOverviewCardDemo, EmployeeOverviewCardDemo } from '@/components/design-system/card/card';
import { PayrollSummaryCardDemo } from '@/components/design-system/card/penggajian';
import { TopPerformanceCardDemo } from '@/components/design-system/card/performa';
import { RecruitmentPipelineCardDemo } from '@/components/design-system/card/rekrutment';
import { AttendanceStatusSummary } from '@/components/design-system/card/status-kehadiran';
import { TrainingSummaryCardDemo } from '@/components/design-system/card/pelatihan';
import { WeeklyShiftScheduleDemo } from '@/components/design-system/jadwal-shift/jadwal-shift';
import { FloatingAssistantButton } from '@/components/floating-assistant-button';
import { NotificationBell } from '@/components/notification-bell';
import { PeriodDropdown } from '@/components/period-dropdown';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const PERIODS = ['Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026'];
const DEFAULT_PERIOD = 'Juli 2026';

function getGreetingWord(hour: number) {
    if (hour < 11) return 'pagi';
    if (hour < 15) return 'siang';
    if (hour < 18) return 'sore';
    return 'malam';
}

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const greeting = getGreetingWord(new Date().getHours());

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={<NotificationBell count={5} />}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                        <p className="font-poppins text-lg font-semibold text-[#0F172A]">
                            Selamat {greeting} {auth.user.name}
                        </p>
                        <p className="text-sm text-[#4F4F4F]">berikut adalah Ringkasan aktivitas HRIS periode terpilih {DEFAULT_PERIOD}.</p>
                    </div>
                    <PeriodDropdown periods={PERIODS} defaultPeriod={DEFAULT_PERIOD} />
                </div>

                <div className="grid w-full grid-cols-2 gap-5">
                    <EmployeeOverviewCardDemo />
                    <AssetOverviewCardDemo />
                </div>

                <div className="grid w-full grid-cols-2 items-start gap-5">
                    <div className="flex w-full flex-col items-start gap-5 rounded-xl border border-[#E2E8F0] p-5">
                        <p className="font-poppins text-sm font-semibold text-black">ABSENSI</p>
                        <div className="flex w-full flex-col gap-4">
                            <AttendanceStatusSummary
                                stats={[
                                    { label: 'On Time', value: 213 },
                                    { label: 'Terlambat', value: 21 },
                                    { label: 'Cuti', value: 53 },
                                ]}
                            />
                            <AttendanceStatusSummary
                                stats={[
                                    { label: 'Alpha', value: 89 },
                                    { label: 'Izin', value: 89 },
                                    { label: 'Lembur', value: 89 },
                                ]}
                            />
                        </div>
                        <ApprovalRequestListDemo />
                    </div>
                    <TopPerformanceCardDemo />
                </div>

                <WeeklyShiftScheduleDemo />

                <div className="grid w-full grid-cols-2 items-start gap-5">
                    <div className="flex w-full flex-col gap-5">
                        <TrainingSummaryCardDemo />
                        <PayrollSummaryCardDemo />
                    </div>
                    <RecruitmentPipelineCardDemo />
                </div>
            </div>

            <FloatingAssistantButton />
        </AppLayout>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/pages/dashboard.tsx
git commit -m "feat(dashboard): assemble HRIS dashboard page from design-system components"
```

---

### Task 8: Full verification — lint, build, and manual browser check

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Format and lint**

Run: `npm run format:check`
Expected: exits 0. If it fails, run `npm run format` to auto-fix, review the diff, then re-run `format:check`.

Run: `npm run lint`
Expected: exits 0, no errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: exits 0 — Vite build succeeds, no TypeScript errors, `public/build/manifest.json` is regenerated.

- [ ] **Step 3: Manual browser check**

Start the app (`php artisan serve` + `npm run dev`, or however this project's `run` skill/dev script launches it), log in with a real account, navigate to `/dashboard`, and confirm:
- Greeting shows "Selamat {pagi/siang/sore/malam} {your name}" matching the current server time and your logged-in user's name.
- Notification bell with a red "5" badge appears top-right of the header.
- Two overview cards (DATA KARYAWAN, DATA ASET), the ABSENSI card (two attendance rows + the nested "Pengajuan Menunggu Approval" list), PERFORMA bar chart, weekly shift schedule table, and the three bottom cards (PELATIHAN, PENGGAJIAN, REKRUTMENT) all render without console errors.
- Clicking "Approve" on a pending-approval row opens the `DialogApproval` dialog; choosing a decision and clicking "Simpan" closes it without a page reload or network error.
- Clicking the period dropdown shows the period list and updates the displayed label on selection.
- The "HRIS Assistant" floating button is visible in the bottom-right corner and does not throw on click (it does nothing, by design).

- [ ] **Step 4: Commit (only if Step 1 required an auto-fix)**

```bash
git add -A
git commit -m "chore(dashboard): apply formatting fixes"
```
