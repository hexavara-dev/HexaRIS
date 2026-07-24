# Package Audit + Endpoint Documentation — Design

**Date:** 2026-06-09
**Status:** Approved (pending user review of this spec)

## Goal

Remove a now-redundant dependency that became confusing after the DataTable filter rework, and
replace the "empty API docs" confusion with a real way to **see every endpoint in the app**.

## Background — package audit (composer only; npm out of scope)

Usage verified by grepping the codebase:

| Package | Real usage | Decision |
|---|---|---|
| **spatie/laravel-query-builder** | **0 references in `app/`** (only `config/query-builder.php` + a stale docblock example). Replaced by `App\Support\Tables\FiltersTableColumns`. | **Remove** |
| **dedoc/scramble** | `/docs/api` + `/docs/api.json` registered, but all module `routes/api.php` are empty → documents nothing. | **Keep** as a ready-to-use facility; clarify it in docs (it lights up when JSON API endpoints are added). No Sanctum / example endpoint now. |
| spatie/laravel-activitylog | `AuditActivity extends Activity`; 13 files use the `App\Audit` layer on top. | Keep |
| spatie/laravel-data | 3 DTOs (User/Role/Audit). | Keep |
| spatie/laravel-permission | 8 files; core RBAC. | Keep |
| tightenco/ziggy | `route()` in JS; provides a full named-route manifest. | Keep |
| inertia, framework, tinker; dev: pint/larastan/pest/sail/pail | Infra/standard. | Keep |

**Why query-builder is confusing now:** after the filter rework there are two filtering idioms in the
repo (spatie's `allowedFilters`/`?filter[x]=` and our `FiltersTableColumns` operator engine). No
controller uses spatie anymore, so keeping it invites mixing the two.

**Why not "Swagger for everything":** Scramble/OpenAPI describe **JSON HTTP APIs** (request/response
schemas). Inertia web routes return page payloads, not JSON resources, so they cannot be meaningfully
represented in OpenAPI. "Know all my endpoints" is therefore a **route inventory** need, which is a
different tool from Scramble.

## Decisions (from brainstorming)

1. **Remove `spatie/laravel-query-builder`** and all its tails.
2. **Keep Scramble + the empty `routes/api.php` stubs** as a ready-to-use API facility (no Sanctum, no
   example endpoint added now). Clarify in README/docs that `/docs/api` is empty until JSON API
   endpoints are added.
3. **Add an endpoint inventory** of *all* routes (Inertia + API): a shared `RouteInventory` service
   feeding (a) an `php artisan app:endpoints` command that writes `docs/endpoints.md`, and (b) a
   browsable, dev-only `/docs/routes` web page.

## Part A — Remove spatie/laravel-query-builder

- `composer remove spatie/laravel-query-builder`.
- Delete `config/query-builder.php`.
- Fix the stale usage docblock in `app/Support/Tables/FiltersTableColumns.php` — the example shows
  `QueryBuilder::for(User::class)->allowedSorts(...)`; change it to plain Eloquent
  (`$query = User::query(); $this->applySorting($query, $request, ['name', 'email']); ...`).
- Update docs that reference the old pattern:
  - `README.md` — remove `spatie/laravel-query-builder` from the Stack list.
  - `docs/conventions.md` §3 — replace the "list pages use QueryBuilder" subsection with the
    `FiltersTableColumns` + DataTable filter-config pattern (column declares
    `filter: { type, options? }`; controller uses `applySorting`/`applyColumnSearch`/`applyColumnFilters`).
  - `.claude/skills/add-resource/SKILL.md` — index controller step uses `FiltersTableColumns`
    (not `QueryBuilder`); React index uses the new typed filter config.
- Verify: `grep -rn "QueryBuilder\|AllowedFilter\|query-builder" app/ config/ docs/ .claude/` returns
  nothing (besides this spec). `composer check` + `npm run build` green.

## Part B — Scramble stays, clarified

- No code change to Scramble; keep `routes/api.php` stubs (empty) in all modules + the `module:make`
  stub.
- `README.md` API section: state that `/docs/api` (Scramble) documents the **JSON API surface**, which
  is empty until you add endpoints to a module's `routes/api.php` (and that those need an API auth
  guard such as Sanctum — a future addition, intentionally not bundled).
