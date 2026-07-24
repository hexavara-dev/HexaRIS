# Skill Pipeline + API Docs Implementation Plan (Plan 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. NOTE: most deliverables here are **authored Markdown skills + docs**, not Pest-tested PHP. "Green" means: valid skill frontmatter, `composer check` and `npm run build` still pass, and Scramble serves API docs.

**Goal:** Ship the project-local **Claude Code skill pipeline** (`.claude/skills/`) that lets a junior take a feature from idea → spec → tasks → standardized implementation → review → PR, codifying the conventions already proven in the Audit / Rbac / Users modules, plus zero-annotation **Scramble** API docs and a `CLAUDE.md`/conventions source of truth.

**Architecture:** Each skill is a directory `.claude/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`) and Markdown instructions. The build skills don't generate code blind — they walk the agent through the established pattern, pointing at the **Users module as the canonical CRUD example** and the **Audit module** for the action/audit patterns. A root `CLAUDE.md` and `docs/conventions.md` are the single source of truth the skills (and any AI agent) read.

**Tech Stack:** Claude Code skills (Markdown), dedoc/scramble (already installed), Laravel 12.61. Gate: `composer check` + `npm run build`. Workflow: feature branch → PR → squash-merge.

---

## Conventions to codify (already established in the codebase)

- **Modules:** `app/Modules/<Name>/` scaffolded by `php artisan module:make <Name>`; PascalCase internal dirs; auto-registered routes/migrations/permissions/provider; React pages namespaced `Name::pages/Foo`.
- **Permissions:** `<resource>.<action>` (lowercase resource, canonical action e.g. `viewAny/view/create/update/delete` + domain verbs); declared in the module's `permissions.php`; reconciled by `php artisan permission:sync`; routes gated by `can:<perm>`.
- **CRUD shape (see `app/Modules/Users`):** FormRequests (Store/Update, `authorize()=true` + route middleware), thin invokable/resourceful Controller, spatie/laravel-data DTO, React Index/Form pages, Feature tests asserting **403 for every mutation** + happy paths.
- **Auditing:** `App\Audit\Concerns\IsAudited` trait on Eloquent models (auto, hidden attrs excluded); `AuditLogger::atomic()/async()->subject()->before()->after()->event()->log()` for Query Builder / explicit events.
- **Quality gate:** `composer check` (Pint + Larastan level 6 + Pest) and `npm run build`; hooks (Lefthook) + CI enforce it; squash-merge workflow (see CONTRIBUTING.md).

---

## Task 1: `CLAUDE.md` + `docs/conventions.md`

**Files:** Create `CLAUDE.md` (repo root), `docs/conventions.md`.

- [ ] **Step 1:** Author `docs/conventions.md` documenting, with short examples drawn from the real modules: module layout & generation, the `<resource>.<action>` permission convention + `permission:sync`, the CRUD shape (FormRequest/Controller/DTO/React/tests) citing `app/Modules/Users`, the auditing patterns (IsAudited vs AuditLogger atomic/async) citing `app/Audit`, and the quality gate + squash-merge workflow.
- [ ] **Step 2:** Author `CLAUDE.md` (root) as a concise pointer for AI agents: project summary, "read `docs/conventions.md` and `CONTRIBUTING.md`", the skill pipeline entry points, "run `composer check` + `npm run build` before finishing", "never commit to main; PR + squash-merge", and the permission/audit one-liners.
- [ ] **Step 3:** `composer check` green (unaffected). Commit: `docs: add CLAUDE.md and conventions source of truth`.

---

## Task 2: Scramble API docs

**Files:** publish `config/scramble.php` (if useful), update `README.md`.

- [ ] **Step 1:** Confirm Scramble serves docs: run `php artisan route:list | grep docs` — Scramble registers `GET docs/api` (UI) and `GET docs/api.json` (OpenAPI) in local/non-production by default. If not present, publish/enable per dedoc/scramble docs (`php artisan vendor:publish --tag=scramble-config`) and ensure the route is available in `local`.
- [ ] **Step 2:** Since module API routes live in each module's `routes/api.php`, confirm Scramble's default path (`api/*`) picks them up, or set `scramble.api_path`/`api_domain` as needed so module API endpoints appear. (The current modules are web-only; this wires docs for future `routes/api.php` endpoints — document that API endpoints are auto-documented.)
- [ ] **Step 3:** Add a short **API docs** section to `README.md`: docs are generated from FormRequests/DTOs/types with zero annotations, served at `/docs/api` (local), OpenAPI JSON at `/docs/api.json`.
- [ ] **Step 4:** `composer check` green. Commit: `docs: wire Scramble API documentation`.

---

## Task 3: Phase-1 skills — `feature-brainstorm`, `plan-feature`

**Files:** `.claude/skills/feature-brainstorm/SKILL.md`, `.claude/skills/plan-feature/SKILL.md`.

- [ ] **Step 1:** `feature-brainstorm/SKILL.md` — frontmatter `name: feature-brainstorm`, `description:` (when to use: turning a rough feature idea into a concrete spec for this template). Body: ask one question at a time to pin down which module(s), data model, permissions (`<resource>.<action>`), audit events (atomic/async), routes & React pages, edge cases; then write `docs/specs/<feature>.md`. Reference `docs/conventions.md`.
- [ ] **Step 2:** `plan-feature/SKILL.md` — `description:` (turning a spec into an ordered task list). Body: produce `docs/plans/<feature>.md` where each task is small, testable, and names the build skill to use (`create-module` / `add-resource` / `add-action`) + its acceptance check (the test + `composer check`). Decide per entity vs use-case which build skill applies.
- [ ] **Step 3:** Validate frontmatter (each SKILL.md starts with `---\nname: ...\ndescription: ...\n---`). `composer check` green. Commit: `feat(skills): add feature-brainstorm and plan-feature skills`.

