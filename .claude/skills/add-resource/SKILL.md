---
name: add-resource
description: Use when adding an entity users list, create, edit, and delete (full CRUD with a management screen). For a single operation, use add-action.
---

> Follow **`superpowers:test-driven-development`** for the TDD discipline (failing test first). The
> Laravel-specific test shapes and file locations are below.

This adds a CRUD resource **into a bounded context** — pick the context it belongs to first (an
existing one like `Iam`, or a new one scaffolded with **create-module**). It does **not** imply a
new module per entity. Mirror the `users` aggregate in `app/Modules/Iam/` exactly. Work in this
order — write the failing test first, then make it pass.

## 1. Write failing Feature tests (TDD first)

Create one test file per mutation in `tests/Feature/<ModuleName>/`. Test files live **outside** the module directory, matching the existing layout:

```
tests/Feature/Users/UserIndexTest.php
tests/Feature/Users/UserStoreTest.php
tests/Feature/Users/UserUpdateTest.php
tests/Feature/Users/UserDestroyTest.php
```

Every test file starts with the same two-line `beforeEach` incantation used across the Users tests:

```php
beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('<resource>.<action>', 'web');
});
```

- `config(['inertia.testing.ensure_pages_exist' => false])` — suppresses the page-existence check so tests run before the React file exists.
- `$this->withoutVite()` — prevents Vite manifest errors in the test environment.

Minimum test coverage per endpoint:

| Endpoint | 403 test | Happy-path test |
|---|---|---|
| `GET /<resource>` | unauthenticated or unpermissioned user → 403 | returns Inertia page with data |
| `POST /<resource>` | no `<resource>.create` permission → 403 | creates row, redirects |
| `PUT /<resource>/{id}` | no `<resource>.update` permission → 403 | updates fields, redirects |
| `DELETE /<resource>/{id}` | no `<resource>.delete` permission → 403 | deletes row, redirects |

Pattern from `tests/Feature/Users/UserStoreTest.php`:

```php
it('forbids creating without <resource>.create', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/<resource>', [])->assertForbidden();
});

it('creates a record', function () {
    $admin = User::factory()->create()->givePermissionTo('<resource>.create');
    $this->actingAs($admin)->post('/<resource>', [...$payload])->assertRedirect();
    // assert DB state
});
```

Run `composer test` and confirm every new test **fails** before writing implementation.

## 2. Migration + Model

Create a migration under `app/Modules/<Name>/Database/Migrations/`. If you are wrapping a core model (e.g. `App\Models\User`) skip this step.

Keep the model thin: mass-assignable `$fillable`, casts, relationships. If the model needs an audit trail, add `use App\Audit\Concerns\IsAudited;` — it hooks into `created`, `updated`, `deleted` automatically, stripping `$hidden` attributes from snapshots.

## 3. FormRequests — one per mutation

Files: `app/Modules/<Name>/Http/Requests/Store<X>Request.php` and `Update<X>Request.php`.

- `authorize()` **always returns `true`**. The `can:` route middleware is the actual guard; the FormRequest only validates. See `StoreUserRequest.php` and `UpdateUserRequest.php`.
- Include `exists:` rules for any foreign-key relations.
- On update, use `Rule::unique(...)->ignore($this->route('<routeParam>'))` to allow the current record to keep its unique value.

```php
public function authorize(): bool { return true; } // route enforces can:<resource>.create

public function rules(): array
{
    return [
        'title'    => ['required', 'string', 'max:255'],
        'category' => ['required', 'string', 'exists:categories,slug'],
    ];
}
```

```php
// UpdateXRequest — ignore the current record's unique constraint
'slug' => ['required', 'string', Rule::unique('<table>', 'slug')->ignore($this->route('<routeParam>'))],
```

## 4. DTO with `fromModel()`

File: `app/Modules/<Name>/Data/<X>Data.php`. Extends `Spatie\LaravelData\Data`.

