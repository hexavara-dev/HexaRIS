# In-app API Explorer — Design

**Date:** 2026-06-11
**Status:** Approved (pending user review of this spec)

## Goal

Turn the read-only `/docs/routes` inventory into an **interactive, testable API Explorer**: pick a
route, fill its inputs, send a real request over the live dev session, and inspect the response —
without leaving the app and without external tooling. The request inputs are **documented from each
route's `FormRequest` rules**, so the page also explains what every endpoint expects.

## Why not Scramble

`dedoc/scramble` (installed, `/docs/api`) is the right tool for a **stateless JSON API with token
auth**, not for this app's **session-based Inertia web routes**:

- Its "Try It" UI (Stoplight/Scalar) sends plain requests — no `X-Inertia` header (so a GET returns
  raw HTML, not the props JSON) and no Laravel `XSRF-TOKEN` handling (so every mutation 419s on CSRF).
- It infers responses from return types / `JsonResource`; controllers return `Inertia::render(...)`,
  which it can't model, so response docs come out empty.

Scramble **stays** for the day real JSON API endpoints are added to a module's `routes/api.php`
(`/docs/api` lights up automatically). This feature targets the routes that exist **today**
(`users`, `rbac`, `audit`), which are all Inertia web routes. The two are complementary, not
competing. (Decision recorded after the user reviewed Scramble directly.)

## Decisions (from brainstorming)

1. **Target:** the existing Inertia **web routes** (not a new JSON API).
2. **Form factor:** an **in-app tester** built into `/docs/routes` (not an exported Postman/Bruno
   collection).
3. **Methods:** **all** methods sendable; mutating requests (POST/PUT/PATCH/DELETE) are **guarded**
   by a per-send confirm dialog + auto-attached CSRF token.
4. **Input intelligence:** **introspect each route's `FormRequest` `rules()`** to render a labeled
   field form with the validation rules shown; path params auto-detected; raw-JSON fallback.
5. **Transport:** **direct browser request** (Approach A) — the page fires the request itself using
   the app's axios; no backend proxy.

## Architecture

The backend only **enriches the route inventory** with per-route input schema. The actual request is
sent **client-side** from the page to the real route, reusing the browser's session cookie for auth
and axios's automatic `XSRF-TOKEN` handling for CSRF. Adding `X-Inertia: true` +
`X-Inertia-Version` makes web routes answer with a JSON page object (`{component, props, url,
version}`) instead of HTML, so the response is inspectable.

```
/docs/routes page (dev/local + auth)
   │  enriched routes prop (inventory + pathParams + body schema)
   ▼
Request builder (path/query/body inputs from FormRequest rules)
   │  axios request to the REAL route URL:
   │    credentials: same-origin (session cookie = auth)
   │    X-Inertia + X-Inertia-Version  → JSON props back
   │    X-XSRF-TOKEN (axios auto)       → mutations pass CSRF
   │    mutating method → ConfirmDialog first
   ▼
Response viewer (status, duration, props JSON, headers, errors)
```

## Part A — Backend: enrich the inventory

### A1. `App\Support\Docs\FormRequestInspector`

A self-contained unit that, given a controller action string (`Class@method`) or a `Route`, returns
the input schema for that route.

- Public method:
  `forRoute(Route $route): array{ pathParams: array<int,string>, body: array<string, array{rules: array<int,string>, required: bool}>|null }`.
- **Path params:** parse the route URI for `{param}` / `{param?}` segments (optional flagged).
- **Body schema:**
  1. Resolve the controller action; reflect the target method's parameters.
  2. Find the first parameter whose type is a subclass of
     `Illuminate\Foundation\Http\FormRequest`. If none → `body = null`.
  3. Instantiate it (`new $class`), set an empty route resolver so `$this->route(...)` returns
     `null` safely, and call `rules()` **inside a try/catch**. Any throwable → `body = null`
     (best-effort; never breaks the page).
  4. Normalize each field: rules may be a `|`-string, an array of strings, or contain `Rule`
     objects. Coerce each entry to a string (`(string) $rule` when `Stringable`/has `__toString`,
     else the class basename). `required` = the field's rule set contains `required`.
  5. Skip nested wildcard keys (`roles.*`) from the top-level field list but keep them available as
     a note on the parent field if present (simple: list them as their own read-only rows).
- **No DB access:** building the rule array does not execute `unique`/`exists` (those validate
  later), so this is side-effect free.

### A2. `RouteDocsController` enrichment

- For each `RouteInventory::entries()` row, attach `pathParams` + `body` from `FormRequestInspector`.
- Continue to `abort_unless(app()->environment(['local', 'development', 'testing']), 404)` and run
  under `auth`.
- Pass the enriched array as the `routes` prop to `Inertia::render('docs/routes', ...)`.
- `RouteInventory` itself is **unchanged** (the `app:endpoints` markdown command stays lightweight).

## Part B — Frontend: `/docs/routes` becomes the API Explorer

### B1. Page (`resources/js/pages/docs/routes.tsx`)

- Master-detail layout inside `AppLayout`. Heading: **"API Explorer"**, subtitle "Send requests to
  your app's routes — dev only". URL stays `/docs/routes`.
