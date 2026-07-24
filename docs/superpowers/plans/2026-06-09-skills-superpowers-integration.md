# Skills × Superpowers Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> NOTE: this plan edits/creates **Markdown skill files** — there is no Pest-testable PHP. "Green" per task means: the edited `SKILL.md` keeps valid `name:` + `description:` frontmatter, no *live* `review-module` reference is left dangling, and `composer check` + `npm run build` still pass (markdown changes don't touch PHP/JS).

**Goal:** Make the 9 project skills compose cleanly with the always-installed `superpowers` plugin (delegate generic process, keep the Laravel delta), rename `review-module` → `review-changes`, disambiguate `add-resource`/`add-action`, standardize spec/plan paths, and add a tracker-agnostic `draft-ticket` skill.

**Architecture:** The 4 overlapping skills shrink to thin adapters that invoke a superpowers skill and add only Laravel-specific requirements; the 5 build skills reference `superpowers:test-driven-development`; a new standalone `draft-ticket` skill emits GitHub-Issue/Jira markdown from a spec. Docs (`CLAUDE.md`, `README.md`, `docs/conventions.md`) are updated to match.

**Tech Stack:** Claude Code skills (Markdown + YAML frontmatter), the `superpowers` plugin. Verification: frontmatter validity, reference grep, `composer check`, `npm run build`. Workflow: branch `feat/skills-superpowers-integration` → PR → squash-merge.

---

## Reference (verified)

Exact superpowers skill names to reference: `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:subagent-driven-development`, `superpowers:requesting-code-review`, `superpowers:finishing-a-development-branch`, `superpowers:test-driven-development`.

**Live vs archive references:** update references in the *live* routing surfaces only — `.claude/skills/*`, `CLAUDE.md`, `README.md`, `docs/conventions.md`. **Do NOT touch** `docs/superpowers/plans/*` or `docs/superpowers/specs/2026-06-09-laravel-modular-ai-template-design.md` / `...-skill-pipeline.md` etc. — those are point-in-time records.

---

## Task 1: Rename `review-module` → `review-changes`

**Files:**
- Rename: `.claude/skills/review-module/` → `.claude/skills/review-changes/`
- Modify: `.claude/skills/review-changes/SKILL.md` (frontmatter + compose pointer)
- Modify (live refs): `.claude/skills/add-resource/SKILL.md`, `.claude/skills/add-action/SKILL.md`, `CLAUDE.md`, `README.md`, `docs/conventions.md` (only those that actually contain `review-module`)

- [ ] **Step 1: Rename the directory**

```bash
git mv .claude/skills/review-module .claude/skills/review-changes
```

- [ ] **Step 2: Update the frontmatter name**

In `.claude/skills/review-changes/SKILL.md`, change the frontmatter:

```
name: review-changes
description: Use when reviewing the changes in a branch/PR against the template's conventions before merge.
```

- [ ] **Step 3: Add the compose pointer**

Immediately after the frontmatter `---` (before the first checklist line), insert:

```markdown
> Run this rubric **via `superpowers:requesting-code-review`** — that skill dispatches the reviewer
> and handles the review mechanics; this skill is the checklist they apply for *this* codebase.

```

- [ ] **Step 4: Update live references to the old name**

Find every live reference and replace `review-module` → `review-changes` (skills + root docs only):

```bash
grep -rl 'review-module' .claude/skills CLAUDE.md README.md docs/conventions.md 2>/dev/null \
  | xargs -r sed -i '' 's/review-module/review-changes/g'
```
(On Linux drop the `''` after `-i`.)

- [ ] **Step 5: Verify no live dangling reference remains**

Run: `grep -rn 'review-module' .claude/skills CLAUDE.md README.md docs/conventions.md`
Expected: **no matches**.