---

## Task 4: Build skills — `create-module`, `add-resource`, `add-action`

**Files:** `.claude/skills/create-module/SKILL.md`, `.claude/skills/add-resource/SKILL.md`, `.claude/skills/add-action/SKILL.md`.

- [ ] **Step 1:** `create-module` — steps: `php artisan module:make <Name>`; set `module.json` (name/alias/version/dependencies); declare initial permissions in `permissions.php`; `php artisan permission:sync`; note the auto-registration. Reference an existing module.
- [ ] **Step 2:** `add-resource` — the CRUD generator skill. Walk through creating, **following `app/Modules/Users` exactly**: Model (or reuse core), migration, `StoreXRequest`/`UpdateXRequest`, resourceful Controller (index/create/store/edit/update/destroy), spatie/laravel-data DTO, permissions `x.viewAny/create/update/delete` in `permissions.php` + `permission:sync`, routes (`auth` + `can:x.*`), React `Index.tsx`/`Form.tsx` (namespaced), Feature tests asserting **403 on every mutation** + CRUD happy paths, README + `composer check` + `npm run build`. Emphasize TDD (failing test first).
- [ ] **Step 3:** `add-action` — single non-CRUD endpoint: invokable Controller + FormRequest + an `Actions/` class holding the business logic + route (`auth` + `can:`) + permission + Pest Feature test + optional single React page. Reference the pattern; no model/migration assumptions.
- [ ] **Step 4:** Validate frontmatter; `composer check` green. Commit: `feat(skills): add create-module, add-resource, add-action skills`.

---

## Task 5: Cross-cutting skills — `add-audit`, `add-permission`

**Files:** `.claude/skills/add-audit/SKILL.md`, `.claude/skills/add-permission/SKILL.md`.

- [ ] **Step 1:** `add-audit` — two paths: (a) Eloquent model → add `use App\Audit\Concerns\IsAudited;` (auto-capture; ensure sensitive fields are in `$hidden`); (b) Query Builder / explicit event → `AuditLogger::atomic()` (critical, in-transaction) or `::async()` (high-volume) with `subject()/before()/after()/event()/module()/log()`. Reference `app/Audit` and the Audit viewer.
- [ ] **Step 2:** `add-permission` — add a `<resource>.<action>` entry to the module's `permissions.php`; run `php artisan permission:sync` (it validates the format); gate the route with `can:<perm>`; note it appears automatically in the Rbac permission catalog and is assignable to roles.
- [ ] **Step 3:** Validate frontmatter; `composer check` green. Commit: `feat(skills): add add-audit and add-permission skills`.

---

## Task 6: Verify/ship skills — `review-module`, `finish-feature`

**Files:** `.claude/skills/review-module/SKILL.md`, `.claude/skills/finish-feature/SKILL.md`.

- [ ] **Step 1:** `review-module` — a checklist skill outputting pass/fail per item: permission naming `<resource>.<action>`; a `can:` (or policy) on every route, especially mutations; **403 tests for every mutation**; happy-path tests; audit coverage for sensitive writes; DTOs don't leak hidden fields; TS types present; module `README.md` exists & matches routes/permissions; `composer check` + `npm run build` green. Reference the Users/Rbac modules as the standard.
- [ ] **Step 2:** `finish-feature` — run `composer check` + `npm run build`; ensure on a feature branch (not `main`); commit with a Conventional Commit message; push; `gh pr create` with a Conventional Commit PR title; wait for CI; squash-merge + delete branch. Reference `CONTRIBUTING.md`.
- [ ] **Step 3:** Validate frontmatter; `composer check` green. Commit: `feat(skills): add review-module and finish-feature skills`.

---

## Task 7: README skill-pipeline section + final verification

**Files:** Modify `README.md`.

- [ ] **Step 1:** Add a **"Skill pipeline"** section to `README.md`: list the 9 skills and the junior's loop (`feature-brainstorm` → `plan-feature` → `create-module`/`add-resource`/`add-action` (+ `add-audit`/`add-permission`) → `review-module` → `finish-feature`), and that they live in `.claude/skills/` and encode the conventions in `docs/conventions.md`.
- [ ] **Step 2:** Final verification:
  - `ls .claude/skills` shows all 9 skill directories, each with a `SKILL.md` whose frontmatter has `name` + `description`.
  - `composer check` green; `npm run build` green.
  - `php artisan route:list | grep docs` shows the Scramble docs route.
- [ ] **Step 3:** Commit: `docs: document the skill pipeline in the README`.

---

## Self-Review

**Spec coverage (Section 7 — Skill pipeline; Section 8 — docs; Section 9 — conventions):**
- 9 lifecycle skills → Tasks 3–6 ✅
- `CLAUDE.md` + `docs/conventions.md` source of truth → Task 1 ✅
- Scramble API docs → Task 2 ✅
- README documents the pipeline → Task 7 ✅
- Skills reference the real Audit/Rbac/Users modules as worked examples → Tasks 4–6 ✅

**Known choices:**
- Skills are instruction/checklist Markdown (not new artisan generators) — they point at `app/Modules/Users` as the canonical example so output stays consistent without a bespoke code generator to maintain. A future enhancement could add `module:resource`/`module:action` artisan generators that these skills invoke.
- Validation is structural (frontmatter present) + the gate staying green, since skills aren't Pest-testable.

This is the final plan; it completes the template.
