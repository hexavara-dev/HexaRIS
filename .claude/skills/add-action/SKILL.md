---
name: add-action
description: Use when adding one non-CRUD operation (approve, export, sync, a single endpoint) into a bounded context. For an entity with full CRUD, use add-resource.
---

> Follow **`superpowers:test-driven-development`** for the TDD discipline (failing test first). The
> Laravel-specific test shapes and file locations are below.

Adds a single operation **into a bounded context** (an existing one, or a new one from **create-module**) — for operations that do not fit the standard list/create/edit/delete shape. Examples: approve an order, export a CSV, trigger a sync, send a notification. It does not imply a new module. Write the failing test first.

## 1. Write the failing Feature test (TDD first)

Create `tests/Feature/<ModuleName>/<ActionName>Test.php`. Test files live **outside** the module directory.

Use the same two-line `beforeEach` incantation used across all feature tests in this repo:

```php
beforeEach(function () {
    config(['inertia.testing.ensure_pages_exist' => false]);
    $this->withoutVite();
    Permission::findOrCreate('<resource>.<action>', 'web');
});
```

Minimum two tests — 403 and happy path:

```php
it('forbids <action> without <resource>.<action> permission', function () {
    $this->actingAs(User::factory()->create());
    $this->post('/<resource>/{id}/<action>')->assertForbidden();
});

it('<action>s successfully', function () {
    $actor = User::factory()->create()->givePermissionTo('<resource>.<action>');
    $subject = MyModel::factory()->create();

    $this->actingAs($actor)
        ->post("/<resource>/{$subject->id}/<action>")
        ->assertRedirect(); // or ->assertOk() for JSON API endpoints

    // assert side-effects: state change, job dispatched, email sent, etc.
});
```

Run `composer test` and confirm the test **fails** before writing implementation.

## 2. Permission declaration

Add the permission to `app/Modules/<Name>/permissions.php`:

```php
return [
    // existing...
    '<resource>.<action>',   // e.g. 'orders.approve', 'reports.export'
];
```

The format is `<resource>.<action>` where resource is lowercase and action is camelCase. Domain verbs are allowed (`approve`, `export`, `sync`, `publish`). Run:

```bash
php artisan permission:sync
```

## 3. Route

Add a single route to `app/Modules/<Name>/routes/web.php` (or `api.php` for JSON-only endpoints). Do **not** add the `web` middleware group manually — it is already applied by `ModuleServiceProvider`.

```php
Route::middleware('auth')->group(function () {
    // Typical: action on an existing resource
    Route::post('<resource>/{item}/<action>', [ApproveOrderController::class, '__invoke'])
        ->name('<resource>.<action>')
        ->middleware('can:<resource>.<action>');

    // Or: stand-alone action (no subject ID)
    Route::post('<resource>/export', [ExportOrdersController::class, '__invoke'])
        ->name('<resource>.export')
        ->middleware('can:<resource>.export');
});
```

For pure JSON responses use `routes/api.php`; the endpoint is automatically prefixed with `/api`.

## 4. Invokable Controller

Create `app/Modules/<Name>/Http/Controllers/<ActionName>Controller.php` with a single `__invoke` method. Keep it thin — delegate business logic to an `Actions/` class.

```php
namespace App\Modules\Orders\Http\Controllers;

use App\Models\Order;
use App\Modules\Orders\Actions\ApproveOrder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ApproveOrderController
{
    public function __invoke(Request $request, Order $order, ApproveOrder $action): RedirectResponse
    {
        $action->execute($order, $request->user());

        return redirect()->route('orders.index');
    }
}
```

Alternatively, add a named method to an existing resourceful controller when the action is closely related and the controller stays thin.

## 5. FormRequest (if there is input)

Create `app/Modules/<Name>/Http/Requests/<ActionName>Request.php` only if the endpoint accepts user input.

- `authorize()` **always returns `true`** — the `can:` route middleware is the actual guard.
- Validate all inputs; use `exists:` for references to other records.

```php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'reason' => ['required', 'string', 'max:500'],
    ];
}
```

## 6. Action class (business logic)

Put the business logic in `app/Modules/<Name>/Actions/<ActionName>.php`. Single-responsibility — one public method.

```php
namespace App\Modules\Orders\Actions;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApproveOrder
{
    public function execute(Order $order, User $approver): void
    {
        DB::transaction(function () use ($order, $approver) {
            $order->update(['status' => 'approved', 'approved_by' => $approver->id]);
            // fire events, send notifications, etc.
        });
    }
}
```

No model/migration assumptions — use whatever models already exist.

## 7. Auditing (recommended)

Suggest auditing the action via `AuditLogger`. See `app/Audit/AuditLogger.php` and hand off to the **add-audit** skill for details.

Use `::atomic()` when the audit record must roll back with the transaction (critical business events):

```php
AuditLogger::atomic()
    ->subject('orders', $order->id)
    ->before(['status' => $oldStatus])
    ->after(['status' => 'approved'])
    ->event('approved')
    ->module('orders')
    ->log('Order approved');
```

Use `::async()` for high-volume or non-critical events where synchronous overhead is undesirable.

## 8. Optional React page

If the action requires a UI form (not just a button POST):

- Create `app/Modules/<Name>/resources/js/pages/<ActionName>.tsx`.
- Return `Inertia::render('Name::pages/<ActionName>', [...])` from the controller.
- Run `npm run build` after creating the file.

For pure JSON endpoints (in `routes/api.php`) no React page is needed — return a JSON response directly.

## 9. Quality gate

```bash
composer check   # Pint + PHPStan level 6 + Pest — must be green
npm run build    # only if a React page was added
```

All tests from step 1 must now pass. Do not commit until the gate is green.

## 10. Hand off

- Audit trail: **add-audit** skill.
- Review before merge: **review-changes** skill.
