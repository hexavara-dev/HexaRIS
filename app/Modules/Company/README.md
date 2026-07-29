# Company

Self-contained `Company` module. Currently a single page: the org structure viewer/editor at
`/company/structure`. Pure front-end mock for this iteration — no models, migrations, or
permissions yet; all structure data is entered through the "Atur Struktur" wizard and persisted to
`localStorage` client-side. See `docs/superpowers/specs/2026-07-28-company-org-structure-design.md`
for the full design and the backend follow-up plan (models, permissions, audit).

## Permissions

_None yet — the page is gated by `auth` only (matches `dashboard`), no permission-scoped writes
exist since nothing is persisted server-side._

## Routes

- `GET /company/structure` (`company.structure`) — renders `Company::pages/Structure`.