- List every property the frontend needs explicitly in the constructor.
- **Never expose `$hidden` model attributes** (passwords, tokens, secrets) — omit them from the constructor entirely.
- Provide a static `fromModel()` factory.

```php
class PostData extends Data
{
    public function __construct(
        public int    $id,
        public string $title,
        public string $slug,
        public string $createdAt,
    ) {}

    public static function fromModel(Post $post): self
    {
        return new self(
            id:        $post->id,
            title:     $post->title,
            slug:      $post->slug,
            createdAt: $post->created_at?->toIso8601String() ?? '',
        );
    }
}
```

## 5. Resourceful Controller

File: `app/Modules/<Name>/Http/Controllers/<X>Controller.php`.

Rules (see `UserController.php` for the canonical example):

- Thin — no business logic, no direct DB calls beyond retrieving/persisting the model.
- Six conventional methods only: `index / create / store / edit / update / destroy`.
- Eager-load relations to prevent N+1: `->with('roles')`.
- Map to DTO before passing to Inertia: `->through(fn ($m) => XData::fromModel($m))`.
- Use the `Name::` namespace prefix for Inertia page references.
- The `index` method uses the `App\Support\Tables\FiltersTableColumns` trait on a plain Eloquent query for sortable + filterable lists. Add `use App\Support\Tables\FiltersTableColumns;` to the controller class and `use Illuminate\Http\Request;`.

```php
use App\Support\Tables\FiltersTableColumns;
use Illuminate\Http\Request;

class PostController
{
    use FiltersTableColumns;

    public function index(Request $request): Response
    {
        $query = Post::query()->with('category');
        $this->applySorting($query, $request, ['name', 'created_at']);
        $this->applyColumnSearch($query, $request, ['name']);
        $this->applyColumnFilters($query, $request, [
            'name'     => ['type' => 'text'],
            'category' => ['type' => 'select', 'relation' => 'category', 'relationColumn' => 'name'],
        ]);

        $items = $query->paginate($request->integer('per_page', 25))
            ->withQueryString()
            ->through(fn (Post $p) => PostData::fromModel($p));

        return Inertia::render('Blog::pages/Index', [
            'items'   => $items,
            'sort'    => $request->string('sort')->toString() ?: null,
            'filters' => (object) $request->input('filter', []),
        ]);
    }
}

public function store(StorePostRequest $request): RedirectResponse
{
    Post::create($request->safe()->only(['title', 'slug', 'category_id']));
    return redirect()->route('posts.index');
}
```

## 6. Permissions + Routes

### `permissions.php`

Add permissions to `app/Modules/<Name>/permissions.php`:

```php
return [
    '<resource>.viewAny',
    '<resource>.create',
    '<resource>.update',
    '<resource>.delete',
];
```

Sync them: `php artisan permission:sync`.

### `routes/web.php`

Gate every route with `auth` + the appropriate `can:` middleware. Do **not** add the `web` middleware group — it is already applied by `ModuleServiceProvider`:

```php
Route::middleware('auth')->group(function () {
    Route::get('<resource>',               [XController::class, 'index'])
        ->name('<resource>.index')->middleware('can:<resource>.viewAny');
    Route::get('<resource>/create',        [XController::class, 'create'])
        ->name('<resource>.create')->middleware('can:<resource>.create');
    Route::post('<resource>',              [XController::class, 'store'])
        ->name('<resource>.store')->middleware('can:<resource>.create');
    Route::get('<resource>/{item}/edit',   [XController::class, 'edit'])
        ->name('<resource>.edit')->middleware('can:<resource>.update');
    Route::put('<resource>/{item}',        [XController::class, 'update'])
        ->name('<resource>.update')->middleware('can:<resource>.update');
    Route::delete('<resource>/{item}',     [XController::class, 'destroy'])
        ->name('<resource>.destroy')->middleware('can:<resource>.delete');
});
```

## 7. React Pages

