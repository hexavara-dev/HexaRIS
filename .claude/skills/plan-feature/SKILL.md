---
name: plan-feature
description: Use when turning a feature spec into an ordered, testable implementation task list, before coding.
---

# plan-feature

The Laravel-template entry point for planning. It **delegates plan-writing to
`superpowers:writing-plans`** and adds the template-specific task shape.

## Steps

1. **Input:** a spec at `docs/superpowers/specs/<feature>.md` (from `feature-brainstorm`).

2. **Invoke `superpowers:writing-plans`** to produce the ordered, TDD, bite-sized plan, and save it
   to `docs/superpowers/plans/<feature>.md`.

3. **Apply these Laravel deltas to the plan:**
   - Each task names the **build skill** and its **acceptance check**. Decision rule:
     - A module is a **bounded context** that may own several resources — pick the context first
       (existing like `Iam`, or new).
     - **New bounded context** → **`create-module`** first (only when no existing context fits).
     - **Managed entity** (users list / create / edit / delete it) → **`add-resource`**, adding the
       resource into the chosen context — not a new module per entity.
     - **Single operation** (approve, export, sync, one endpoint) → **`add-action`**.
     - Auditing a write → **`add-audit`**; access gating → **`add-permission`**.
   - Every **mutating route** gets a **403-without-permission** Feature test plus happy-path tests
     (see `docs/conventions.md` §3 and `tests/Feature/Users/`).
   - Note the Inertia test quirks: `config(['inertia.testing.ensure_pages_exist' => false])` and
     `$this->withoutVite()` in tests that hit Inertia routes.
   - Every task ends green on `composer check` (and `npm run build` for React work).

4. **Execute** with **`superpowers:subagent-driven-development`** (fresh subagent per task, review
   between tasks). Reviews apply the **`review-changes`** checklist.

Read `docs/conventions.md` before planning.
