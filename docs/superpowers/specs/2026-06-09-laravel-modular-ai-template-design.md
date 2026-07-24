# Laravel Modular AI-Assisted Template — Design

**Date:** 2026-06-09
**Status:** Approved (design phase)

## 1. Goal

A ready-to-use Laravel 12 + Inertia React starter template built around two ideas:

1. **Self-contained, portable modules** — each feature lives in one folder containing
   everything it needs (backend, React, migrations, routes, permissions, tests, docs).
   Copy the folder into another project on this template and it works.
2. **AI-assisted development via skills** — the team's custom Laravel best practices are
   encoded as Claude Code skills covering the full lifecycle (idea → spec → tasks →
   build → review → ship). Juniors invoke a skill, get standardized output, and review it;
   seniors review a PR whose checklist is already filled in.

## 2. Stack

- **Laravel 12.61** (latest stable — Laravel 13 is not yet released as of 2026-06-09) + official **React starter kit** (Inertia v2, React 19, TypeScript, Tailwind, shadcn/ui)
- **Pest** for tests
- **spatie/laravel-permission** (RBAC)
- **spatie/laravel-activitylog** (audit storage engine — chosen over owen-it/laravel-auditing
  because its manual `activity()->log()` API supports the non-Eloquent / Query Builder path,
  which owen-it does not)
- **spatie/laravel-data** (DTOs)
- **dedoc/scramble** (API docs — static-analysis OpenAPI, zero annotations, infers from
  FormRequests/DTOs/types so docs stay current automatically)
- Quality: **Pint**, **Larastan/PHPStan**, **ESLint + Prettier + TypeScript strict**

## 3. Module Architecture

### 3.1 Layout (the portable unit)

```
app/Modules/<ModuleName>/
├── module.json                  # manifest: name, version, dependencies, permissions
├── README.md                    # concise, auto-generated module doc
├── Providers/<Name>ServiceProvider.php
├── Http/
│   ├── Controllers/             # resource + single-action (invokable) controllers
│   ├── Requests/                # FormRequest validation
│   └── Middleware/
├── Models/
├── Actions/                     # single-purpose business logic (invokable)
├── Services/
├── Policies/
├── Data/                        # DTOs (spatie/laravel-data)
├── routes/{web.php,api.php}
├── database/{migrations,seeders,factories}
├── permissions.php              # declares this module's permissions
├── resources/js/                # React pages + components for THIS module
│   ├── pages/
│   └── components/
└── tests/{Feature,Unit}
```

### 3.2 Auto-registration & portability

- A root `ModuleServiceProvider` discovers every `app/Modules/*/module.json` and registers
  each module's routes, migrations, policies, and permissions — no manual wiring.
- **Vite glob** resolves React pages per module; Inertia page names are namespaced
  (e.g. `Users::pages/Index`).
- `module.json` declares cross-module **dependencies**. (The field is parsed and carried on the `Module` object today; boot-time enforcement — failing when a declared dependency is absent — is deferred to a later plan. Until then, declared dependencies are advisory only.)
- Copy a module folder → `migrate` + `permission:sync` → it works.

## 4. RBAC

- spatie/laravel-permission with a **Role & Permission management UI** (React):
  assign permissions→role, roles→user.
- **Permission naming convention:** `<resource>.<action>`, lowercase, dot-separated.
  - `resource` = plural noun matching the module/model.
  - `action` = canonical verb mirroring policy abilities: `view`, `viewAny`, `create`,
    `update`, `delete`, `restore`, `forceDelete`, plus domain verbs (`approve`, `assign`,
    `export`) as needed.
  - Examples: `users.view`, `orders.approve`, `reports.export`.
- **Assign permissions to roles, not directly to users** (users get roles).
- **Super-admin** bypasses all checks via `Gate::before()` on a `super-admin` role.
- Single guard (`web`), declared explicitly.
- Each module declares permissions in `permissions.php`; **`permission:sync`** reconciles
  the DB and **validates the `<resource>.<action>` format**, failing loudly on violations.

## 5. Logging

Three distinct layers with different audiences:

### 5.1 Audit log (business actions — "who changed what")

- Stored in spatie's `activity_log` table, **unified for Eloquent and Query Builder paths**.
- Captures: causer (user), event, subject (table + id), `before`/`after` diff, module, IP, timestamp.
- A custom **`AuditLogger`** service (data-access-agnostic) exposes **two dispatch modes**:
  - **Atomic** — written inside the same DB transaction as the operation; rolls back with it.
    For critical events (permission changes, deletes, money).
  - **Async** — offloaded to a queued job; zero request latency. For high-volume/non-critical
    events (views, exports).
- **Eloquent path:** a `LogsActivity` trait auto-captures model changes.
- **Non-Eloquent path (Query Builder / raw / external):** explicit calls, e.g.

  ```php
  AuditLogger::async()                 // or ::atomic()
      ->subject('orders', $orderId)
      ->before($oldRow)->after($newRow)
      ->event('updated')
      ->log('Order status changed');
  ```

  Both land in the same store with the same semantics.