Run: `grep -rn 'review-module' docs/superpowers/plans docs/superpowers/specs/2026-06-09-laravel-modular-ai-template-design.md`
Expected: matches still present (archives intentionally untouched).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(skills): rename review-module to review-changes"
```

---

## Task 2: `feature-brainstorm` → delegate to `superpowers:brainstorming`

**Files:**
- Replace body: `.claude/skills/feature-brainstorm/SKILL.md`

- [ ] **Step 1: Replace the whole file**

Write `.claude/skills/feature-brainstorm/SKILL.md`:

````markdown
---
name: feature-brainstorm
description: Use when turning a rough feature idea into a concrete spec for this Laravel template, before planning or coding.
---

# feature-brainstorm

The Laravel-template entry point for brainstorming a feature. It **delegates the dialogue to
`superpowers:brainstorming`** and adds only the template-specific requirements.

## Steps

1. **Invoke `superpowers:brainstorming`.** It runs the idea → spec conversation (one question at a
   time, approaches, design sections, spec write-up). Do not duplicate that process here.

2. **Ensure the dialogue surfaces these Laravel topics** — raise any the conversation misses:
   - Which **module(s)** — a new one (`create-module`) or an existing one under `app/Modules/`.
   - The **data model** (entities, fields, relationships).
   - **Permissions** in `<resource>.<action>` form (see `docs/conventions.md`).
   - **Auditing** — which events to log, and whether **atomic** (in-transaction, critical) or
     **async** (queued, high-volume).
   - **Routes & React pages**, and whether it is full **CRUD** or a **single operation** (this
     decides the build skill: `add-resource` vs `add-action`).
   - **Edge cases & validation.**

3. **Save the spec to `docs/superpowers/specs/<feature>.md`** (the repo standard — same place as the
   existing specs).

4. **Hand off:** for an implementation plan use `plan-feature`; to draft tracker tickets use
   `draft-ticket`. Both read the spec you just wrote.

Read `docs/conventions.md` for the conventions every spec must respect.
````

- [ ] **Step 2: Verify frontmatter**

Run: `head -4 .claude/skills/feature-brainstorm/SKILL.md`
Expected: starts with `---`, has `name: feature-brainstorm` and a `description:` line.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/feature-brainstorm/SKILL.md
git commit -m "refactor(skills): feature-brainstorm delegates to superpowers:brainstorming"
```

---

## Task 3: `plan-feature` → delegate to `superpowers:writing-plans`

**Files:**
- Replace body: `.claude/skills/plan-feature/SKILL.md`

- [ ] **Step 1: Replace the whole file**

Write `.claude/skills/plan-feature/SKILL.md`:

````markdown
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
     - **Managed entity** (users list / create / edit / delete it) → **`add-resource`**.
     - **Single operation** (approve, export, sync, one endpoint) → **`add-action`**.
     - New module → **`create-module`** first; auditing a write → **`add-audit`**; access gating →
       **`add-permission`**.
   - Every **mutating route** gets a **403-without-permission** Feature test plus happy-path tests
     (see `docs/conventions.md` §3 and `tests/Feature/Users/`).
   - Note the Inertia test quirks: `config(['inertia.testing.ensure_pages_exist' => false])` and
     `$this->withoutVite()` in tests that hit Inertia routes.
   - Every task ends green on `composer check` (and `npm run build` for React work).

4. **Execute** with **`superpowers:subagent-driven-development`** (fresh subagent per task, review
   between tasks). Reviews apply the **`review-changes`** checklist.

Read `docs/conventions.md` before planning.
````

- [ ] **Step 2: Verify frontmatter**

Run: `head -4 .claude/skills/plan-feature/SKILL.md`
Expected: `---`, `name: plan-feature`, `description:`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/plan-feature/SKILL.md
git commit -m "refactor(skills): plan-feature delegates to superpowers:writing-plans"
```

---

## Task 4: `finish-feature` → specialize pointer

**Files:**
- Modify: `.claude/skills/finish-feature/SKILL.md` (add a pointer near the top; keep the prescriptive steps)

- [ ] **Step 1: Insert the specialize pointer**

In `.claude/skills/finish-feature/SKILL.md`, immediately after the frontmatter `---`, insert:

```markdown
> This is the **repo-specific specialization** of `superpowers:finishing-a-development-branch`. That
> skill leaves the integration choice open; here the choice is **fixed**: feature branch → PR →
> **squash-merge** (per `CONTRIBUTING.md`; direct pushes to `main` are blocked, CI `Quality gate` +
> `PR title` must pass). Follow the prescriptive steps below.

```

- [ ] **Step 2: Verify frontmatter unchanged + pointer present**

Run: `head -10 .claude/skills/finish-feature/SKILL.md`
Expected: frontmatter intact, the pointer blockquote present.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/finish-feature/SKILL.md
git commit -m "docs(skills): finish-feature notes it specializes superpowers:finishing-a-development-branch"
```

---

## Task 5: Build skills — TDD reference + add-resource/add-action disambiguation

**Files:**
- Modify: `.claude/skills/add-resource/SKILL.md` (description + cross-ref + TDD ref)
- Modify: `.claude/skills/add-action/SKILL.md` (description + cross-ref + TDD ref)
- Modify: `.claude/skills/create-module/SKILL.md`, `.claude/skills/add-audit/SKILL.md`, `.claude/skills/add-permission/SKILL.md` (TDD ref)

- [ ] **Step 1: Sharpen `add-resource` description**

In `.claude/skills/add-resource/SKILL.md`, replace the `description:` frontmatter line with:

