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
