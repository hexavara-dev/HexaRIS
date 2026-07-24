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
   - Which **bounded context (module)** — a new one (`create-module`) or an existing one under
     `app/Modules/` (e.g. add the resource into `Iam`). A module may own several resources; a new
     entity does not require a new module.
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
