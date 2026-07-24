---
name: finish-feature
description: Use when a feature is implemented and reviewed, to ship it via the project's PR workflow.
---

> This is the **repo-specific specialization** of `superpowers:finishing-a-development-branch`. That
> skill leaves the integration choice open; here the choice is **fixed**: feature branch → PR →
> **wait for the author's review + explicit approval** → **squash-merge** (per `CONTRIBUTING.md`;
> direct pushes to `main` are blocked, CI `Quality gate` + `PR title` must pass). Follow the
> prescriptive steps below.
>
> ### 🛑 Approval gate — never auto-merge
> After opening the PR and CI passing, **STOP**. Do **not** run `gh pr merge`. Hand the PR to the
> author (the user) for review and wait for their **explicit approval** ("approved" / "merge it" /
> "lgtm" / "gas merge"). **CI being green is not approval.** Merging without the author's explicit
> go-ahead is a process violation, even when every check is green.

Follow every step in order. Do not skip or reorder — each step's output feeds the next. The full workflow is documented in `CONTRIBUTING.md`.

---

## 1. Verify you are on a feature branch

```bash
git branch --show-current
```

Must NOT be `main`. If it is, stop immediately — the Lefthook pre-push hook and the `.claude/hooks/guard-main.sh` Claude Code hook both block commits and pushes to `main`. Create a feature branch first:

```bash
git checkout -b feat/<short-name>   # or fix/, chore/, docs/, ci/, refactor/, test/
```

Branch names correspond to the Conventional Commit type used in the PR title.

---

## 2. Run the local quality gate

Both commands must exit `0` before you commit.

```bash
composer check      # Pint (style) + PHPStan level 6 + Pest
npm run build       # Vite asset build
```

`composer check` is an alias for `@pint && @stan && @test` (see `composer.json` `scripts`). If either fails, fix the issues first — do not proceed.

---

## 3. Commit with a Conventional Commit message

```bash
git add <specific files>   # never `git add -A` — avoid accidentally staging .env or binaries
git commit -m "feat(scope): imperative summary of what changed"
```

Conventional Commit types: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`, `perf`, `build`.

The commit message on the branch is not what lands on `main` — the PR title becomes the squash commit. But each branch commit should still be readable and intentional.

---

## 4. Push the branch

```bash
git push -u origin <branch-name>
```

The Lefthook **pre-push** hook fires automatically and runs Pint `--test` + PHPStan. If it fails, the push is blocked — fix the issues, re-commit, and push again. Do NOT use `--no-verify` unless in a genuine emergency (CI is the backstop, but hooks exist for a reason).

---

## 5. Create the PR with a Conventional Commit title

```bash
gh pr create --title "feat(scope): imperative summary" --body "$(cat <<'EOF'
## What

Short description of what this PR does and why.

## Test plan

- [ ] `composer check` green
- [ ] `npm run build` green
- [ ] Manual smoke test on ...
EOF
)"
```

**The PR title is critical** — because this repo uses squash-and-merge only, the PR title becomes the single commit on `main`. The CI `PR title` job enforces that it is a valid Conventional Commit. An invalid title will block the merge.

Valid PR title examples (from `CONTRIBUTING.md`):

```
feat(users): add user management module
fix(audit): write log inside transaction
docs: add CLAUDE.md and conventions source of truth
```

---

## 6. Wait for CI to pass

Two required CI jobs must be green before merging:

- **`Quality gate`** — full `composer check` + Prettier + ESLint + `npm run build`.
- **`PR title`** — validates the title is a valid Conventional Commit.

Watch status with:

```bash
gh pr checks <PR-number> --watch
```

If either job fails, fix the cause, push another commit to the branch, and wait again.

---

## 7. Stop for review — wait for the author's approval 🛑

**Do NOT merge yet.** Opening the PR with green CI is the handoff point, not the finish line.

- Report: the **PR URL**, a one-line summary of the change, and the CI status (`Quality gate` +
  `PR title` green).
- Then **stop and wait.** Only a clear go-ahead from the author (the user) — "approved", "merge it",
  "lgtm", "gas merge" — unlocks the next step. **CI passing is not approval.**
- If the author requests changes, address them on the branch, push, let CI re-run, and return here.

Never run `gh pr merge` without that explicit approval.

---

## 8. Squash and merge — only after approval

Once the author has explicitly approved:

```bash
gh pr merge <PR-number> --squash --delete-branch
```

Squash-and-merge is the **only allowed merge strategy** — merge commits and rebase-merge are disabled in the repo settings. The `--delete-branch` flag removes the remote branch immediately after merge (it would be auto-deleted anyway, but being explicit is cleaner).

---

## 9. Sync main and clean up locally

```bash
git checkout main
git pull
git branch -d <branch-name>   # delete the local branch (already gone on remote)
```

`main` now has the single squash commit from your PR. The branch is gone locally and remotely. The cycle is complete.

---

## Quick reference

| Step | Command | Blocks on failure? |
|------|---------|-------------------|
| Gate | `composer check && npm run build` | Yes — fix before committing |
| Push | `git push -u origin <branch>` | Yes — Lefthook pre-push |
| CI | `gh pr checks <n> --watch` | Yes — must be green before merge |
| **Review** | **Wait for the author's explicit approval** | **Yes — never auto-merge; CI-green ≠ approval** |
| Merge | `gh pr merge <n> --squash --delete-branch` *(only after approval)* | Squash only |
