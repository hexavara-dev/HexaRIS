# CLAUDE.md — Project instructions for AI agents

This is a modular Laravel 12 + Inertia React (TypeScript) application template.
A **module is a bounded context** that may contain several aggregates/resources,
organized as a self-contained directory under `app/Modules/<Name>/` — its routes,
controllers, FormRequests, DTOs, React pages, migrations, and permission
declarations together. The module system auto-registers everything at boot —
no manual `config/` edits needed. The built-in `Iam` context (auth, users, roles,
permissions) is the canonical reference; the `users` aggregate inside it is the
CRUD exemplar. RBAC is handled by spatie/laravel-permission with a `super-admin`
bypass gate. All sensitive writes should be audited.

## Before implementing anything

Read `docs/conventions.md` and `CONTRIBUTING.md` first. They are the canonical
source of truth for module structure, permission naming, CRUD shape, auditing
patterns, and the quality gate workflow.

## Skill pipeline (use for every feature)

To build a new feature, invoke the `.claude/skills/` pipeline in order:

1. `feature-brainstorm` — clarify requirements and edge cases.
2. `plan-feature` — produce a written implementation plan.
3. `create-module` / `add-resource` / `add-action` (+ `add-audit` / `add-permission`) — scaffold and implement.
4. `review-changes` — verify conventions, tests, and quality gate.
5. `finish-feature` — commit, push, open PR with a Conventional Commit title, then **stop and wait for the author's review approval before merging**.

- **Skill choice:** `create-module` = a new bounded context; `add-resource` = add a CRUD
  resource into a context (existing like `Iam`, or a new one); `add-action` = a single
  operation in a context. Adding an entity does not mean a new module — pick its context first.
- `feature-brainstorm` / `plan-feature` / `review-changes` / `finish-feature` build on the
  always-installed `superpowers` plugin — they add only the Laravel-specific parts.
- `draft-ticket` turns a spec into ready-to-paste GitHub Issue / Jira tickets (optional, for the board).

Skills live under `.claude/skills/`. Use the `Skill` tool to invoke them.

## Hard rules

- Permission names: `<resource>.<action>` (e.g. `posts.viewAny`, `posts.approve`).
  Run `php artisan permission:sync` after any change to a `permissions.php`.
- Gate every mutating route with `->middleware('can:<perm>')` — not in `authorize()`.
- Audit sensitive writes: use the `IsAudited` trait on models or call `AuditLogger`
  explicitly for domain events.
- Run `composer check` (Pint + PHPStan level 6 + Pest) AND `npm run build` before
  marking any task complete.
- Never commit to `main` — always PR + squash-merge with a Conventional Commit title.
- **Never auto-merge a PR.** After opening the PR and CI passing, STOP and wait for the author's
  explicit review approval before running `gh pr merge`. CI-green is not approval.
