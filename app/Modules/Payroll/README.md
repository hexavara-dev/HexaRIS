# Payroll

Self-contained `Payroll` module.

## Permissions

| Permission | Purpose |
|---|---|
| `payroll.viewAny` | List payroll data (`/payroll/data`) |
| `payroll.update` | Gates the Pengaturan Gaji page (`/payroll/settings`) |
| `reimburse.viewAny` | List reimburse data (`/payroll/reimburse`) |
| `reimburse.create` | Declared for future backend readiness — not yet gating a route; reimburse creation is client-side only (see below) |
| `reimburse.update` | Declared for future backend readiness — not yet gating a route; reimburse edits are client-side only (see below) |
| `reimburse.delete` | Declared for future backend readiness — not yet gating a route; reimburse deletes are client-side only (see below) |

Run `php artisan permission:sync` after changing `permissions.php`.

## Routes

| Method | URI | Name | Permission |
|---|---|---|---|
| `GET` | `payroll/data` | `payroll.data.index` | `payroll.viewAny` |
| `GET` | `payroll/settings` | `payroll.settings.index` | `payroll.update` |
| `GET` | `payroll/reimburse` | `payroll.reimburse.index` | `reimburse.viewAny` |

There is no backend write path for any of these pages yet. All edits (status
change, "Edit Slip Gaji" dialog, Pengaturan Gaji forms, Reimburse
create/edit/delete) are entirely client-side, applied through a
`localStorage` overrides overlay that is merged over the seed data at render
time, the same pattern used by the Employee module's mocked wizard. See
`resources/js/lib/payroll-storage.ts`.

Pengaturan Gaji's own settings (BPJS %, Alpha/Terlambat, PPh21, Lembur rate,
active Tunjangan) are persisted separately in
`resources/js/lib/payroll-settings-storage.ts`. Data Gaji's displayed
earnings/deductions are not baked into the seed data — they are recomputed
fresh on every render from these settings via `recomputeRow()` in
`resources/js/lib/payroll-row.ts`.

Reimburse's create/edit/delete follow the same overlay pattern in their own
storage file, `resources/js/lib/reimburse-storage.ts`.

## No database migrations

This module has no migrations by design — it is a frontend-only mock. Seed
data lives in `resources/js/data/Payroll/` (and related Employee/Position
fixtures it joins against) rather than the database.

See `docs/superpowers/specs/2026-08-10-payroll-data-gaji-design.md` for the
full design rationale.
