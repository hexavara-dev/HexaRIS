# HRIS Dashboard page — design

Date: 2026-07-27
Status: approved (pending final spec review)

## Goal

Replace the starter-kit placeholder at `resources/js/pages/dashboard.tsx` with the
real HRIS dashboard the product design specifies: KPI overview cards, attendance
summary + pending-approval list, a top-performer ranking chart, a weekly shift
schedule, and three bottom summary cards (training, recruitment, payroll).

This is a pure front-end assembly task. Only `Iam` and `Audit` modules exist today
— none of Employees / Company / Attendance / Performance / Payroll / Recruitment /
Training / Master Data have a backend yet. Every number on this page is therefore
**static mock data** except the greeting, which uses the real logged-in user's name.
No new backend module, route, or migration is created by this feature.

## Why this is mostly assembly, not new build

`resources/js/components/design-system/` already contains a library of
presentational components whose demo data matches the target mockup almost
verbatim, built but never wired into a page:

| Mockup section | Existing component | Status |
|---|---|---|
| DATA KARYAWAN / DATA ASET | `card/card.tsx` → `OverviewCard` | Reuse as-is (`OverviewCardDemo` exists for Karyawan; a new `AssetOverviewCardDemo` sibling export is added for Aset with 3 new inline icon components, same style as the existing icon helpers in that file) |
| ABSENSI stat row | `card/status-kehadiran.tsx` → `AttendanceStatusSummary` | Reuse, called twice (see Layout) |
| PERFORMA | `card/performa.tsx` → `TopPerformanceCard` | Reuse `TopPerformanceCardDemo` unchanged |
| Jadwal shift mingguan | `jadwal-shift/jadwal-shift.tsx` → `WeeklyShiftSchedule` | Reuse `WeeklyShiftScheduleDemo` unchanged (data already matches mockup exactly) |
| PELATIHAN | `card/pelatihan.tsx` → `TrainingSummaryCard` | Reuse `TrainingSummaryCardDemo` unchanged |
| REKRUTMENT | `card/rekrutment.tsx` → `RecruitmentPipelineCard` | Reuse `RecruitmentPipelineCardDemo` unchanged |
| PENGGAJIAN | `card/penggajian.tsx` → `PayrollSummaryCard` | Reuse `PayrollSummaryCardDemo` unchanged |
| Approve dialog | `pop-up/dialog-approval.tsx` → `DialogApproval` | Reuse as-is, wired up by the new list component below |

Net-new pieces (nothing in the design-system covers these yet):

1. **`design-system/card/approval-list.tsx`** — new `ApprovalRequestList` component:
   header (category counts + "Lihat Semua (N)" link, non-functional), a list of
   request rows (avatar/initials, name, description, Approve button), and internal
   `useState` to open `DialogApproval` per row. "Approve"/"Tolak" in the dialog only
   closes it (`onSave` just `setOpen(false)`) — no request is mutated, consistent
   with there being no backend for leave/overtime requests yet.
2. **Notification bell** — `AppSidebarHeader` gets a new optional `actions?: ReactNode`
   prop (default `undefined`, rendered right-aligned via `justify-between`; every
   other page is unaffected since they don't pass it). `dashboard.tsx` passes a new
   `resources/js/components/notification-bell.tsx` — a static `Bell` (lucide) icon
   with a hardcoded badge count, no click behavior (no notification system exists).
3. **Period selector ("July 2026")** — a small dashboard-local component using the
   existing shadcn `DropdownMenu` primitive, populated with a short static list of
   month labels. Selecting one only updates the displayed label (local state) —
   it doesn't refetch anything, since all data below is static anyway. This avoids
   a dead-looking, unclickable control without implying real period filtering exists.
4. **Floating "HRIS Assistant" button** — fixed bottom-right circular button on the
   dashboard page only (not added to the shared layout — no other page mockup asked
   for it). Static: no panel, no click handler. Purely a visual placeholder for a
   feature that doesn't exist yet.

## Layout (`resources/js/pages/dashboard.tsx`)

Top to bottom, inside `AppLayout` (breadcrumb: Dashboard), header gets the new
notification bell via `actions`:

1. Greeting row: `Selamat {pagi|siang|sore|malam} {auth.user.name}` (time-of-day
   computed client-side from `new Date().getHours()`, name from
   `usePage<SharedData>().props.auth.user.name`) + static subtitle text + period
   dropdown, right-aligned.
2. Two `OverviewCard`s side by side (`grid grid-cols-2 gap-5`): Karyawan, Aset.
3. Two-column row (`grid grid-cols-2 gap-5`):
   - Left: a bordered "ABSENSI" card wrapping two `AttendanceStatusSummary` calls
     stacked (`[On Time, Terlambat, Cuti]` then `[Alpha, Izin, Lembur]` — the
     component takes a flat stat row, so two calls reproduce the mockup's 2×3
     grid without changing the shared component's contract) plus the new
     `ApprovalRequestList` nested inside the same card, matching the mockup's
     nested-card look.
   - Right: `TopPerformanceCard` (`TopPerformanceCardDemo` data).
4. Full-width `WeeklyShiftSchedule` (`WeeklyShiftScheduleDemo` data, unchanged).
5. Two-column row: left column (`flex flex-col gap-5`) stacks `TrainingSummaryCard`
   then `PayrollSummaryCard`; right column is `RecruitmentPipelineCard` (naturally
   taller from its 10 pipeline stages, matching the mockup's visual balance).
6. Floating assistant button, fixed-position, rendered last (outside the flow).

Avatars in the approval list and shift schedule use `avatarUrl: undefined` so the
existing `AvatarFallback` initials pattern renders instead of pointing at
placeholder image paths (`/Rectangle.png` etc. from the raw export) that don't
exist in this repo.

## Out of scope

- The Login page redesign (tracked separately, still pending its own approval).
- Any real data source, API call, or new backend module for the metrics shown.
- Making the Google/notification/assistant/period controls functional.
- Changing `AppSidebarHeader`'s `actions` slot usage on any other existing page.

## Testing

No backend logic is added, so no Pest tests are needed. Verification is:
`npm run build` (TypeScript + Vite compile check) and a manual check in the browser
that the dashboard renders and roughly matches the mockup at the standard desktop
breakpoint (the mockup is desktop-only; no responsive/mobile design was specified,
so mobile layout will simply follow the existing container's natural wrapping —
not pixel-tuned).
