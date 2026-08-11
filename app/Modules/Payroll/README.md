# Payroll

Self-contained `Payroll` module.

## Permissions

| Permission | Purpose |
|---|---|
| `payroll.viewAny` | List payroll data (`/payroll/data`) |
| `payroll.update` | Gates the Pengaturan Gaji page (`/payroll/settings`) |

Run `php artisan permission:sync` after changing `permissions.php`.

## Routes

| Method | URI | Name | Permission |
|---|---|---|---|
| `GET` | `payroll/data` | `payroll.data.index` | `payroll.viewAny` |
| `GET` | `payroll/settings` | `payroll.settings.index` | `payroll.update` |

There is no backend write path for either page yet. All edits (status
change, "Edit Slip Gaji" dialog, Pengaturan Gaji forms) are entirely
client-side, applied through a `localStorage` overrides overlay that is
merged over the seed data at render time, the same pattern used by the
Employee module's mocked wizard. See `resources/js/lib/payroll-storage.ts`.

Pengaturan Gaji's own settings (BPJS %, Alpha/Terlambat, PPh21, Lembur rate,
active Tunjangan) are persisted separately in
`resources/js/lib/payroll-settings-storage.ts`. Data Gaji's displayed
earnings/deductions are not baked into the seed data — they are recomputed
fresh on every render from these settings via `recomputeRow()` in
`resources/js/lib/payroll-row.ts`.

## No database migrations

This module has no migrations by design — it is a frontend-only mock. Seed
data lives in `resources/js/data/Payroll/` (and related Employee/Position
fixtures it joins against) rather than the database.

See `docs/superpowers/specs/2026-08-10-payroll-data-gaji-design.md` for the
full design rationale.
