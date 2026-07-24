# In-app API Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the read-only `/docs/routes` page into an interactive **API Explorer** that documents each route's inputs (from its `FormRequest` rules) and sends real requests over the live dev session.

**Architecture:** The backend only *enriches* the existing route inventory with per-route input schema (path params + body fields). A new `FormRequestInspector` reflects each controller action, finds its `FormRequest`, and serializes `rules()` (best-effort, never throws). The frontend rewrites `pages/docs/routes.tsx` into a master-detail explorer; a small `fetch`-based helper fires the request to the real route with `X-Inertia` + `X-Inertia-Version` (→ JSON page object) and the `XSRF-TOKEN` (→ mutations pass CSRF). Mutations are guarded by a confirm dialog. The page stays dev/local-only + auth-gated.

**Tech Stack:** Laravel 12.61, PHP 8.4, Inertia v2 + React 19 + TypeScript, Tailwind v4, shadcn/ui, Pest. Reference spec: `docs/superpowers/specs/2026-06-11-in-app-api-explorer-design.md`.

**Branch:** `feat/in-app-api-explorer` (already exists with the spec committed). Land via PR + squash-merge.

**Interface note (refinement of the spec):** The spec sketched `FormRequestInspector::forRoute(Route)`. Because a fresh `FormRequest` with the default null route-resolver makes `$this->route(...)` return `null` without throwing, the inspector instead takes **`forAction(string $action, string $uri)`** — pure strings in, array out. This keeps `RouteInventory` unchanged and makes the controller enrichment a one-line map over `entries()`. Behavior matches the spec exactly.

**Conventions:** Read `docs/conventions.md` first. Tests that hit Inertia routes set `config(['inertia.testing.ensure_pages_exist' => false])` and `$this->withoutVite()` (see `tests/Feature/RouteDocsPageTest.php`). Every task ends green on `composer check`; React tasks also on `npm run types`, `npm run lint`, `npm run build`.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/Support/Docs/FormRequestInspector.php` (create) | Given `(action, uri)`, return `{pathParams, body}`. Reflects the controller action → FormRequest → serialized `rules()`. Pure, best-effort, never throws. |
| `app/Http/Controllers/RouteDocsController.php` (modify) | Enrich each `RouteInventory` entry with `FormRequestInspector` output; unchanged gating. |
| `tests/Unit/FormRequestInspectorTest.php` (create) | Unit-test the inspector against real module actions. |
| `tests/Feature/RouteDocsPageTest.php` (modify) | Add an assertion that the `routes` prop carries the body schema. |
| `resources/js/lib/api-explorer-request.ts` (create) | `sendApiRequest()` helper + request/response types. `fetch` with Inertia + CSRF headers. |
| `resources/js/components/docs/response-viewer.tsx` (create) | Render status/duration/props-JSON/headers/validation errors. |
| `resources/js/components/docs/request-panel.tsx` (create) | Build path/query/body inputs from the route schema; Send + mutation confirm. Exports `RouteEntry`/`BodyField` types. |
| `resources/js/pages/docs/routes.tsx` (modify) | Master-detail page: route list ↔ request panel ↔ response viewer. Heading → "API Explorer". |

---

## Task 1: FormRequestInspector (backend)

**Files:**
- Create: `app/Support/Docs/FormRequestInspector.php`
- Test: `tests/Unit/FormRequestInspectorTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/FormRequestInspectorTest.php`:

```php
<?php

use App\Support\Docs\FormRequestInspector;
use Tests\TestCase;

uses(TestCase::class);

function inspect(string $action, string $uri): array
{
    return app(FormRequestInspector::class)->forAction($action, $uri);
}

const USER_CTRL = 'App\Modules\Users\Http\Controllers\UserController';

it('extracts FormRequest body fields with rules and a required flag', function () {
    $result = inspect(USER_CTRL.'@store', 'users');

    expect($result['body'])->toBeArray()
        ->and($result['body']['name']['required'])->toBeTrue()
        ->and($result['body']['email']['rules'])->toContain('email')
        ->and($result['body']['password']['required'])->toBeTrue();
});

