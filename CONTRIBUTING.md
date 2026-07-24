# Contributing

## Branching

- **Never commit directly to `main`.** Always branch:
  ```bash
  git checkout main && git pull
  git checkout -b feat/<short-name>     # or fix/, chore/, docs/, ci/, refactor/, test/
  ```
- Keep branches small and focused — one logical change per PR.

## Commit & PR titles — Conventional Commits

Because we **squash and merge**, the **PR title becomes the single commit on `main`**. So the PR
title MUST follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <imperative summary>
```

Types: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`, `perf`, `build`.

Examples: `feat(blog): add post CRUD module`, `fix(audit): write log inside transaction`.

The PR **body** becomes the squash commit body — write a short summary of what and why.

## Merge strategy: Squash and Merge (only)

This repo allows **only squash-and-merge**. Merge commits and rebase-merge are disabled.

**Why:**
- Linear, readable history — one clean commit per PR on `main`.
- Each `main` commit maps 1:1 to a reviewable PR (easy to revert, easy to `git bisect`).
- Work-in-progress commits on the branch don't pollute `main`.

After merge, the source branch is **deleted automatically**.

## Merge requires the author's approval (no auto-merge) 🛑

**Opening a PR does not authorize merging it.** After the PR is up and CI is green, **stop and wait
for the PR author to review and explicitly approve the merge.** A green `Quality gate` is a
prerequisite for merging, **not** approval to merge.

- Whoever opens the PR (including an AI agent running `finish-feature`) must **hand it back for
  review** and wait for a clear go-ahead ("approved" / "merge it" / "lgtm") before running
  `gh pr merge`.
- This applies even when every check is green and the change looks trivial.
- If review surfaces changes, push them to the branch, let CI re-run, and request approval again.

## Pre-merge guards (checklist)

Before merging a PR, confirm:

- [ ] **Local gate green:** `composer check` (Pint + PHPStan + Pest) passes.
- [ ] **Frontend clean:** `npm run format:check` and `npx eslint .` pass; `npm run build` succeeds.
- [ ] **CI green:** the `Quality gate` workflow passed on the PR.
- [ ] **PR title** is a valid Conventional Commit (it becomes the `main` commit).
- [ ] **Scope is focused** — no unrelated changes bundled in.
- [ ] **Branch is up to date** with `main` (rebase/merge `main` in if it moved).
- [ ] **Reviewed** — self-review at minimum; peer review when another dev is available.
- [ ] **Author approved the merge** — the PR author has explicitly given the go-ahead. **Never merge
      on CI-green alone.**

## Automated guards (hooks)

Three layers enforce the guards above, so they don't rely on memory:

**1. Git hooks (Lefthook) — every dev, locally.** Auto-installed on `npm install` (via the
`prepare` script); manual install: `npx lefthook install`.
- **pre-commit:** Pint, Prettier, ESLint on *staged* files (auto-fixes formatting).
- **pre-push:** blocks pushing to `main`, then runs Pint `--test` + PHPStan (fast static checks).

**2. CI (GitHub Actions) — the comprehensive gate.** On every PR: full `composer check`
(Pint + PHPStan + **Pest**) + Prettier + ESLint + asset build, plus a **PR-title** check that the
title is a valid Conventional Commit (it becomes the squash commit).

**3. Claude Code hook — Claude sessions.** `.claude/settings.json` runs
`.claude/hooks/guard-main.sh`, which blocks `git commit`/`git push` to `main` from Claude.

> **Bypass & enforcement:** Local hooks are bypassable with `git ... --no-verify` — use only in
> genuine emergencies. CI is the backstop. The only *un-bypassable* gate is server-side branch
> protection, which a free GitHub account can't enable on a private repo. Until the repo moves to
> a paid **Organization**, treat these hooks as the enforcement. After migrating, add a branch
> protection rule on `main` (require the `Quality gate` + `PR title` checks) to close the
> `--no-verify` loophole.

## Typical flow

```bash
git checkout -b feat/blog
php artisan module:make Blog
php artisan permission:sync
# ...implement, write tests...
composer check                      # must be green
git push -u origin feat/blog
gh pr create                        # CI runs the Quality gate
# CI green → request review → WAIT for author approval → Squash and merge → branch auto-deleted
git checkout main && git pull
```

## Modules

Each feature is a self-contained, portable module under `app/Modules/<Name>/`. See the
[README](README.md) and the design spec in [`docs/superpowers/specs/`](docs/superpowers/specs/).
