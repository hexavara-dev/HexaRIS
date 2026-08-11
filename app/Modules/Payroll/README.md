# Payroll

Self-contained `Payroll` module.

## Permissions

| Permission | Purpose |
|---|---|
| `payroll.viewAny` | List payroll data (`/payroll/data`) |
| `payroll.update` | Declared, but not currently wired to any route — see below |

Run `php artisan permission:sync` after changing `permissions.php`.

## Routes

| Method | URI | Name | Permission |
|---|---|---|---|
| `GET` | `payroll/data` | `payroll.data.index` | `payroll.viewAny` |

This is the only real route in the module. `payroll.update` is declared for
future use but does not currently gate anything — there is no backend write
path yet. All edits (status change, "Edit Slip Gaji" dialog) are entirely
client-side, applied through a `localStorage` overrides overlay that is
merged over the seed data at render time, the same pattern used by the
Employee module's mocked wizard. See `resources/js/lib/payroll-storage.ts`.

## No database migrations

This module has no migrations by design — it is a frontend-only mock. Seed
data lives in `resources/js/data/Payroll/` (and related Employee/Position
fixtures it joins against) rather than the database.

See `docs/superpowers/specs/2026-08-10-payroll-data-gaji-design.md` for the
full design rationale.