it('resolves a FormRequest whose rules() reads the route without throwing', function () {
    $result = inspect(USER_CTRL.'@update', 'users/{user}');

    expect($result['body'])->toHaveKey('email')
        ->and(collect($result['body']['email']['rules'])->implode(' '))->toContain('unique');
});

it('returns a null body for actions without a FormRequest', function () {
    $result = inspect(USER_CTRL.'@index', 'users');

    expect($result['body'])->toBeNull();
});

it('detects path parameters from the URI', function () {
    expect(inspect(USER_CTRL.'@edit', 'users/{user}/edit')['pathParams'])->toContain('user')
        ->and(inspect(USER_CTRL.'@index', 'users')['pathParams'])->toBe([]);
});

it('returns null body and empty params for a Closure/invalid action', function () {
    $result = inspect('Closure', 'docs/routes');

    expect($result['body'])->toBeNull()
        ->and($result['pathParams'])->toBe([]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `./vendor/bin/pest tests/Unit/FormRequestInspectorTest.php`
Expected: FAIL — `Class "App\Support\Docs\FormRequestInspector" not found`.

- [ ] **Step 3: Write the implementation**

Create `app/Support/Docs/FormRequestInspector.php`:

```php
<?php

namespace App\Support\Docs;

use Illuminate\Foundation\Http\FormRequest;
use ReflectionMethod;
use ReflectionNamedType;
use Throwable;

class FormRequestInspector
{
    /**
     * @return array{pathParams: array<int, string>, body: array<string, array{rules: array<int, string>, required: bool}>|null}
     */
    public function forAction(string $action, string $uri): array
    {
        return [
            'pathParams' => $this->pathParams($uri),
            'body' => $this->body($action),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function pathParams(string $uri): array
    {
        preg_match_all('/\{(\w+)\??\}/', $uri, $matches);

        return $matches[1];
    }

    /**
     * @return array<string, array{rules: array<int, string>, required: bool}>|null
     */
    private function body(string $action): ?array
    {
        $class = $this->resolveFormRequestClass($action);

        if ($class === null) {
            return null;
        }

        try {
            /** @var FormRequest $instance */
            $instance = new $class;
            $rules = $instance->rules();
        } catch (Throwable) {
            return null; // best-effort: rules() may depend on a real request
        }

        $fields = [];

        foreach ($rules as $field => $ruleSet) {
            $normalized = $this->normalizeRules($ruleSet);
            $fields[$field] = [
                'rules' => $normalized,
                'required' => in_array('required', $normalized, true),
            ];
        }

        return $fields;
    }

    private function resolveFormRequestClass(string $action): ?string
    {
        if (! str_contains($action, '@')) {
            return null;
        }

        [$class, $method] = explode('@', $action, 2);

        if (! class_exists($class) || ! method_exists($class, $method)) {
            return null;
        }

        foreach ((new ReflectionMethod($class, $method))->getParameters() as $param) {
            $type = $param->getType();

            if ($type instanceof ReflectionNamedType && ! $type->isBuiltin()
                && is_subclass_of($type->getName(), FormRequest::class)) {
                return $type->getName();
            }
        }

        return null;
    }

    /**
     * @param  mixed  $ruleSet
     * @return array<int, string>
     */
    private function normalizeRules($ruleSet): array
    {
        $items = is_array($ruleSet) ? $ruleSet : explode('|', (string) $ruleSet);

        return array_values(array_map(function ($rule): string {
            if (is_string($rule)) {
                return $rule;
            }

            if (is_object($rule) && method_exists($rule, '__toString')) {
                return (string) $rule;
            }

            return is_object($rule) ? class_basename($rule) : (string) $rule;
        }, $items));
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `./vendor/bin/pest tests/Unit/FormRequestInspectorTest.php`
Expected: PASS (5 passed).

- [ ] **Step 5: Run the quality gate**

Run: `composer check`
Expected: Pint clean, PHPStan level 6 clean, all Pest tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/Support/Docs/FormRequestInspector.php tests/Unit/FormRequestInspectorTest.php
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "feat: add FormRequestInspector for route input schema"
```

---

## Task 2: Enrich the /docs/routes payload

**Files:**
- Modify: `app/Http/Controllers/RouteDocsController.php`
- Test: `tests/Feature/RouteDocsPageTest.php` (add a case)

- [ ] **Step 1: Write the failing test**

Add this case to `tests/Feature/RouteDocsPageTest.php` (keep the existing `beforeEach` and cases):

```php
use Illuminate\Support\Collection;

it('includes the FormRequest body schema in the routes prop', function () {
    $this->actingAs(User::factory()->create())
        ->get('/docs/routes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docs/routes')
            ->where('routes', fn (Collection $routes) => $routes->contains(
                fn ($r) => ($r['name'] ?? null) === 'users.store'
                    && is_array($r['body'] ?? null)
                    && array_key_exists('name', $r['body'])
            ))
            ->etc()
        );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `./vendor/bin/pest tests/Feature/RouteDocsPageTest.php`
Expected: FAIL — the `routes` entries have no `body` key yet, so `contains(...)` is false.

- [ ] **Step 3: Write the implementation**

Replace `app/Http/Controllers/RouteDocsController.php` with:

```php
<?php

namespace App\Http\Controllers;

use App\Support\Docs\FormRequestInspector;
use App\Support\Docs\RouteInventory;
use Inertia\Inertia;
use Inertia\Response;

class RouteDocsController
{
    public function __invoke(RouteInventory $inventory, FormRequestInspector $inspector): Response
    {
        abort_unless(app()->environment(['local', 'development', 'testing']), 404);

        $routes = array_map(
            fn (array $entry) => [...$entry, ...$inspector->forAction($entry['action'], $entry['uri'])],
            $inventory->entries(),
        );

        return Inertia::render('docs/routes', [
            'routes' => $routes,
        ]);
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `./vendor/bin/pest tests/Feature/RouteDocsPageTest.php`
Expected: PASS (3 passed — the two existing cases plus the new one).

- [ ] **Step 5: Run the quality gate**

Run: `composer check`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/RouteDocsController.php tests/Feature/RouteDocsPageTest.php
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "feat: enrich /docs/routes payload with input schema"
```

---

## Task 3: Frontend request helper

**Files:**
- Create: `resources/js/lib/api-explorer-request.ts`

No JS test runner exists in this repo (the JS gate is `tsc` + `eslint` + `vite build`), so frontend tasks verify by type-checking, linting, and building — not unit tests.

- [ ] **Step 1: Write the helper**

Create `resources/js/lib/api-explorer-request.ts`:

```ts
export interface ApiRequestInput {
    method: string;
    /** Resolved path with path-params substituted, e.g. "/users/3". */
    url: string;
    query: Record<string, string>;
    body?: unknown;
    inertiaVersion: string;
}

export interface ApiResponseResult {
    status: number;
    durationMs: number;
    headers: Record<string, string>;
    /** Parsed JSON when possible, otherwise the raw text. */
    data: unknown;
    raw: string;
}

const SAFE_METHODS = ['GET', 'HEAD'];

function readXsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : null;
}

export async function sendApiRequest(input: ApiRequestInput): Promise<ApiResponseResult> {
    const method = input.method.toUpperCase();
    const isMutation = !SAFE_METHODS.includes(method);

    const queryString = new URLSearchParams(input.query).toString();
    const url = queryString ? `${input.url}?${queryString}` : input.url;

    const headers: Record<string, string> = {
        Accept: 'application/json, text/html',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Inertia': 'true',
        'X-Inertia-Version': input.inertiaVersion,
    };

    const token = readXsrfToken();
    if (isMutation && token) {
        headers['X-XSRF-TOKEN'] = token;
    }

    const hasBody = isMutation && input.body !== undefined;
    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }

    const start = performance.now();
    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const durationMs = Math.round(performance.now() - start);

    const raw = await response.text();
    let data: unknown = raw;
    try {
        data = JSON.parse(raw);
    } catch {
        // not JSON (e.g. HTML) — keep the raw text
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });

    return { status: response.status, durationMs, headers: responseHeaders, data, raw };
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run types && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/api-explorer-request.ts
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "feat: add API Explorer request helper"
```

---

## Task 4: Response viewer component

**Files:**
- Create: `resources/js/components/docs/response-viewer.tsx`

- [ ] **Step 1: Write the component**

Create `resources/js/components/docs/response-viewer.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ApiResponseResult } from '@/lib/api-explorer-request';
import { useState } from 'react';

function statusVariant(status: number): 'default' | 'secondary' | 'destructive' {
    if (status >= 400) return 'destructive';
    if (status >= 200 && status < 300) return 'default';
    return 'secondary';
}

interface InertiaPage {
    component?: string;
    url?: string;
    props?: Record<string, unknown>;
}

function asInertiaPage(data: unknown): InertiaPage | null {
    if (data && typeof data === 'object' && 'component' in data && 'props' in data) {
        const page = data as Record<string, unknown>;
        return {
            component: typeof page.component === 'string' ? page.component : undefined,
            url: typeof page.url === 'string' ? page.url : undefined,
            props: (page.props as Record<string, unknown>) ?? undefined,
        };
    }
    return null;
}

export function ResponseViewer({ result }: { result: ApiResponseResult | null }) {
    const [showHeaders, setShowHeaders] = useState(false);

    if (!result) {
        return (
            <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                Send a request to see the response.
            </div>
        );
    }

    const page = asInertiaPage(result.data);
    const errors = (page?.props?.errors as Record<string, string> | undefined) ?? undefined;
    const body = page?.props ?? result.data;
    const pretty = typeof body === 'string' ? body : JSON.stringify(body, null, 2);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <Badge variant={statusVariant(result.status)}>{result.status}</Badge>
                <span className="text-muted-foreground">{result.durationMs} ms</span>
                {page?.component && <span className="text-muted-foreground font-mono text-xs">{page.component}</span>}
            </div>

            {errors && Object.keys(errors).length > 0 && (
                <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-3 text-xs">
                    <div className="mb-1 font-medium">Validation errors</div>
                    <ul className="list-inside list-disc space-y-0.5">
                        {Object.entries(errors).map(([field, message]) => (
                            <li key={field}>
                                <span className="font-mono">{field}</span>: {String(message)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <pre className="bg-muted max-h-[28rem] overflow-auto rounded-md p-3 font-mono text-xs">{pretty}</pre>

            <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowHeaders((s) => !s)}>
                    {showHeaders ? 'Hide' : 'Show'} response headers
                </Button>
                {showHeaders && (
                    <pre className="bg-muted mt-2 overflow-auto rounded-md p-3 font-mono text-xs">
                        {Object.entries(result.headers)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join('\n')}
                    </pre>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run types && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/docs/response-viewer.tsx
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "feat: add API Explorer response viewer"
```

---

## Task 5: Request panel component

**Files:**
- Create: `resources/js/components/docs/request-panel.tsx`

Depends on Task 3 (helper) and Task 4 (viewer types). Verify these imports exist before coding: `@/components/confirm-dialog` exports `ConfirmDialog` with props `{open, onOpenChange, onConfirm, title?, description?, confirmLabel?, destructive?}`; `@/hooks/use-permissions` exports `usePermissions()` returning `{ can(name: string): boolean }`; `@/components/ui/{badge,button,input,label}` exist.

- [ ] **Step 1: Write the component**

Create `resources/js/components/docs/request-panel.tsx`:

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { sendApiRequest, type ApiResponseResult } from '@/lib/api-explorer-request';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export interface BodyField {
    rules: string[];
    required: boolean;
}

export interface RouteEntry {
    methods: string;
    uri: string;
    name: string | null;
    permission: string | null;
    action: string;
    pathParams: string[];
    body: Record<string, BodyField> | null;
}

const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

function primaryMethod(methods: string): string {
    const list = methods.split('|');
    return MUTATING.find((m) => list.includes(m)) ?? list[0] ?? 'GET';
}

function buildUrl(uri: string, pathValues: Record<string, string>): string {
    return '/' + uri.replace(/\{(\w+)\??\}/g, (_, name: string) => encodeURIComponent(pathValues[name] ?? `:${name}`));
}

export function RequestPanel({ route, onResult }: { route: RouteEntry; onResult: (result: ApiResponseResult) => void }) {
    const page = usePage();
    const { can } = usePermissions();
    const method = primaryMethod(route.methods);
    const isMutation = MUTATING.includes(method);

    const [pathValues, setPathValues] = useState<Record<string, string>>({});
    const [queryRows, setQueryRows] = useState<{ key: string; value: string }[]>([]);
    const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
    const [rawMode, setRawMode] = useState(false);
    const [rawBody, setRawBody] = useState('{}');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        setPathValues({});
        setQueryRows([]);
        setBodyValues({});
        setRawBody('{}');
        setRawMode(false);
    }, [route.uri, route.methods]);

    const lacksPermission = route.permission ? !can(route.permission) : false;

    const resolveBody = (): unknown => {
        if (!isMutation) return undefined;
        if (rawMode || !route.body) {
            try {
                return JSON.parse(rawBody);
            } catch {
                return rawBody;
            }
        }
        const obj: Record<string, string> = {};
        for (const [field, value] of Object.entries(bodyValues)) {
            if (value !== '') obj[field] = value;
        }
        return obj;
    };

    const doSend = async () => {
        setSending(true);
        try {
            const query: Record<string, string> = {};
            for (const row of queryRows) {
                if (row.key) query[row.key] = row.value;
            }
            const result = await sendApiRequest({
                method,
                url: buildUrl(route.uri, pathValues),
                query,
                body: resolveBody(),
                inertiaVersion: typeof page.version === 'string' ? page.version : '',
            });
            onResult(result);
        } finally {
            setSending(false);
        }
    };

    const onSendClick = () => {
        if (isMutation) {
            setConfirmOpen(true);
        } else {
            void doSend();
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isMutation ? 'destructive' : 'default'}>{method}</Badge>
                <code className="font-mono text-sm">/{route.uri}</code>
                {route.permission && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                        {route.permission}
                    </Badge>
                )}
            </div>

            {lacksPermission && (
                <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-2 text-xs">
                    You don't hold <span className="font-mono">{route.permission}</span> — this request will likely return 403.
                </div>
            )}

            {route.pathParams.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Path parameters</Label>
                    {route.pathParams.map((param) => (
                        <div key={param} className="flex items-center gap-2">
                            <code className="text-muted-foreground w-32 font-mono text-xs">{param}</code>
                            <Input
                                value={pathValues[param] ?? ''}
                                onChange={(e) => setPathValues((p) => ({ ...p, [param]: e.target.value }))}
                                placeholder={param}
                                className="h-8"
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Query parameters</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setQueryRows((r) => [...r, { key: '', value: '' }])}>
                        + Add
                    </Button>
                </div>
                {queryRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input
                            value={row.key}
                            onChange={(e) => setQueryRows((rows) => rows.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                            placeholder="key"
                            className="h-8"
                        />
                        <Input
                            value={row.value}
                            onChange={(e) => setQueryRows((rows) => rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
                            placeholder="value"
                            className="h-8"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setQueryRows((rows) => rows.filter((_, j) => j !== i))}>
                            ×
                        </Button>
                    </div>
                ))}
            </div>

            {isMutation && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Request body</Label>
                        {route.body && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => setRawMode((m) => !m)}>
                                {rawMode ? 'Form' : 'Raw JSON'}
                            </Button>
                        )}
                    </div>

                    {!rawMode && route.body ? (
                        <div className="space-y-2">
                            {Object.entries(route.body).map(([field, schema]) => (
                                <div key={field} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs">{field}</code>
                                        {schema.required && <span className="text-destructive text-xs">*</span>}
                                        <span className="text-muted-foreground text-[10px]">{schema.rules.join(' · ')}</span>
                                    </div>
                                    <Input
                                        value={bodyValues[field] ?? ''}
                                        onChange={(e) => setBodyValues((b) => ({ ...b, [field]: e.target.value }))}
                                        placeholder={field}
                                        className="h-8"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            value={rawBody}
                            onChange={(e) => setRawBody(e.target.value)}
                            rows={6}
                            className="border-input bg-background w-full rounded-md border p-2 font-mono text-xs"
                        />
                    )}
                </div>
            )}

            <Button onClick={onSendClick} disabled={sending}>
                {sending ? 'Sending…' : 'Send'}
            </Button>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={() => void doSend()}
                title="Send a real request?"
                description={`This sends a real ${method} request to /${route.uri} and writes to your dev database.`}
                confirmLabel="Send request"
            />
        </div>
    );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run types && npm run lint`
Expected: no errors. If `usePage().version` is typed `string | null`, the `typeof ... === 'string'` guard already handles it.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/docs/request-panel.tsx
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "feat: add API Explorer request panel"
```

---

## Task 6: Rewrite the page as a master-detail explorer

**Files:**
- Modify: `resources/js/pages/docs/routes.tsx`

- [ ] **Step 1: Replace the page**

Replace the entire contents of `resources/js/pages/docs/routes.tsx` with:

```tsx
import { RequestPanel, type RouteEntry } from '@/components/docs/request-panel';
import { ResponseViewer } from '@/components/docs/response-viewer';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { ApiResponseResult } from '@/lib/api-explorer-request';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'API Explorer', href: '/docs/routes' }];

export default function ApiExplorer({ routes }: { routes: RouteEntry[] }) {
    const [q, setQ] = useState('');
    const [selected, setSelected] = useState<RouteEntry | null>(null);
    const [result, setResult] = useState<ApiResponseResult | null>(null);

    const filtered = useMemo(() => {
        const term = q.toLowerCase();
        return term
            ? routes.filter((r) => `${r.uri} ${r.name ?? ''} ${r.permission ?? ''}`.toLowerCase().includes(term))
            : routes;
    }, [routes, q]);

    const selectRoute = (r: RouteEntry) => {
        setSelected(r);
        setResult(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Explorer" />
            <div className="space-y-4 p-6">
                <PageHeader
                    title="API Explorer"
                    subtitle="Send requests to your app's routes — dev only"
                    actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter routes…" className="w-64" />}
                />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div className="bg-card max-h-[70vh] overflow-auto rounded-lg border">
                        <ul className="divide-y">
                            {filtered.map((r, i) => {
                                const active = selected?.uri === r.uri && selected?.methods === r.methods;
                                return (
                                    <li key={`${r.uri}-${i}`}>
                                        <button
                                            onClick={() => selectRoute(r)}
                                            className={`hover:bg-muted/50 flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left ${active ? 'bg-muted' : ''}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px]">{r.methods}</span>
                                                <span className="font-mono text-xs">/{r.uri}</span>
                                            </div>
                                            <span className="text-muted-foreground text-[10px]">{r.name ?? '—'}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-card rounded-lg border p-4">
                            {selected ? (
                                <RequestPanel route={selected} onResult={setResult} />
                            ) : (
                                <div className="text-muted-foreground p-6 text-center text-sm">Select a route to build a request.</div>
                            )}
                        </div>
                        {selected && (
                            <div className="bg-card rounded-lg border p-4">
                                <ResponseViewer result={result} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Type-check, lint, and build**

Run: `npm run types && npm run lint && npm run build`
Expected: tsc 0 errors, eslint clean, Vite build succeeds.

- [ ] **Step 3: Run the PHP gate (manifest now exists for the page render test)**

Run: `composer check`
Expected: all green, including `tests/Feature/RouteDocsPageTest.php`.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/docs/routes.tsx
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "feat: rewrite /docs/routes as the interactive API Explorer"
```

---

## Task 7: Live verification

**Files:** none (verification only).

- [ ] **Step 1: Drive the app in a real browser**

Use the `run` skill (built assets + `php artisan serve` + playwright-core/Chrome, installed transiently and removed after). Verify, logged in as `admin@example.com` / `password`:

1. `/docs/routes` renders the master-detail "API Explorer" inside the sidebar shell.
2. Selecting **GET `users`** and pressing **Send** returns a `200` whose response viewer shows the Inertia page object with `props.users` (the paginated data) — confirming the `X-Inertia` JSON path.
3. Selecting **POST `users`** shows the schema-derived body form (`name*`, `email*`, `password*`, `roles`); pressing **Send** opens the confirm dialog; confirming with an invalid/empty body returns a response surfacing **validation errors**; confirming with a valid unique payload returns success (and a new user exists).
4. Selecting **PUT `users/{user}`** exposes the `user` path-param input; a send with a valid id succeeds.
5. No console errors; the teal shell + theme are intact.

Screenshot each key state.

- [ ] **Step 2: Record findings**

If any runtime issue appears (e.g. a mutation that follows a redirect returns HTML instead of the page object), note it and apply the minimal fix in the relevant frontend file, then re-run `npm run build` and re-verify. Commit any fix:

```bash
git add -A
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "fix: <runtime issue found in live verification>"
```

If no fix is needed, skip the commit.

- [ ] **Step 3: Clean up transient verification deps**

Ensure no playwright/test-only packages remain staged: `git checkout package.json package-lock.json` if the run skill modified them, and confirm `git status` is clean except for intended changes.

---

## Task 8: Documentation + finish

**Files:**
- Modify: `README.md` (API documentation section), `docs/getting-started.md` if it references `/docs/routes`.

- [ ] **Step 1: Update the README**

In `README.md`, update the `/docs/routes` mention so it reads as the interactive explorer. Replace the line:

```
Or visit **`/docs/routes`** (dev/local only, auth required) for a searchable in-browser inventory.
```

with:

```
Or visit **`/docs/routes`** — the **API Explorer** (dev/local only, auth required): browse every
endpoint, see each route's inputs (derived from its FormRequest rules), and **send real requests**
over your session to inspect the response. Mutations are confirm-gated.
```

- [ ] **Step 2: Verify docs reference is consistent**

Run: `grep -rn "docs/routes" README.md docs/`
Expected: every reference describes the explorer (no stale "read-only inventory" wording for the page). Fix any that remain.

- [ ] **Step 3: Final full gate**

Run: `composer check && npm run types && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/
git -c user.name='Ersad' -c user.email='rizalsam36@gmail.com' commit -m "docs: describe the interactive API Explorer on /docs/routes"
```

- [ ] **Step 5: Finish the feature**

Invoke the `finish-feature` skill (specializes `superpowers:finishing-a-development-branch`): verify the full gate, push `feat/in-app-api-explorer`, open a PR titled **`feat: interactive API Explorer on /docs/routes`**, and squash-merge per `CONTRIBUTING.md`.

---

## Self-Review

**Spec coverage:**
- Decision 1 (target = web routes) → the helper sends to real route URLs (Tasks 3, 5). ✓
- Decision 2 (in-app tester on /docs/routes) → Task 6 master-detail rewrite. ✓
- Decision 3 (all methods, mutations guarded) → `MUTATING` + `ConfirmDialog` in Task 5. ✓
- Decision 4 (introspect FormRequest rules; path params) → `FormRequestInspector` (Task 1) + form rendering (Task 5). ✓
- Decision 5 (direct browser transport) → `fetch` helper (Task 3), no backend proxy. ✓
- Spec Part A (FormRequestInspector + null fallback) → Task 1, covered by the throwing/Closure cases. ✓
- Spec Part A2 (controller enrichment, RouteInventory unchanged) → Task 2. ✓
- Spec Part B1–B4 (page, RequestPanel, ResponseViewer, request helper) → Tasks 6, 5, 4, 3. ✓
- Spec Part C (dev/local + auth gating unchanged; not in nav) → controller keeps `abort_unless`; page not added to sidebar. ✓
- Spec Testing (unit inspector, extended feature test, FE gate, live verify) → Tasks 1, 2, 3–6, 7. ✓
- Out-of-scope items (no saved history, no auth switching, no Scramble/api.php change) → not introduced. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step has an expected result. ✓

**Type consistency:** `RouteEntry`/`BodyField` defined once in `request-panel.tsx` and imported by the page; `ApiRequestInput`/`ApiResponseResult` defined once in `api-explorer-request.ts` and imported by panel + viewer; backend `forAction(string, string)` signature matches its only caller in `RouteDocsController`; the `{methods,uri,name,permission,action}` entry shape from `RouteInventory` is spread then extended with `{pathParams, body}`, matching `RouteEntry`. ✓