Two files per resource under `app/Modules/<Name>/resources/js/pages/`:

- `Index.tsx` — receives `{ items: Paginated<XRow>, sort: string | null, filters: Record<string, string> }`. Renders `AppLayout` + `PageHeader` (with a "New" button using `<Button asChild><Link href="...">`) + `<DataTable columns={...} rows={items} sort={sort} filters={filters} />`. The actions column uses `RowActionMenu` (Edit href + Delete with `onClick: () => setToDelete(row)`). A `ConfirmDialog` handles the delete confirmation (no native `confirm()`).
- `Form.tsx` — receives a nullable DTO (`item: XRow | null`) and option lists; uses Inertia `useForm`, calls `post` (create) or `put` (update) based on whether the record exists. Wraps the form body in `FormLayout` and each field in `FormField`.

Mirror `app/Modules/Iam/resources/js/pages/users/Index.tsx` and `users/Form.tsx` exactly for structure — only columns/actions/props differ per resource.

```tsx
// Index.tsx skeleton
import { Column, DataTable } from '@/components/data-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { RowActionMenu } from '@/components/row-action-menu';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ items, sort, filters }: Props) {
    const [toDelete, setToDelete] = useState<XRow | null>(null);
    const columns: Column<XRow>[] = [
        { key: 'name', label: 'Name', sortable: true, filterable: true },
        {
            key: 'actions', label: '',
            render: (row) => (
                <div className="flex justify-end">
                    <RowActionMenu actions={[
                        { label: 'Edit', href: `/<resource>/${row.id}/edit` },
                        { label: 'Delete', destructive: true, onClick: () => setToDelete(row) },
                    ]} />
                </div>
            ),
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="<Resource>" />
            <div className="space-y-4 p-6">
                <PageHeader title="<Resource>" subtitle="..." actions={<Button asChild><Link href="/<resource>/create">New</Link></Button>} />
                <DataTable columns={columns} rows={items} sort={sort} filters={filters} />
            </div>
            <ConfirmDialog
                open={toDelete !== null}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Delete <resource>?"
                description={toDelete ? `This permanently deletes ${toDelete.name}.` : undefined}
                confirmLabel="Delete"
                onConfirm={() => { if (toDelete) router.delete(`/<resource>/${toDelete.id}`); }}
            />
        </AppLayout>
    );
}
```

```tsx
// Form.tsx skeleton
import { FormField } from '@/components/form/form-field';
import { FormLayout } from '@/components/form/form-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Form({ item }: Props) {
    // ...useForm setup...
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <Head title={item ? 'Edit <resource>' : 'New <resource>'} />
                <PageHeader title={item ? 'Edit <resource>' : 'New <resource>'} />
                <div className="mt-6">
                    <FormLayout onSubmit={submit} footer={<Button type="submit" disabled={processing}>Save</Button>}>
                        <FormField label="Name" htmlFor="name" error={errors.name}>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        </FormField>
                    </FormLayout>
                </div>
            </div>
        </AppLayout>
    );
}
```

Every list endpoint is sortable/filterable via `applySorting`/`applyColumnFilters` (see `FiltersTableColumns` trait). The React column declares `filter: { type: 'text'|'select'|'date'|'number', options? }` in the `DataTable` column config. Add a `<Resource>SortFilterTest.php` Pest test per the Users example in `tests/Feature/Users/UserSortFilterTest.php`.

After writing both files: `npm run build`.

## 8. README

Update `app/Modules/<Name>/README.md` with the resource's permissions table and route list.

## 9. Quality gate

```bash
composer check   # Pint + PHPStan level 6 + Pest — must be green
npm run build    # Vite asset build — must succeed
```

All tests from step 1 must now pass. Do not commit until both commands are green.

## 10. Hand off

- Audit trail for mutations: use the **add-audit** skill.
- Additional non-CRUD endpoints on this resource: use the **add-action** skill.
- Final review before merge: use the **review-changes** skill.
