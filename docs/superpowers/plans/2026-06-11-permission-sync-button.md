# "Sync permissions" button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) or subagent-driven-development. Steps use `- [ ]`.

**Goal:** A gated, audited "Sync permissions" button on `/iam/permissions` that runs the additive module-permission reconcile from the UI.

**Architecture:** Extract the reconcile into `App\Modular\PermissionSynchronizer` (used by both the CLI command and a new controller action); add permission `permissions.sync`; `POST /iam/permissions/sync` → `PermissionController::sync()` (additive, audited, flash); a gated button on the page. Build skill: `add-action`.

**Branch:** `refactor/iam-module` (commits join PR #20). After implementing, **push** (no merge — PR #20 awaits approval). Gate per task: `composer check` (+ `npm run types`/`lint`/`build` for FE).

Reference spec (has the full code): `docs/superpowers/specs/2026-06-11-permission-sync-button-design.md`.

---

## Task 1: `PermissionSynchronizer` + refactor the command (TDD)

**Files:** Create `app/Modular/PermissionSynchronizer.php`, `tests/Unit/PermissionSynchronizerTest.php`; modify `app/Modular/Console/SyncPermissionsCommand.php`.

- [ ] **Step 1 — Failing unit test** `tests/Unit/PermissionSynchronizerTest.php` (uses `TestCase` + `RefreshDatabase`):
  - resolves `PermissionSynchronizer` from the container; `sync()` returns `created` > 0 on a fresh DB and the declared permissions now exist;
  - second `sync()` → `created === 0` (idempotent);
  - feeding an invalid declared name (use a registry with `add(['BadName'])`) → result `invalid` non-empty and no permission created for it.
- [ ] **Step 2** — run it, see it fail (class missing).
- [ ] **Step 3** — implement `app/Modular/PermissionSynchronizer.php` exactly as in the spec (`sync(bool $prune = false): array{declared,created,invalid}`).
- [ ] **Step 4** — refactor `SyncPermissionsCommand::handle()` to resolve `PermissionSynchronizer`, call `sync($this->option('prune'))`, `error()` + return FAILURE if `invalid`, else `info("{declared} permissions synced ({created} new).")` + SUCCESS.
- [ ] **Step 5** — `composer check` green (existing command behavior preserved). Commit: `refactor(iam): extract PermissionSynchronizer; reuse in permission:sync`.

## Task 2: Route + permission + audited `sync()` action (TDD)

**Files:** modify `app/Modules/Iam/permissions.php`, `app/Modules/Iam/routes/web.php`, `app/Modules/Iam/Http/Controllers/PermissionController.php`; create `tests/Feature/Iam/PermissionSyncTest.php`.

- [ ] **Step 1 — Failing feature test** (`tests/Feature/Iam/PermissionSyncTest.php`): a user WITHOUT `permissions.sync` → `POST /iam/permissions/sync` `assertForbidden()`; a user WITH it (or super-admin) → redirect back + session has `success`; the declared permissions exist; an `activity`/audit row with event `permissions.synced` exists.
- [ ] **Step 2** — run, see it fail (route/permission missing → 403/404).
- [ ] **Step 3** — add `'permissions.sync'` to `app/Modules/Iam/permissions.php`; add the route to the iam group (spec); implement `PermissionController::sync(Request, PermissionSynchronizer): RedirectResponse` (additive; invalid → flash error; else `AuditLogger::atomic()->event('permissions.synced')->module('Iam')->by($request->user())->withProperties([...])->log(...)` + flash success), per the spec.
- [ ] **Step 4** — `php artisan permission:sync` (register the new `permissions.sync` perm) then `composer check` green. Commit: `feat(iam): add audited permission-sync endpoint`.

## Task 3: The button

**Files:** modify `app/Modules/Iam/resources/js/pages/permissions/Index.tsx`.

- [ ] **Step 1** — add a `usePermissions`-gated "Sync permissions" `Button` in the `PageHeader` `actions` slot; on click `router.post(route('iam.permissions.sync'), {}, { preserveScroll: true })` with a `processing` state (spinner + disabled while in flight). Imports: `@/components/ui/button`, `@/hooks/use-permissions`, `router` from `@inertiajs/react`, a lucide icon.
- [ ] **Step 2** — `npm run types && npm run lint && npm run build` green. Commit: `feat(iam): add Sync permissions button to the permissions page`.

## Task 4: Verify + push

- [ ] Full gate `composer check && npm run types && npm run lint && npm run build`. Update the page subtitle if it still says "synced via permission:sync" CLI-only (optional). Regenerate `docs/endpoints.md` (`php artisan app:endpoints`) so the new route appears; commit if changed.
- [ ] `git push` (updates PR #20). **Do not merge** — PR #20 awaits the author's approval. Report the pushed commits.

---

## Self-Review
Spec coverage: synchronizer + command (T1), permission + route + audited action (T2), gated button (T3), gate + push (T4). No placeholders (code in spec). Types consistent: `sync()` returns `{declared,created,invalid}` used by command + controller; route name `iam.permissions.sync`; permission `permissions.sync`.
