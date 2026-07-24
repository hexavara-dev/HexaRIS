# Laravel Modular Template

A ready-to-use Laravel 12 + Inertia (React + TypeScript) starter template built around **self-contained, portable modules** and an **AI-assisted, skill-driven** development workflow.

> Company template. Create a new project with **Use this template** on GitHub, or clone directly.

## Stack

- **Laravel 12.61** (latest stable) + Inertia v2, React 19, TypeScript, Tailwind, shadcn/ui
- **Pest** for tests
- **spatie/laravel-permission** — RBAC
- **spatie/laravel-activitylog** — audit log store
- **spatie/laravel-data** — DTOs
- **dedoc/scramble** — JSON API docs (generated, zero-annotation); see [API documentation](#api-documentation)
- Quality gates: **Pint**, **Larastan (PHPStan)**, **Pest**

## Quick start

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed   # syncs permissions + creates the super-admin role & admin user
npm run dev                  # or: npm run build
```

Seeding gives you a ready-to-use admin (local only): **`admin@example.com` / `password`** (holds the
`super-admin` role, which bypasses all authorization). Visit `/iam/users`, `/iam/roles`, `/audit`.

> Full walkthrough + troubleshooting: **[docs/getting-started.md](docs/getting-started.md)**.

## Module system

A module is a **bounded context** — one self-contained, copy-pasteable folder under
`app/Modules/<Name>/` that may own several aggregates/resources: backend, React pages,
migrations, routes, permissions, and tests together. Modules auto-register (routes, migrations,
their own service provider, declared permissions) with no manual wiring.

Create a new module:

```bash
php artisan module:make Blog
php artisan permission:sync
```

This scaffolds `app/Modules/Blog/` (Http, Models, Actions, Services, Policies, Data, Providers,
Database/{Migrations,Seeders,Factories}, resources/js/{pages,components}, tests) plus a manifest,
README, route stubs, and a `permissions.php`.

### Permissions

Declared per module in `permissions.php` following the convention **`<resource>.<action>`**
(e.g. `users.view`, `orders.approve`). `php artisan permission:sync` reconciles them into the
database and validates the format. Assign permissions to roles, roles to users.

### Module React pages

Resolved via the namespace `Name::pages/Index` → `app/Modules/Name/resources/js/pages/Index.tsx`.

## Quality gate

```bash
composer check   # Pint (format) + Larastan (static analysis) + Pest (tests)
```

CI runs this on every pull request. Changes land via PR and **squash-merge** (linear history,
one commit per PR) — and only **after the PR author reviews and explicitly approves** (never
auto-merge on CI-green). See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and pre-merge guards.

## API documentation

[Scramble](https://scramble.dedoc.co/) documents the **JSON API surface** — routes served under `/api`
from a module's `routes/api.php`. The empty `routes/api.php` stubs are the ready-to-use placeholder;
add endpoints there (with an API auth guard such as Sanctum, intentionally not bundled) and they appear
in the docs automatically — no annotations needed.

- Interactive docs: **`/docs/api`** (local) — empty until you add API endpoints
- OpenAPI JSON: **`/docs/api.json`**

Inertia (web) routes are **not** in Scramble. To explore those, use:

```bash
php artisan route:list          # all routes in the terminal
php artisan app:endpoints       # → docs/endpoints.md (markdown table)
```

Or visit **`/docs/routes`** — the **API Explorer** (dev/local only, auth required): browse every
endpoint, see each route's inputs (derived from its FormRequest rules), and **send real requests**
over your session to inspect the response. Mutations are confirm-gated.

## Skill pipeline (AI-assisted development)

The team's conventions are codified as project-local **Claude Code skills** in `.claude/skills/`, so a
junior takes a feature from idea to merged PR with standardized, reviewable output. Each skill reads
[`docs/conventions.md`](docs/conventions.md).

The loop:

```
feature-brainstorm  →  plan-feature  →  create-module   (new bounded context)
                                         add-resource    (CRUD resource into a context)
                                         add-action      (single operation in a context)
                                         add-audit / add-permission
                                     →  review-changes  →  finish-feature
       └─ draft-ticket  (spec → GitHub/Jira tickets, optional)
```

`feature-brainstorm`, `plan-feature`, `review-changes`, and `finish-feature` build on the
**superpowers** plugin (always installed) — they add only the Laravel-specific parts.
**Decision:** new bounded context → `create-module`; a CRUD resource inside a context →
`add-resource`; a single operation → `add-action`. Adding an entity does not require a new
module — add the resource into an existing context (e.g. `Iam`) when it fits.

| Skill | Purpose |
|---|---|
| `feature-brainstorm` | Rough idea → a concrete spec (`docs/superpowers/specs/<feature>.md`) |
| `plan-feature` | Spec → an ordered, testable task list (`docs/superpowers/plans/<feature>.md`) |
| `create-module` | Scaffold a new bounded-context module (`module:make`) |
| `add-resource` | Add a CRUD resource — list/create/edit/delete — into a context (mirrors the `users` aggregate in `app/Modules/Iam`) |
| `add-action` | Add one non-CRUD operation (approve/export/sync/single endpoint) |
| `add-audit` | Wire auditing (`IsAudited` trait or `AuditLogger` atomic/async) |
| `add-permission` | Add a `<resource>.<action>` permission + gate routes |
| `review-changes` | Convention checklist (authorization, 403 tests, audit, no secret leak) |
| `finish-feature` | Run the gate, open a PR, then squash-merge **after the author approves** (per `CONTRIBUTING.md`) |
| `draft-ticket` | Spec → ready-to-paste GitHub Issue / Jira tickets (markdown) |

## Built-in modules

- **Iam** (`/login`, `/logout`, `/iam/users`, `/iam/roles`, `/iam/permissions`) — Identity & Access Management. One bounded context with four aggregates: Auth (session login/logout, no public registration by design), Users (admin user management with role assignment), Roles (roles & permissions management, `super-admin` bypass), and Permissions (read-only permission catalog).
- **Audit** (`/audit`) — read-only audit log viewer (atomic/async logging, Eloquent + Query Builder, auth events)

## Documentation

- **Getting started (setup → login → build a feature → troubleshooting):** [`docs/getting-started.md`](docs/getting-started.md)
- Conventions (source of truth for AI agents & contributors): [`docs/conventions.md`](docs/conventions.md), [`CLAUDE.md`](CLAUDE.md)
- Design spec: [`docs/superpowers/specs/`](docs/superpowers/specs/)
- Implementation plans: [`docs/superpowers/plans/`](docs/superpowers/plans/)
