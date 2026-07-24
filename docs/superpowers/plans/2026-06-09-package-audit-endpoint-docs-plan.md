# Package Audit + Endpoint Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Remove the now-unused `spatie/laravel-query-builder`, clarify Scramble, and add an endpoint inventory (`app:endpoints` command + dev-only `/docs/routes` page) built on a shared `RouteInventory`.

**Architecture:** A pure `App\Support\Docs\RouteInventory` service reads `Route::getRoutes()`, filters to `App\`-action routes, and extracts the `can:` permission. A console command renders it to `docs/endpoints.md`; an `auth`+non-prod web route renders it to an Inertia page.

**Tech Stack:** Laravel 12.61, Inertia React TS, Pest. Spec: `docs/superpowers/specs/2026-06-09-package-audit-endpoint-docs-design.md`.

---

## Task 1: Remove spatie/laravel-query-builder

**Files:** `composer.json`/lock, delete `config/query-builder.php`, modify `app/Support/Tables/FiltersTableColumns.php`, `README.md`, `docs/conventions.md`, `.claude/skills/add-resource/SKILL.md`

- [ ] **Step 1: Confirm zero real usage**

Run: `grep -rn "Spatie\\\\QueryBuilder\|AllowedFilter\|AllowedSort" app/`
Expected: no matches (the only `QueryBuilder` mention is the docblock example in `FiltersTableColumns.php`).

- [ ] **Step 2: Remove the package + config**

```bash
composer remove spatie/laravel-query-builder
rm -f config/query-builder.php
```

- [ ] **Step 3: Fix the stale docblock in `FiltersTableColumns.php`**

In the class docblock `Usage:` example, replace the spatie lines with plain Eloquent:
```php
 * Usage:
 *   $query = User::query()->with('roles');
 *   $this->applySorting($query, $request, ['name', 'email', 'created_at']);
 *   $this->applyColumnSearch($query, $request, ['name', 'email']);
 *   $this->applyColumnFilters($query, $request, [
 *       'name'  => ['type' => 'text'],
 *       'email' => ['type' => 'text'],
 *       'roles' => ['type' => 'select', 'relation' => 'roles', 'relationColumn' => 'name'],
 *   ]);
```

- [ ] **Step 4: Update docs**

- `README.md`: remove the `spatie/laravel-query-builder` bullet from the Stack list.
- `docs/conventions.md` §3: replace any "list pages use QueryBuilder / allowedFilters" text with: list endpoints use `App\Support\Tables\FiltersTableColumns` (`applySorting`/`applyColumnSearch`/`applyColumnFilters` on a plain Eloquent query); the React column declares `filter: { type: 'text'|'select'|'date'|'number', options? }`; URL contract `?sort=name|-name`, `?search=`, `filter[field][operator]=value`.
- `.claude/skills/add-resource/SKILL.md`: change the index-controller guidance from `QueryBuilder::for(...)->allowedSorts/allowedFilters` to the `FiltersTableColumns` trait + the typed DataTable filter config.

- [ ] **Step 5: Verify + gate + commit**

```bash
grep -rn "QueryBuilder\|AllowedFilter\|query-builder" app/ config/ docs/conventions.md README.md .claude/  # only this plan/spec may match
composer check && npm run build && npx tsc --noEmit
git add -A && git commit -m "chore: remove unused spatie/laravel-query-builder"
```
Expected: grep clean (besides spec/plan), gate green.

---

## Task 2: Clarify Scramble in docs (no code change)

**Files:** `README.md`, `docs/getting-started.md`

- [ ] **Step 1: README API section**

Make the API docs section say: `/docs/api` (Scramble) documents the **JSON API surface** — empty until you add endpoints to a module's `routes/api.php` (those need an API auth guard such as Sanctum, intentionally not bundled). The empty `routes/api.php` stubs are the ready-to-use placeholder.

- [ ] **Step 2: getting-started note**

Add the same one-line clarification near the API docs mention, and add a "Seeing your endpoints" note pointing to `php artisan route:list`, `php artisan app:endpoints` (→ `docs/endpoints.md`), and `/docs/routes` (dev). 

- [ ] **Step 3: Commit**

```bash
git add README.md docs/getting-started.md && git commit -m "docs: clarify Scramble scope + endpoint docs pointers"
```

---

## Task 3: RouteInventory service (TDD)

**Files:** Create `app/Support/Docs/RouteInventory.php`, Test `tests/Unit/RouteInventoryTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Support\Docs\RouteInventory;