### 5.2 Authentication log

- Login success/failure, logout, password change captured via Laravel auth events into the
  same audit store (event = `auth.login`, etc.), visible in the same viewer.

### 5.3 Application/system log

- Standard Laravel Monolog channels (stack/daily). Developer audience. **Not** shown in the
  Audit Viewer — keeps auditors away from stack traces.

### 5.4 Audit Viewer (built-in `Audit` module)

- Read-only React table with filters (user, module, event type, date range, subject) and a
  per-entry before/after diff view.

## 6. Built-in Modules (shipped ready)

- **Auth + User & Profile** — login/register/forgot-password (starter kit), CRUD users,
  profile edit, password change, avatar.
- **RBAC** — Role & Permission management UI.
- **Audit** — Audit Viewer (read-only).

(Notifications, media, settings intentionally **out of scope** — YAGNI.)

## 7. The Skill Pipeline (AI-assisted development)

Skills ship in `.claude/skills/`. Each skill's output is the next skill's input, so the
lifecycle is deterministic and steps can't be silently skipped.

### Phase 1 — Define
| Skill | Input → Output |
|---|---|
| `feature-brainstorm` | Rough idea → **spec** (`docs/specs/<feature>.md`): module(s), data model, permissions, audit events (atomic/async), React pages, edge cases. Asks clarifying questions. |
| `plan-feature` | Spec → ordered **task list** (`docs/plans/<feature>.md`). Each task is small, testable, and names the build skill + acceptance check. Decides per task: `add-resource` vs `add-action`. |

### Phase 2 — Build (TDD-aware: failing test first, then implementation)
| Skill | Produces |
|---|---|
| `create-module` | Module skeleton: `module.json`, ServiceProvider, routes, `permissions.php`, README, React folder, tests skeleton, factory/seeder. The portable container. |
| `add-resource` | **CRUD over an entity:** Model + migration + FormRequests + Controller + Policy + DTO + permissions + React Index/Form pages + factory + Feature tests, wired. |
| `add-action` | **Single endpoint / use-case (non-CRUD):** invokable Controller + FormRequest + `Action` class + optional DTO + route + permission + Pest test + optional single React page. No model/migration assumptions. e.g. `orders.approve`, `reports.export`. |
| `add-audit` | Auditing on a model (trait) or a Query Builder op (explicit logger), atomic/async. |
| `add-permission` | Permission + policy ability + Gate/middleware wiring + RBAC UI surfacing. |

**Choosing the entry skill:** entity you list/create/edit/delete → `add-resource`;
a single action/use-case → `add-action`. Both chain into `add-audit` / `add-permission`.

### Phase 3 — Verify & Ship
| Skill | Does |
|---|---|
| `review-module` | Convention checklist: permission naming, policy on every route, audit coverage, tests present, TS types, README exists, no boilerplate drift. Pass/fail per item. |
| `finish-feature` | Runs `composer check` (Pint + Larastan + Pest + ESLint/TS), confirms green, then PR/merge checklist. |

### Junior's E2E loop
```
idea
 └─ feature-brainstorm  → spec.md
     └─ plan-feature    → tasks.md (each task = 1 build skill + check)
         └─ per task: create-module / add-resource | add-action / add-audit / add-permission  (TDD)
             └─ review-module   → checklist verdict
                 └─ finish-feature → quality gates green → PR → human review
```

## 8. Documentation (lean — "jangan over")

Three kinds, all generated or verified — never a manual discipline chore, never bloated:

1. **API docs** — `dedoc/scramble`, generated from controllers / FormRequests / DTOs via
   static analysis (no annotations). Regenerated in `composer check`/CI. The DTOs and
   FormRequests are the contract, so docs stay accurate by construction.
2. **Feature docs** — spec (`docs/specs`) + plan (`docs/plans`) from Phase 1, plus a **concise
   auto-generated module `README.md`** (purpose, permissions, routes, models, audit events,
   dependencies). Travels with the portable module.
3. **Code docs** — strict TypeScript types, FormRequests, DTOs, and Pest tests as
   self-documenting contracts/examples. Minimal prose PHPDoc.

**Light enforcement only:** `review-module` checks that API docs generate cleanly and a module
README exists. No "doc drift police", no prose mandates.

## 9. Conventions (single source of truth)

- `CLAUDE.md` + `docs/conventions.md`: module layout, permission format, audit modes, naming.
  Read by both AI agents and humans, so generated and hand-written code stay on-pattern.

## 10. Out of Scope (YAGNI)

- Notifications / media library / settings module
- Multi-tenancy
- Full custom audit engine (we use spatie as the store, custom only for dispatch modes)
- nwidart/laravel-modules (custom structure instead, for full control)
