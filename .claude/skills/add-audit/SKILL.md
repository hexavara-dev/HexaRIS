---
name: add-audit
description: Use when adding audit logging to a model, action, or Query Builder operation.
---

> Follow **`superpowers:test-driven-development`** for the TDD discipline (failing test first). The
> Laravel-specific paths are below.

Two paths: (a) Eloquent model — one trait, automatic coverage; (b) Query Builder / explicit event — call `AuditLogger` directly. Choose based on where the data change happens.

---

## Path A — Eloquent model (automatic)

**When:** The change is performed through an Eloquent model and you want create/update/delete captured automatically.

### 1. Add the trait

```php
// app/Modules/<Name>/Models/<ModelName>.php
use App\Audit\Concerns\IsAudited;

class Invoice extends Model
{
    use IsAudited;

    // CRITICAL: keep every secret field in $hidden.
    // The trait calls auditableAttributes() which strips array_flip($this->getHidden())
    // before writing — so passwords, tokens, and keys are NEVER recorded.
    protected $hidden = ['internal_notes', 'api_token'];
}
```

`App\Models\User` (`app/Models/User.php`) is the canonical example — it uses `IsAudited` and declares `password` and `remember_token` in `$hidden`, so neither ever appears in an audit row.

### 2. What is captured automatically

`IsAudited::bootIsAudited()` (`app/Audit/Concerns/IsAudited.php`) registers three Eloquent event listeners:

| Event | `before` snapshot | `after` snapshot |
|-------|-------------------|------------------|
| `created` | `[]` | all non-hidden attributes |
| `updated` | original values of changed keys only | changed values |
| `deleted` | all non-hidden attributes | `[]` |

All three calls use `AuditLogger::atomic()` — the audit row is written inside the current DB transaction and rolls back if the transaction rolls back.

No further configuration is needed. Do not override `recordAudit()` unless you have a compelling reason.

### 3. Write a Pest test

```php
// tests/Feature/<ModuleName>/InvoiceAuditTest.php
use App\Audit\Models\AuditActivity;
use App\Models\Invoice;

it('records an audit row when an invoice is created', function () {
    $invoice = Invoice::create(['amount' => 100]);

    $row = AuditActivity::where('event', 'created')
        ->where('subject_id', $invoice->id)
        ->first();

    expect($row)->not->toBeNull()
        ->and($row->attribute_changes['new']['amount'])->toBe(100);
});

it('never records hidden attributes', function () {
    $invoice = Invoice::create(['amount' => 100, 'internal_notes' => 'secret']);

    $row = AuditActivity::where('event', 'created')
        ->where('subject_id', $invoice->id)
        ->first();

    expect($row->attribute_changes['new'])->not->toHaveKey('internal_notes');
});
```

See `tests/Feature/Audit/IsAuditedTest.php` for the full fixture pattern (in-test schema creation with `beforeEach`).

---

## Path B — Query Builder / raw / explicit event

**When:** The change happens outside Eloquent (e.g. `DB::table()`, raw SQL, an external API call) or you need to emit a named domain event (`approved`, `exported`, `sync_started`).

### 1. Choose the write mode

| Mode | How it writes | When to use |
|------|---------------|-------------|
| `AuditLogger::atomic()` | Synchronous via `AuditWriter` inside the current DB transaction | Critical events that must roll back if the enclosing transaction rolls back |
| `AuditLogger::async()` | Dispatches `WriteAuditLog` job to the queue | High-volume or non-critical events; avoid synchronous overhead |

### 2. Fluent builder

All methods return `$this`; terminate with `->log('<description>')`.

```php
use App\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

// Example: Query Builder update inside a DB::transaction
DB::transaction(function () use ($orderId, $newStatus) {
    $before = (array) DB::table('orders')->find($orderId);

    DB::table('orders')
        ->where('id', $orderId)
        ->update(['status' => $newStatus]);

    $after = (array) DB::table('orders')->find($orderId);

    AuditLogger::atomic()                       // rolls back if transaction rolls back
        ->subject('orders', $orderId)           // table/type name + record ID
        ->before($before)                       // snapshot before the change
        ->after($after)                         // snapshot after the change
        ->event('approved')                     // domain verb or CRUD keyword
        ->module('Orders')                      // module name for the viewer filter
        ->log('Order approved by manager');     // human-readable description — terminates the builder
});
```

For a high-volume non-critical event (e.g. search queries, view counts) swap `::atomic()` for `::async()` — the signature is identical.

### 3. Available builder methods

| Method | Type | Notes |
|--------|------|-------|
| `->subject(string $type, int\|string $id)` | required | table name or domain type |
| `->before(array $before)` | recommended | empty `[]` for creation events |
| `->after(array $after)` | recommended | empty `[]` for deletion events |
| `->event(string $event)` | required | `created / updated / deleted` or a domain verb |
| `->module(string $module)` | recommended | enables the module filter in `/audit` |
| `->withProperties(array $props)` | optional | any extra key-value context |
| `->by(?Model $causer)` | optional | defaults to `Auth::user()` |
| `->log(string $description)` | **terminator** | writes or dispatches; call last |

### 4. Write a Pest test

```php
// tests/Feature/<ModuleName>/OrderApproveAuditTest.php
use App\Audit\AuditLogger;
use App\Audit\Models\AuditActivity;
use Illuminate\Support\Facades\DB;

it('writes an audit row when an order is approved via Query Builder', function () {
    $id = DB::table('orders')->insertGetId(['status' => 'pending']);

    AuditLogger::atomic()
        ->subject('orders', $id)
        ->before(['status' => 'pending'])
        ->after(['status' => 'approved'])
        ->event('approved')
        ->module('Orders')
        ->log('Order approved');

    $row = AuditActivity::where('subject_type', 'orders')->where('subject_id', $id)->first();
    expect($row)->not->toBeNull()
        ->and($row->attribute_changes['new']['status'])->toBe('approved')
        ->and($row->properties['module'])->toBe('Orders');
});
```

See `tests/Feature/Audit/QueryBuilderAuditTest.php` for the canonical fixture pattern.

---

## Viewing audit entries

Audit entries appear at `GET /audit` (`audit.index`) — a read-only viewer gated by `can:audit.view`. It supports filters: event type, module, date range, and causer. See `app/Modules/Audit/README.md` for the full filter reference.

Auth events (login / logout / failed) are captured automatically by `AuditEventSubscriber` — no extra code needed.

---

## Quality gate

```bash
composer check   # Pint + PHPStan level 6 + Pest — must be green
```