it('lists app routes with permission, excluding vendor routes', function () {
    $entries = app(RouteInventory::class)->entries();
    $names = collect($entries)->pluck('name')->filter()->all();

    expect($names)->toContain('users.index');
    expect($names)->not->toContain('scramble.docs.ui'); // vendor route excluded

    $store = collect($entries)->firstWhere('name', 'users.store');
    expect($store['permission'])->toBe('users.create'); // parsed from can: middleware
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `vendor/bin/pest tests/Unit/RouteInventoryTest.php` → FAIL (class missing).

- [ ] **Step 3: Implement `RouteInventory`**

```php
<?php

namespace App\Support\Docs;

use Illuminate\Routing\Route;
use Illuminate\Routing\Router;

class RouteInventory
{
    public function __construct(private readonly Router $router) {}

    /**
     * @return array<int, array{methods: string, uri: string, name: ?string, permission: ?string, action: string}>
     */
    public function entries(): array
    {
        $entries = [];

        foreach ($this->router->getRoutes() as $route) {
            /** @var Route $route */
            $action = $route->getActionName();

            if (! str_starts_with($action, 'App\\')) {
                continue; // app routes only — drops Scramble, Ignition, storage, etc.
            }

            $entries[] = [
                'methods' => implode('|', array_values(array_diff($route->methods(), ['HEAD']))),
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'permission' => $this->permissionFrom($route),
                'action' => $action,
            ];
        }

        usort($entries, fn ($a, $b) => $a['uri'] <=> $b['uri']);

        return $entries;
    }

    private function permissionFrom(Route $route): ?string
    {
        foreach ($route->gatherMiddleware() as $middleware) {
            if (is_string($middleware) && str_starts_with($middleware, 'can:')) {
                return explode(',', substr($middleware, 4))[0];
            }
        }

        return null;
    }
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `vendor/bin/pest tests/Unit/RouteInventoryTest.php` → PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Support/Docs/RouteInventory.php tests/Unit/RouteInventoryTest.php
git commit -m "feat: RouteInventory service for endpoint documentation"
```

---

## Task 4: `app:endpoints` command (TDD)

**Files:** Create `app/Console/Commands/GenerateEndpointDocs.php`, Test `tests/Feature/EndpointDocsCommandTest.php`, generate `docs/endpoints.md`

- [ ] **Step 1: Write the failing test**

```php
<?php

it('writes an endpoints markdown doc listing app routes', function () {
    $this->artisan('app:endpoints')->assertSuccessful();

    $path = base_path('docs/endpoints.md');
    expect(file_exists($path))->toBeTrue();
    expect(file_get_contents($path))->toContain('users.index');
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `vendor/bin/pest tests/Feature/EndpointDocsCommandTest.php` → FAIL.

- [ ] **Step 3: Implement the command**

```php
<?php

namespace App\Console\Commands;

use App\Support\Docs\RouteInventory;
use Illuminate\Console\Command;

class GenerateEndpointDocs extends Command
{
    protected $signature = 'app:endpoints';

    protected $description = 'Generate docs/endpoints.md — an inventory of every application route.';

    public function handle(RouteInventory $inventory): int
    {
        $entries = $inventory->entries();

        $rows = collect($entries)->map(fn (array $e) => sprintf(
            '| `%s` | `%s` | %s | %s | `%s` |',
            $e['methods'],
            $e['uri'],
            $e['name'] ?? '—',
            $e['permission'] ?? '—',
            $e['action'],
        ))->implode("\n");

        $markdown = "# Endpoints\n\n"
            ."All application routes (Inertia + API), generated by `php artisan app:endpoints`. "
            ."For JSON API schema docs see `/docs/api` (Scramble).\n\n"
            ."| Method | URI | Name | Permission | Controller |\n"
            ."|---|---|---|---|---|\n"
            .$rows."\n";

        file_put_contents(base_path('docs/endpoints.md'), $markdown);

        $this->info('Wrote docs/endpoints.md ('.count($entries).' endpoints).');

        return self::SUCCESS;
    }
}
```

- [ ] **Step 4: Run — expect PASS, then generate the committed doc**

```bash
vendor/bin/pest tests/Feature/EndpointDocsCommandTest.php   # PASS
php artisan app:endpoints                                   # writes docs/endpoints.md
```

- [ ] **Step 5: Commit**

```bash
git add app/Console/Commands/GenerateEndpointDocs.php tests/Feature/EndpointDocsCommandTest.php docs/endpoints.md
git commit -m "feat: app:endpoints command + generated docs/endpoints.md"
```

---

## Task 5: `/docs/routes` browsable page (TDD)

**Files:** Create `app/Http/Controllers/RouteDocsController.php`, modify `routes/web.php`, create `resources/js/pages/docs/routes.tsx`, Test `tests/Feature/RouteDocsPageTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
});

