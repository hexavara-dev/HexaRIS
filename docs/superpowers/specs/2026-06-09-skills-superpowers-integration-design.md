# Skills × Superpowers Integration — Design

**Date:** 2026-06-09
**Status:** Approved (design phase)

## 1. Goal

Combine the project-local skill pipeline (`.claude/skills/`) with the always-available
`superpowers` plugin so there is **no redundant process logic**, the skills are **easy to
understand and pick correctly**, and add one new **tracker-ticket** skill. The named, junior-
friendly entry points are preserved; only the *generic* process work is delegated to superpowers.

Assumption (confirmed): **superpowers is always installed** in every environment these skills run
in, so project skills may delegate to it.

## 2. Current state

Nine project skills exist: `feature-brainstorm`, `plan-feature`, `create-module`, `add-resource`,
`add-action`, `add-audit`, `add-permission`, `review-module`, `finish-feature`. Four overlap with
superpowers; five are unique Laravel-domain skills.

| Project skill | Superpowers overlap | Handling |
|---|---|---|
| `feature-brainstorm` | `superpowers:brainstorming` | **Delegate** |
| `plan-feature` | `superpowers:writing-plans` | **Delegate** |
| `review-module` | `superpowers:requesting-code-review` | **Compose** (rubric, not redundant) |
| `finish-feature` | `superpowers:finishing-a-development-branch` | **Specialize** |
| `create-module`, `add-resource`, `add-action`, `add-audit`, `add-permission` | — none — | **Keep**; reference `superpowers:test-driven-development` |

## 3. Composition strategy (B — Adapter / delegate)

Each overlapping skill keeps its name and frontmatter (so the entry point survives) but its body is
reduced to **invoke the superpowers skill + contribute only the Laravel delta**.

### 3.1 `feature-brainstorm` → delegate to `superpowers:brainstorming`
Body becomes: invoke `superpowers:brainstorming`; ensure the dialogue surfaces the Laravel topics
(which module(s) — new via `create-module` or existing; data model; permissions in
`<resource>.<action>`; audit events and whether atomic/async; routes & React pages; edge cases);
save the spec to **`docs/superpowers/specs/<feature>.md`** (see §5); hand off to `plan-feature`.
Remove the duplicated "ask one question at a time" process text — that lives in superpowers.

### 3.2 `plan-feature` → delegate to `superpowers:writing-plans`
Body becomes: invoke `superpowers:writing-plans` to produce the task plan at
**`docs/superpowers/plans/<feature>.md`**; add the Laravel deltas — each task names the build skill
(`create-module` / `add-resource` / `add-action` / `add-audit` / `add-permission`), its acceptance
check, and the **403-test-per-mutation** shape; execute via `superpowers:subagent-driven-development`.
Include the build-skill **decision rule** (§4.2). Remove duplicated generic plan-writing prose.

### 3.3 `review-changes` (renamed) → compose with `superpowers:requesting-code-review`
This skill is the **rubric** (what to check in *this* codebase: authorization on every mutation,
no secret leakage in DTOs/audit, 403 tests, audit coverage, README accuracy, gate + build green).
It is **not** redundant with the superpowers review skills, which govern *how* to run a review. Add
one line: run this rubric via `superpowers:requesting-code-review` — that skill dispatches the
reviewer; this skill is what they apply. Keep the checklist body.

### 3.4 `finish-feature` → specialize `superpowers:finishing-a-development-branch`
The generic skill presents open integration options; this repo's choice is **fixed**: feature branch
→ PR → **squash-merge** (per `CONTRIBUTING.md`; Lefthook blocks direct main push; CI `Quality gate`
+ `PR title` required). Keep the prescriptive steps; add a pointer that this is the repo-specific
instance of `superpowers:finishing-a-development-branch`.

### 3.5 Build skills → reference `superpowers:test-driven-development`
`create-module`, `add-resource`, `add-action`, `add-audit`, `add-permission` keep their unique
Laravel recipes but replace inline TDD prose with a reference to `superpowers:test-driven-development`
for the discipline, keeping the Laravel-specific **test shapes** (file locations, 403-per-mutation,
the `withoutVite()` / `ensure_pages_exist=false` Inertia test quirks).

## 4. Naming & clarity fixes

### 4.1 Rename `review-module` → `review-changes`
`review-module` overpromises (it runs on a diff/PR, not a whole module). Rename the directory and
the frontmatter `name`, and update every **live, routing** reference — the ones that point a user
at the skill: `CLAUDE.md`, `README.md`, `docs/conventions.md`, and the other skills
(`plan-feature`, `finish-feature`, `add-resource`, `add-action`). **Leave the completed Plan 1–5
spec/plan archives unchanged** — they are point-in-time records of what was built (as `review-module`)
and rewriting them would falsify history. "Zero dangling references" in §10 means zero *live*
references, not the historical archive.