- **Left:** the existing filterable route list (search across uri/name/permission). Selecting a row
  loads it into the request panel.
- **Right:** `RequestPanel` for the selected route.
- Below the panel: `ResponseViewer` for the last response.

### B2. `components/docs/request-panel.tsx`

- Shows method badge + URI with **inline path-param inputs** (one per `{param}`).
- **Query params:** add/remove key–value rows.
- **Body:** when `body` schema is present, render a labeled field per key with a **rule hint**
  (e.g. `required · email · max:255`) and a required marker; a **"Raw JSON" toggle** swaps to a
  textarea pre-filled from the field values. When `body` is `null`, show only the raw JSON editor.
- **Permission:** show the route's `permission` as a badge; if the current user lacks it
  (`usePermissions().can()` is false and not super-admin), show an inline warning that the request
  will likely 403.
- **Send** button. For mutating methods, first open the reused `ConfirmDialog`
  ("This sends a real <METHOD> request and writes to your dev database. Continue?").
- On send, call the request helper (B4) and pass the result to the `ResponseViewer`.

### B3. `components/docs/response-viewer.tsx`

- Shows: HTTP **status** (color-coded), **duration** (ms), and the response body **pretty-printed**.
  When the body is an Inertia page object, surface `props` prominently (with `component`/`url`
  shown above); otherwise show the raw JSON/text.
- Collapsible **response headers**.
- If the page object (or body) carries validation `errors`, render them in a small error block.
- Empty state before the first send.

### B4. Request helper (`resources/js/lib/api-explorer-request.ts`)

- `sendRequest({ method, url, query, body, asJson }): Promise<{ status, durationMs, headers, data }>`.
- Uses the app's **axios** instance (Inertia dependency): `withCredentials` true; adds
  `X-Inertia: true`, `X-Inertia-Version` (read from the current Inertia page `version`),
  `X-Requested-With: XMLHttpRequest`, `Accept: application/json`. Axios auto-attaches
  `X-XSRF-TOKEN` from the cookie for mutations.
- Build the final URL from the template + path-param values + query string.
- `validateStatus: () => true` so 4xx/5xx are returned (not thrown) and shown in the viewer.
- Measure duration with `performance.now()`.
- Follow redirects (axios default) so an Inertia mutation that redirects back resolves to the final
  page object.

## Part C — Safety & gating

- The page is already **dev/local only** (`abort_unless`) + **auth** — unchanged. The tester only
  functions where the page renders, so mutations are local-only.
- Mutating sends require explicit per-send confirmation (B2).
- Not added to the sidebar nav (dev tool; discoverable via docs / README).

## Testing

- **Unit `tests/Unit/FormRequestInspectorTest.php`:**
  - `users.store` → `body` has `name` (required), `email` (required, contains `email`),
    `password` (required); `roles` present.
  - `users.update` (whose `rules()` calls `$this->route('user')`) → resolves without throwing,
    `email` rules include the unique constraint string.
  - A route with no FormRequest (e.g. `users.index`) → `body === null`, `pathParams === []`.
  - A route with a path param (`users.edit` / `{user}`) → `pathParams` contains `user`.
- **Feature `tests/Feature/RouteDocsPageTest.php` (extend existing):**
  - Authenticated super-admin in testing env → `200`, Inertia component `docs/routes`, `routes`
    prop non-empty AND the `users.store` entry includes a `body` schema with a `name` field.
  - Unauthenticated → redirect to login.
  - Production env → `404` (keep existing assertion).
- **Frontend:** `npm run build`, `npx tsc --noEmit`, eslint/prettier all green.
- **Live verification (run skill / playwright):** log in as admin, open `/docs/routes`, send a GET
  `/users` (see props JSON), send a guarded POST and confirm the dialog + CSRF flow, observe a
  validation-error response. Screenshot the key states.
- Whole suite + `composer check` green.

## Out of scope (YAGNI)

- Saved request history / collections / environments / variables.
- Auth or user switching (you test as the currently logged-in user).
- Rendering HTML responses (we request the JSON page object instead).
- Generating OpenAPI for web routes / exporting a Postman/Bruno collection.
- Any change to Scramble or to `routes/api.php` (the JSON API path is a separate, future effort).
- New backend permissions or auditing (read-only dev tooling; no new domain writes of our own —
  though the user's test requests do hit audited routes, which is expected).

## Risks & mitigations

- **`rules()` throwing outside a request** (route model binding, `$this->user()`): mitigated by the
  try/catch → `body = null` fallback; covered by the `users.update` unit test.
- **`Rule` objects not stringifiable cleanly:** coerce via `__toString` when available, else class
  basename; the field still renders, just with a coarser hint.
- **CSRF/session edge cases:** rely on axios's established `XSRF-TOKEN` mechanism (same one Inertia
  uses for every form post today), so behavior matches the rest of the app.
- **Accidental data mutation:** dev/local gating + per-send confirm dialog; blast radius is the
  local database.
- **Inertia version mismatch (`409`):** we send the current `X-Inertia-Version`, so a fresh page
  load is in sync; if it ever 409s, the viewer shows it plainly rather than failing silently.
