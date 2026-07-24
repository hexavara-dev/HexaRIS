# Getting Started

A practical guide to setting up, running, and building on this template. For the *why* behind the
conventions, see [`conventions.md`](conventions.md); for the git workflow, see
[`../CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## 1. What this template is

A ready-to-use **Laravel 12 + Inertia (React + TypeScript)** admin starter:

- **Self-contained modules** under `app/Modules/<Name>/` (backend + React + migrations + routes +
  permissions + tests in one portable folder; auto-registered at boot).
- **RBAC** (spatie/laravel-permission) with a `super-admin` bypass + a management UI.
- **Audit log** (atomic/async) for who-changed-what.
- An **admin design system** — sidebar shell, permission-gated nav, teal theme, and a reusable
  `DataTable` (server-side sort/filter), forms, dialogs, toasts.
- **AI-assisted skills** in `.claude/skills/` for building features the standard way.

Built-in modules: **Iam** — Identity & Access Management (`/login`, `/iam/users`, `/iam/roles`,
`/iam/permissions`) — and **Audit** (`/audit`).

---

## 2. Requirements

| Tool | Version |
|---|---|
| PHP | 8.4+ |
| Composer | 2.x |
| Node.js | 22+ |
| npm | 10+ |

SQLite is the default database (zero config). MySQL/Postgres work too — just set `DB_*` in `.env`.

---

## 3. Setup (do every step — these are the ones people forget)

```bash
composer install            # PHP dependencies
npm install                 # JS dependencies (also installs the Lefthook git hooks)

cp .env.example .env         # create your env file
php artisan key:generate     # ← REQUIRED — without this you get "No application encryption key"

touch database/database.sqlite          # create the SQLite file (default DB)
php artisan migrate --seed              # ← create tables + seed permissions, super-admin role & admin user
```

Then start the app (pick one):

```bash
npm run dev                  # Vite dev server (hot reload) — run alongside the PHP server
# in a second terminal:
php artisan serve            # http://127.0.0.1:8000
```

or, for a production-style run without the Vite dev server:

```bash
npm run build                # compile assets once
php artisan serve
```

> **Why `key:generate` and `migrate --seed` matter:**
> - No `APP_KEY` → every request throws *“No application encryption key has been specified.”*
> - No `migrate` → *“no such table: users / sessions …”* on first request.
> - `--seed` is what creates the **admin login** and syncs the module permissions (see below). Plain
>   `migrate` leaves you with no users and an empty permission table.

---

## 4. First login

Seeding creates a ready-to-use admin (local only):

> **Email:** `admin@example.com`  **Password:** `password`

This user holds the **`super-admin`** role, which bypasses all authorization, so the sidebar shows
every section. Log in, then explore:

- **`/dashboard`** — the landing page (starter placeholder).
- **`/iam/users`** — list/create/edit/delete users, assign roles. Try sorting a column, the per-column
  filters, and the global search box.
- **`/iam/roles`** — create roles and tick which permissions they grant.
- **`/iam/permissions`** — read-only catalog of every permission (grouped by resource).
- **`/audit`** — who did what (filter by event/module/date).

The sidebar is **permission-gated** — a non-super-admin only sees the sections they can access.

---

## 5. Re-seeding / resetting

```bash
php artisan migrate:fresh --seed     # wipe + rebuild + reseed (admin + permissions). Safe locally.
php artisan permission:sync          # re-sync just the permissions after adding/removing a module's
                                     # permissions.php (no data loss). Use --prune to drop stale ones.
```

`db:seed` is **idempotent** — running it again won't duplicate the admin/test users.

---

## 6. Building a feature

You have two paths. Both produce the same standardized result.

### A) With the skills (recommended)

Invoke them in order (they encode the conventions and the tests):

```
/feature-brainstorm   →  a spec in docs/superpowers/specs/
/plan-feature         →  an ordered, TDD task list in docs/superpowers/plans/
/create-module Blog   →  scaffolds app/Modules/Blog/
/add-resource         →  an entity users list/create/edit/delete (full CRUD)
/add-action           →  one operation (approve, export, sync…)
/add-audit            →  log a write
/add-permission       →  a new <resource>.<action> permission + gate routes
/review-changes       →  convention checklist before merge
/finish-feature       →  run the gate, open a PR, then squash-merge after your approval
```

Rule of thumb: **managed entity → `add-resource`; single operation → `add-action`.**

### B) By hand

```bash
php artisan module:make Blog          # scaffold the module folder
# edit app/Modules/Blog/permissions.php → ['posts.viewAny', 'posts.create', ...]
php artisan permission:sync           # validate (<resource>.<action>) + write to DB
```
Then follow the canonical example — the **`users` aggregate in `app/Modules/Iam/`** — for the controller (`FiltersTableColumns`
trait index), FormRequests, DTO (spatie/laravel-data), React `Index.tsx`/`Form.tsx` (using
`<DataTable>`, `<PageHeader>`, `<FormLayout>`, `<ConfirmDialog>`), and the Feature tests (403 per
mutation + happy paths). See [`conventions.md`](conventions.md) §3.

> A module is **portable** — copy `app/Modules/Blog/` into another project on this template, run
> `php artisan permission:sync && php artisan migrate`, and it works.

---

## 7. Permissions & RBAC

- Permission names follow **`<resource>.<action>`** (e.g. `posts.view`, `posts.approve`), declared in
  each module's `permissions.php`, reconciled by `php artisan permission:sync`.
- Gate routes with middleware: `->middleware('can:posts.create')`.
- In React, gate UI with the hook: `const { can } = usePermissions(); can('posts.create')`.
- Assign permissions → roles at `/iam/roles`; assign roles → users at `/iam/users`.
- The **`super-admin`** role bypasses everything (and is protected from deletion/rename).

---

## 8. Auditing

- **Eloquent models:** add `use App\Audit\Concerns\IsAudited;` — create/update/delete are captured
  automatically. Keep secrets (passwords/tokens) in the model's `$hidden`; they're never logged.
- **Query Builder / explicit events:**
  ```php
  AuditLogger::atomic()   // or ::async() for high-volume
      ->subject('orders', $id)->before($old)->after($new)
      ->event('updated')->module('Orders')->log('Order approved');
  ```
- View entries at `/audit`. `atomic()` writes inside the current DB transaction (rolls back with it);
  `async()` queues the write.

---

## 9. Quality gate & git workflow

Before committing, the local hooks + CI enforce:

```bash
composer check     # Pint (format) + Larastan (PHPStan level 6) + Pest (tests)
npm run build      # compile assets
npm run types      # tsc --noEmit (type-check)
```

Workflow (see [`../CONTRIBUTING.md`](../CONTRIBUTING.md)): **never commit to `main`** — branch → PR →
CI green → **wait for the author's review approval** → **squash-merge** with a Conventional Commit PR
title. Never auto-merge on CI-green alone. Lefthook blocks direct pushes to `main` and runs
format/lint on commit.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| *“No application encryption key has been specified.”* | Run `php artisan key:generate`. |
| *“no such table: users / sessions”* | Run `php artisan migrate` (or `migrate --seed`). |
| Can't log in / no admin user | You ran `migrate` without `--seed`. Run `php artisan db:seed` (or `migrate:fresh --seed`). Login: `admin@example.com` / `password`. |
| A page 500s with *“Unable to locate file in Vite manifest”* | Assets aren't built. Run `npm run dev` (hot) or `npm run build`. |
| Sidebar shows no links after login | The user has no permissions and isn't `super-admin`. Seed (`--seed`) or assign a role at `/iam/roles` + `/iam/users`. |
| `composer check` skips a test (“Run npm run build first”) | The module-render test needs the Vite manifest. Run `npm run build`, then `composer check`. |
| `permission:sync` fails on a name | A permission isn't `<resource>.<action>` (lowercase resource, e.g. `posts.create`). Fix `permissions.php`. |
| Git push to `main` rejected | Intentional — branch and open a PR. See CONTRIBUTING.md. |
| `npm install` slow / hooks not installed | The `prepare` script runs `lefthook install`; re-run `npx lefthook install` if needed. |

---

## Where to go next

- **Conventions (source of truth):** [`conventions.md`](conventions.md)
- **Contributing / git workflow:** [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- **AI agent instructions:** [`../CLAUDE.md`](../CLAUDE.md)
- **API docs (JSON API surface only):** `/docs/api` — generated by Scramble from any module's `routes/api.php`. The page is empty until you add API routes there (Scramble does not document Inertia web routes). No annotations needed.
- **Seeing your endpoints:** `php artisan route:list` (terminal), `php artisan app:endpoints` → `docs/endpoints.md` (markdown table), or `/docs/routes` — the **API Explorer** (dev/local only, auth required): browse every endpoint, see each route's inputs (derived from its FormRequest rules), and send real requests over your session to inspect the response. Mutations are confirm-gated.