it('shows the route inventory to an authenticated user', function () {
    $this->actingAs(User::factory()->create())
        ->get('/docs/routes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('docs/routes')->has('routes'));
});

it('redirects a guest', function () {
    $this->get('/docs/routes')->assertRedirect('/login');
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `vendor/bin/pest tests/Feature/RouteDocsPageTest.php` → FAIL (route missing).

- [ ] **Step 3: Controller**

```php
<?php

namespace App\Http\Controllers;

use App\Support\Docs\RouteInventory;
use Inertia\Inertia;
use Inertia\Response;

class RouteDocsController
{
    public function __invoke(RouteInventory $inventory): Response
    {
        abort_unless(app()->environment(['local', 'development', 'testing']), 404);

        return Inertia::render('docs/routes', [
            'routes' => $inventory->entries(),
        ]);
    }
}
```

- [ ] **Step 4: Route**

In `routes/web.php`, add (inside the existing `auth` group if there is one, else):
```php
use App\Http\Controllers\RouteDocsController;

Route::middleware(['auth'])->get('/docs/routes', RouteDocsController::class)->name('docs.routes');
```

- [ ] **Step 5: React page**

Create `resources/js/pages/docs/routes.tsx`:
```tsx
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface RouteEntry {
    methods: string;
    uri: string;
    name: string | null;
    permission: string | null;
    action: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Routes', href: '/docs/routes' }];

export default function Routes({ routes }: { routes: RouteEntry[] }) {
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const term = q.toLowerCase();
        return term ? routes.filter((r) => `${r.uri} ${r.name ?? ''} ${r.permission ?? ''}`.toLowerCase().includes(term)) : routes;
    }, [routes, q]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Routes" />
            <div className="space-y-4 p-6">
                <PageHeader
                    title="Routes"
                    subtitle="Every application endpoint — dev only"
                    actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter routes…" className="w-64" />}
                />
                <div className="bg-card overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead>Method</TableHead>
                                <TableHead>URI</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Permission</TableHead>
                                <TableHead>Controller</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((r, i) => (
                                <TableRow key={`${r.uri}-${i}`}>
                                    <TableCell className="font-mono text-xs">{r.methods}</TableCell>
                                    <TableCell className="font-mono text-xs">{r.uri}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{r.name ?? '—'}</TableCell>
                                    <TableCell className="text-xs">{r.permission ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground truncate font-mono text-xs">{r.action}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 6: Run — expect PASS**

Run: `vendor/bin/pest tests/Feature/RouteDocsPageTest.php` → PASS. (Note: the controller allows `testing` env so the feature test passes; production still 404s.)

- [ ] **Step 7: Lint, build, gate, commit**

```bash
npx prettier --write resources/js/pages/docs/routes.tsx
npx eslint resources/js/pages/docs/routes.tsx
npm run build && npx tsc --noEmit && composer check
git add app/Http/Controllers/RouteDocsController.php routes/web.php resources/js/pages/docs/routes.tsx tests/Feature/RouteDocsPageTest.php
git commit -m "feat: dev-only /docs/routes endpoint inventory page"
```

---

## Task 6: Final verification

- [ ] **Step 1:** `composer check` green (report test count). `npm run build` green. `npx tsc --noEmit` 0 errors.
- [ ] **Step 2:** `grep -rn "QueryBuilder\|AllowedFilter\|query-builder" app/ config/` → empty.
- [ ] **Step 3:** `php artisan route:list | grep docs` shows `docs/routes` + `docs/api`.

---

## Self-Review

- **Spec coverage:** Part A → Task 1; Part B → Task 2; Part C1 → Task 3; C2 → Task 4; C3 → Task 5. ✅
- **Placeholders:** none — full code in every code step.
- **Type consistency:** `RouteInventory::entries()` shape `{methods,uri,name,permission,action}` is used identically in the command (Task 4), controller (Task 5), and the React `RouteEntry` interface (Task 5).
- **Note:** the controller allows `testing` env so the feature test runs; production (`app()->isProduction()`) still 404s.