- `docs/getting-started.md`: same one-line clarification.

## Part C — Endpoint inventory

### C1. `App\Support\Docs\RouteInventory` (shared unit)

- Public method `entries(): array<int, array{methods: string, uri: string, name: ?string, permission: ?string, action: string}>`.
- Source: `Route::getRoutes()`. For each route collect HTTP methods (joined, drop `HEAD`), URI,
  name, controller action (`getActionName()`), and the **permission** parsed from a `can:<perm>`
  entry in `gatherMiddleware()`.
- **Filter to app routes only:** include a route iff its action class starts with `App\` (i.e.
  `str_starts_with($route->getActionName(), 'App\\')`). This excludes Scramble's `/docs/api`,
  Ignition, storage, and other vendor/framework routes from the inventory.
- Sort by URI for stable output.

### C2. `php artisan app:endpoints` command

- `App\Console\Commands\GenerateEndpointDocs` with signature `app:endpoints`.
- Renders `RouteInventory::entries()` to **`docs/endpoints.md`**: a title, a generated-on note
  (timestamp passed via the command, not `now()` in the service, to keep the service pure), and a
  Markdown table `| Method | URI | Name | Permission | Controller |`.
- Prints a one-line summary (`Wrote docs/endpoints.md (N endpoints).`).

### C3. Browsable `/docs/routes` page (dev-only)

- Route in `routes/web.php`: `Route::middleware(['web', 'auth'])->get('/docs/routes', RouteDocsController::class)->name('docs.routes');`
- `App\Http\Controllers\RouteDocsController::__invoke(Request $request): Response` — `abort_unless(app()->environment(['local', 'development']), 404)` (dev-only; never in production), then
  `Inertia::render('docs/routes', ['routes' => app(RouteInventory::class)->entries()])`.
- FE page `resources/js/pages/docs/routes.tsx` — `AppLayout` + `PageHeader("Routes", "All app endpoints — dev only")` + a **lightweight client-side table** (a search `Input` filtering across uri/name/permission + a plain `<table>` using the shadcn table primitive). Columns: Method, URI, Name, Permission, Controller. (Deliberately not the server-side `DataTable`: the list is small and static, so client-side search/sort avoids server filtering plumbing for a dev tool.)
- Not added to the sidebar nav (dev tool, discoverable via the docs).

## Testing

- `tests/Unit/RouteInventoryTest.php` — `entries()` includes a known app route (`users.index`),
  excludes the Scramble docs route (`scramble.docs.ui`), and extracts the `can:` permission for a
  gated route (e.g. `users.store` → `users.create`).
- `tests/Feature/EndpointDocsCommandTest.php` — running `app:endpoints` writes `docs/endpoints.md`
  containing `users.index`. (Use a temp path or assert the file then restore — write to the real
  `docs/endpoints.md`; the test asserts content and is idempotent.)
- `tests/Feature/RouteDocsPageTest.php` — authenticated user in the testing env (treated as non-prod)
  gets `200` and the Inertia component `docs/routes` with a non-empty `routes` prop; an unauthenticated
  request is redirected to login.
- Whole suite + `composer check` + `npm run build` + `npx tsc --noEmit` green after Part A removal.

## Out of scope

- npm / frontend package audit (composer only, per the user).
- Adding Sanctum / API token auth / real JSON API endpoints (deferred; Scramble stays ready).
- Removing activitylog, data, permission, ziggy (all in active use).
- Auto-running `app:endpoints` in CI / a `--check` drift guard (could be a later addition).

## Risks

- **Hidden query-builder usage:** mitigated by the grep verification step before removal.
- **RouteInventory noise:** the `App\` action filter must be correct so the inventory shows app
  endpoints, not framework routes — covered by the exclude-Scramble unit test.
- **/docs/routes exposure:** gated to `auth` + non-production; it lists route structure only (no data).