### 4.2 Disambiguate `add-resource` vs `add-action` (keep the names)
The Laravel terms stay (familiar to Laravel devs); the ambiguity is removed via **descriptions +
an explicit decision rule**:
- `add-resource` description → *"Use when adding an entity users **list, create, edit, and delete**
  (full CRUD with a management screen). For a single operation, use `add-action`."*
- `add-action` description → *"Use when adding **one** non-CRUD operation (approve, export, sync, a
  single endpoint). For a managed entity, use `add-resource`."*
- **Decision rule** added to `plan-feature`, `CLAUDE.md`, and `docs/conventions.md`:
  **managed entity → `add-resource`; single operation → `add-action`.**

## 5. Spec / plan location reconciliation

The project skills currently write to `docs/specs/` and `docs/plans/`, but `superpowers` (and the
repo's actual specs/plans) use `docs/superpowers/specs/` and `docs/superpowers/plans/`. Standardize
the project skills on **`docs/superpowers/specs/`** and **`docs/superpowers/plans/`** so delegating
to superpowers does not fight the convention. Update `feature-brainstorm` and `plan-feature`
accordingly.

## 6. New skill: `draft-ticket`

A tracker-agnostic skill that turns a spec into ready-to-paste tracker ticket(s). Markdown only —
**never** calls an API.

- **Name:** `draft-ticket` (`.claude/skills/draft-ticket/SKILL.md`).
- **Description:** *"Use when turning a feature spec into ready-to-paste tracker tickets (GitHub
  Issue or Jira). Outputs markdown only."*
- **Input:** the spec at `docs/superpowers/specs/<feature>.md` (from `feature-brainstorm`).
- **Position:** sibling of `plan-feature`, branching off the spec — a **team/board** view, distinct
  from `plan-feature`'s dev-execution view. Not part of the build path.
- **Tracker:** ask (or accept as arg) which format — **GitHub Issue** or **Jira**.
- **Granularity (adaptive to the spec's scope):** single resource/endpoint → **one** Story/Task
  issue; multiple modules/resources → **one Epic + N sub-tasks**. The skill states the rationale.
- **Output:** print the markdown and save it to **`docs/superpowers/tickets/<feature>.md`**.

**GitHub Issue format:**
```markdown
### <imperative title>

**Type:** feature | task

<what & why — 2–4 sentences>

#### Acceptance criteria
- [ ] <observable outcome>

**Technical notes:** module(s), permissions (`<resource>.<action>`), audit (atomic/async)
**Labels:** <module>, <area>
```

**Jira format:**
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

- **Standalone:** no superpowers equivalent to delegate to (like the build skills).

## 7. Pipeline (after this work)

```
feature-brainstorm  → superpowers:brainstorming           → spec
   ├─ plan-feature  → superpowers:writing-plans            → plan
   │     └─ build: create-module / add-resource | add-action / add-audit / add-permission  (TDD)
   │           └─ review-changes  (via superpowers:requesting-code-review)
   │                 └─ finish-feature  (specializes superpowers:finishing-a-development-branch)
   └─ draft-ticket  → GitHub Issue / Jira markdown         ← optional, for the team board
```

## 8. Cross-cutting documentation updates

- `CLAUDE.md`: pipeline list reflects `review-changes` + `draft-ticket`; the add-resource/add-action
  decision rule; note that brainstorm/plan/review/finish delegate to superpowers.
- `README.md`: skill-pipeline table updated (rename + new skill + delegation note).
- `docs/conventions.md`: the decision rule; spec/plan location standardized.

## 9. Out of scope

- Creating issues via API/MCP (`gh issue create`, Jira API) — markdown only by decision.
- Renaming the other skills (`feature-brainstorm`, `finish-feature`, etc.) — minimal-churn naming.
- Changing the build skills' Laravel recipes beyond the TDD reference + description tweaks.

## 10. Acceptance

- The 4 overlapping skills delegate/compose/specialize as in §3 with no duplicated process prose.
- `review-module` is renamed to `review-changes` with **zero** dangling references.
- `add-resource`/`add-action` descriptions disambiguate and cross-reference; the decision rule
  appears in `plan-feature`, `CLAUDE.md`, `docs/conventions.md`.
- `feature-brainstorm` / `plan-feature` write to `docs/superpowers/specs|plans/`.
- `draft-ticket` exists, emits valid GitHub-Issue and Jira markdown with adaptive granularity, saves
  to `docs/superpowers/tickets/<feature>.md`, and never calls an API.
- All skill `SKILL.md` files have valid `name` + `description` frontmatter; `composer check` and
  `npm run build` stay green (skills are markdown — no PHP/JS impact).
