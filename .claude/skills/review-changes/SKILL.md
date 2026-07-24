---
name: review-changes
description: Use when reviewing the changes in a branch/PR against the template's conventions before merge.
---

> Run this rubric **via `superpowers:requesting-code-review`** — that skill dispatches the reviewer
> and handles the review mechanics; this skill is the checklist they apply for *this* codebase.

Run this checklist top-to-bottom. Report every item as ✅ or ❌ with `file:line`. Block the PR on any ❌ — no partial merges. Pay adversarial attention to **authorization** (every mutation gated) and **secret leakage** (no password/token in DTOs or audit snapshots).

---

## Checklist

### 1. Permission declarations

- [ ] Every permission in `app/Modules/<Name>/permissions.php` follows the `<resource>.<action>` format enforced by `PermissionRegistry::isValidName()` (pattern: `/^[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9]*$/`).
- [ ] Canonical actions are `viewAny | view | create | update | delete`; domain verbs (`approve`, `export`) are acceptable.
- [ ] Run `php artisan permission:sync` locally — it must exit `0`. A non-zero exit means a malformed name exists; fix before merge.

Where to look: `app/Modules/<Name>/permissions.php` — compare with `app/Modules/Iam/permissions.php` as the reference.

---

### 2. Route authorization — every route, no exceptions

- [ ] Every route file (`routes/web.php`, `routes/api.php`) is wrapped in `Route::middleware('auth')->group(...)`.
- [ ] Every route has a `->middleware('can:<resource>.<action>')` call chained directly on it — **not** delegated to `FormRequest::authorize()`.
- [ ] **Adversarial focus:** audit every mutation (POST/PUT/PATCH/DELETE) for a missing `can:` middleware. An unprotected mutation is a critical authorization hole.
- [ ] `FormRequest::authorize()` returns `true` in every request class — the gate is on the route, not the form request.

Where to look: `app/Modules/<Name>/routes/web.php` and `routes/api.php` — compare with `app/Modules/Iam/routes/web.php` as the reference.

---

### 3. Feature tests — 403s and happy paths

- [ ] A 403 test exists for **every mutation** (store, update, destroy): a user without the required permission receives `->assertForbidden()`.
- [ ] A happy-path test exists for every mutation: a user with the permission receives the expected redirect or 200.
- [ ] Read endpoints (`index`, `show`) also have a 403 test.
- [ ] Test files live in `tests/Feature/<ModuleName>/` (not inside the module directory).

Where to look: `tests/Feature/Users/UserStoreTest.php`, `UserUpdateTest.php`, `UserDestroyTest.php`, `UserIndexTest.php` as the reference pattern. Every `it('forbids ...')` test is non-negotiable.

---

### 4. Auditing & secret safety

- [ ] Any model that handles sensitive writes uses the `IsAudited` trait (`App\Audit\Concerns\IsAudited`) **or** calls `AuditLogger::atomic()` / `AuditLogger::async()` explicitly for Query Builder / domain events.
- [ ] All sensitive fields (`password`, API tokens, secrets) are declared in the model's `$hidden` array. The `IsAudited` trait strips `$hidden` fields before writing — but they must be listed there first.
- [ ] **Adversarial focus:** grep the DTO classes for `password`, `token`, `secret`, `api_key`. None of these must appear as a constructor parameter or property. DTOs must not expose `$hidden` model attributes.

Where to look: `app/Modules/<Name>/Models/`, `app/Modules/<Name>/Data/` — compare with `app/Modules/Iam/Data/UserData.php` (no `password` field) and `App\Models\User` (`IsAudited` trait, `$hidden = ['password', 'remember_token']`).

---

### 5. React pages — namespace and TypeScript

- [ ] Pages live at `app/Modules/<Name>/resources/js/pages/<Page>.tsx`.
- [ ] Controllers reference them with the `Name::` namespace prefix: `Inertia::render('Name::pages/Index', [...])`.
- [ ] TypeScript types (interfaces or type aliases) are present for every prop the page receives — no untyped `any` for DTO shapes.
- [ ] Standard two-file shape: `Index.tsx` (list + delete) and `Form.tsx` (create/edit with `useForm`).

Where to look: `app/Modules/Iam/resources/js/pages/users/Index.tsx` and `users/Form.tsx` as the reference; controller `Inertia::render` calls in `app/Modules/Iam/Http/Controllers/UserController.php`.

---

### 6. Module README

- [ ] `app/Modules/<Name>/README.md` exists.
- [ ] Lists every declared permission (matching `permissions.php` exactly).
- [ ] Lists every exposed route (name, method, path, and gating permission).
- [ ] No stale entries — permissions or routes removed from code must be removed from the README too.

Where to look: `app/Modules/Iam/README.md` and `app/Modules/Audit/README.md` as the reference.

---

### 7. Quality gate

- [ ] `composer check` (Pint + PHPStan level 6 + Pest) exits `0` locally on the PR branch.
- [ ] `npm run build` exits `0` (Vite asset build must succeed).
- [ ] The `Quality gate` GitHub Actions workflow is green on the PR.
- [ ] The `PR title` CI job is green — title must be a valid Conventional Commit (`feat(scope): summary`, `fix(scope): summary`, etc.).

---

### 8. YAGNI / scope hygiene

- [ ] No dead code: unused controllers, unused routes, unused actions, unused imports.
- [ ] No unrelated changes bundled in — scope is limited to the feature described in the PR title.
- [ ] No commented-out code blocks left in.

---

## Verdict

If any item is ❌, **block the merge**. List every ❌ with `file:line` in the PR review comment. A PR with one authorization hole or one unprotected mutation must not land on `main`.