```
description: Use when adding an entity users list, create, edit, and delete (full CRUD with a management screen). For a single operation, use add-action.
```

- [ ] **Step 2: Sharpen `add-action` description**

In `.claude/skills/add-action/SKILL.md`, replace the `description:` frontmatter line with:

```
description: Use when adding one non-CRUD operation (approve, export, sync, a single endpoint). For a managed entity with full CRUD, use add-resource.
```

- [ ] **Step 3: Add the TDD reference to all five build skills**

In each of `add-resource`, `add-action`, `add-audit`, `add-permission`, `create-module` `SKILL.md`, insert this line immediately after the frontmatter `---` (before the first heading/paragraph):

```markdown
> Follow **`superpowers:test-driven-development`** for the TDD discipline (failing test first). The
> Laravel-specific test shapes and file locations are below.

```

- [ ] **Step 4: Verify all five still have valid frontmatter**

Run:
```bash
for s in add-resource add-action add-audit add-permission create-module; do
  echo "$s:"; sed -n '1,3p' .claude/skills/$s/SKILL.md
done
```
Expected: each starts `---` / `name: <s>` / `description: ...`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/add-resource .claude/skills/add-action .claude/skills/add-audit .claude/skills/add-permission .claude/skills/create-module
git commit -m "docs(skills): reference superpowers:TDD and disambiguate add-resource vs add-action"
```

---

## Task 6: New `draft-ticket` skill

**Files:**
- Create: `.claude/skills/draft-ticket/SKILL.md`

- [ ] **Step 1: Create the skill**

Write `.claude/skills/draft-ticket/SKILL.md`:

````markdown
---
name: draft-ticket
description: Use when turning a feature spec into ready-to-paste tracker tickets (GitHub Issue or Jira). Outputs markdown only — never calls an API.
---

# draft-ticket

Turns a feature spec into ready-to-paste tracker tickets. **Markdown only** — this skill never
creates issues via an API. It is a sibling of `plan-feature`: same input (the spec), but a
**team/board** view rather than a dev-execution plan.

## Steps

1. **Input:** a spec at `docs/superpowers/specs/<feature>.md` (from `feature-brainstorm`).

2. **Pick the tracker format:** ask the user (or take it as an argument) — **GitHub Issue** or
   **Jira**.

3. **Choose granularity from the spec's scope, and state why:**
   - A single resource or single operation → **one** ticket (GitHub: a `feature`/`task` issue; Jira:
     a Story/Task).
   - Multiple modules or several resources → **one Epic + N sub-tasks** (one sub-task per
     resource/operation grouping).

4. **Emit the markdown** in the chosen format (templates below), filling `Technical notes` from the
   spec: the module(s), the `<resource>.<action>` permissions, and the audit mode (atomic/async).

5. **Save** the output to `docs/superpowers/tickets/<feature>.md` and also print it in the response
   for copy-paste.

## GitHub Issue format

```markdown
### <imperative title>

**Type:** feature | task

<what & why — 2–4 sentences>

#### Acceptance criteria
- [ ] <observable outcome>

**Technical notes:** module(s), permissions (`<resource>.<action>`), audit (atomic/async)
**Labels:** <module>, <area>
```

For an Epic, add a `#### Sub-tasks` checklist linking each sub-issue title.

## Jira format

```markdown
**Summary:** <imperative title>
**Type:** Story | Task | Sub-task
**Description:** <what & why>

**Acceptance Criteria:**
- [ ] <observable outcome>

**Technical notes:** module(s), permissions (`<resource>.<action>`), audit (atomic/async)
**Labels:** <module>, <area>
**Estimate:** S / M / L
```

For an Epic, emit one Story plus its Sub-task tickets, each in the block above.

Read `docs/conventions.md` so `Technical notes` use the correct module/permission/audit vocabulary.
````

- [ ] **Step 2: Verify frontmatter**

Run: `head -4 .claude/skills/draft-ticket/SKILL.md`
Expected: `---`, `name: draft-ticket`, `description:`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/draft-ticket/SKILL.md
git commit -m "feat(skills): add tracker-agnostic draft-ticket skill"
```

---

## Task 7: Update `CLAUDE.md`, `README.md`, `docs/conventions.md`

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `docs/conventions.md`

- [ ] **Step 1: CLAUDE.md — pipeline + decision rule**

In `CLAUDE.md`, update the skill-pipeline line so it reads (adjust to the file's existing wording):
the build step lists `create-module`, `add-resource`/`add-action`, `add-audit`, `add-permission`;
the review step is **`review-changes`**; and add a one-liner:

```markdown
- Build-skill choice: **managed entity (CRUD) → `add-resource`; single operation → `add-action`**.
- `feature-brainstorm` / `plan-feature` / `review-changes` / `finish-feature` build on the
  `superpowers` skills; `draft-ticket` turns a spec into GitHub/Jira tickets.
```

Also ensure any `review-module` token is now `review-changes` (Task 1 sed already covered live files; confirm).

- [ ] **Step 2: README.md — skill table**

In `README.md`'s skill-pipeline section: rename the `review-module` row to **`review-changes`**, add
a **`draft-ticket`** row (`Spec → ready-to-paste GitHub/Jira tickets`), and add a sentence under the
table:

```markdown
`feature-brainstorm`, `plan-feature`, `review-changes`, and `finish-feature` build on the
`superpowers` plugin (always installed) — they add only the Laravel-specific parts.
**Decision:** managed entity (CRUD) → `add-resource`; single operation → `add-action`.
```

- [ ] **Step 2b: README.md — pipeline diagram**

Update the pipeline diagram block in the README to include the `draft-ticket` branch and the
`review-changes` rename:

```
feature-brainstorm  →  plan-feature  →  create-module
                                         add-resource   (managed entity / CRUD)
                                         add-action     (single operation)
                                         add-audit / add-permission
                                     →  review-changes  →  finish-feature
       └─ draft-ticket  (spec → GitHub/Jira tickets, optional)
```

- [ ] **Step 3: docs/conventions.md — decision rule**

In `docs/conventions.md`, in the CRUD-shape section (§3), add a short note near the top of the
section:

```markdown
**Build-skill choice:** an entity users list/create/edit/delete → use the `add-resource` skill;
a single operation (approve/export/sync/one endpoint) → use the `add-action` skill.
```

- [ ] **Step 4: Verify no live `review-module` token remains**

Run: `grep -rn 'review-module' CLAUDE.md README.md docs/conventions.md .claude/skills`
Expected: **no matches**.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md docs/conventions.md
git commit -m "docs: update pipeline for review-changes, draft-ticket, and superpowers delegation"
```

---

## Task 8: Final verification

**Files:** none (verification only)

- [ ] **Step 1: All skills have valid frontmatter**

Run:
```bash
for d in .claude/skills/*/; do
  n=$(grep -m1 '^name:' "$d/SKILL.md"); desc=$(grep -cm1 '^description:' "$d/SKILL.md")
  echo "$(basename "$d"): ${n:-MISSING} | desc=$desc"
done
```
Expected: 10 skills listed (the 9 originals with `review-changes` instead of `review-module`, plus `draft-ticket`), each with a `name:` and `desc=1`.

- [ ] **Step 2: No dangling live reference; archives preserved**

Run: `grep -rn 'review-module' .claude/skills CLAUDE.md README.md docs/conventions.md`
Expected: no matches.

- [ ] **Step 3: Gate unaffected**

Run: `composer check`
Expected: green (Pint + PHPStan + Pest — markdown changes don't affect PHP).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Confirm directory listing**

Run: `ls .claude/skills`
Expected: `add-action  add-audit  add-permission  add-resource  create-module  draft-ticket  feature-brainstorm  finish-feature  plan-feature  review-changes`

---

## Self-Review

**Spec coverage:**
- §3.1 feature-brainstorm delegate → Task 2 ✅
- §3.2 plan-feature delegate + decision rule → Task 3 ✅
- §3.3 review-changes compose pointer + rename → Tasks 1 ✅
- §3.4 finish-feature specialize → Task 4 ✅
- §3.5 build skills reference TDD → Task 5 ✅
- §4.1 rename review-module → review-changes (live refs only) → Tasks 1, 7 ✅
- §4.2 add-resource/add-action descriptions + decision rule → Tasks 5, 3, 7 ✅
- §5 spec/plan path standardization → Tasks 2, 3 (skills now write docs/superpowers/specs|plans/) ✅
- §6 draft-ticket skill → Task 6 ✅
- §8 CLAUDE.md/README/conventions updates → Task 7 ✅
- §10 acceptance (frontmatter valid, no dangling live refs, gate green) → Task 8 ✅

**Placeholder scan:** every step has concrete content (full file bodies for the adapters + draft-ticket; exact edits otherwise). No TBD/TODO.

**Consistency:** skill names used consistently (`review-changes`, `draft-ticket`); superpowers skill names match the verified list; spec/plan paths are `docs/superpowers/specs|plans/` throughout; the add-resource/add-action decision rule is worded identically in plan-feature, descriptions, CLAUDE.md, conventions.

**Archive safety:** Task 1 and Task 7 greps explicitly scope replacements to live files and assert the archive docs still contain the old name.
