# Audit Logging Subsystem Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A unified audit log: a fluent `AuditLogger` with **atomic** (in-transaction) and **async** (queued) dispatch modes that records who-changed-what for both Eloquent models and raw Query Builder operations, plus authentication events, viewable in a self-contained read-only **Audit** module.

**Architecture:** All audit rows are written through one path — `AuditWriter::write($payload)` — which persists an `AuditActivity` (a thin subclass of spatie's `Activity` model) into the existing `activity_log` table (before/after in `attribute_changes`, context in `properties`). `AuditLogger::atomic()` calls the writer synchronously (so it participates in, and rolls back with, the caller's DB transaction); `AuditLogger::async()` dispatches a `WriteAuditLog` queued job carrying a serializable payload. An `IsAudited` trait auto-captures Eloquent create/update/delete; an `AuditEventSubscriber` captures auth events. The Audit module is built with the Plan 1 module system.

**Tech Stack:** Laravel 12.61, spatie/laravel-activitylog 5, spatie/laravel-data, Inertia React + TypeScript, Pest. Quality gate: `composer check` (Pint + Larastan level 6 + Pest). Workflow: feature branch → PR → squash-merge (Lefthook + CI guards active).

---

## Prerequisites (already in place from Plan 1)

- `activity_log` table migrated with columns: `log_name, description, subject_type, subject_id, event, causer_type, causer_id, attribute_changes (json), properties (json), timestamps`.
- Module system: `php artisan module:make`, `php artisan permission:sync`, namespaced Inertia resolver (`Name::pages/Foo`).
- `spatie/laravel-permission` with `HasRoles` on `App\Models\User`.

> **Workflow reminder:** Do all work on a feature branch (`feat/audit-subsystem`). The Lefthook pre-push hook blocks direct pushes to `main`; land via PR + squash-merge. Run `composer check` before every commit.

---

## File Structure

```
app/Audit/
├── Models/AuditActivity.php          # Activity subclass: explicit fillable + array casts
├── AuditWriter.php                   # the single write path (payload -> AuditActivity row)
├── AuditLogger.php                   # fluent builder; ::atomic()/::async(); log()
├── WriteAuditLog.php                 # queued job (async path) -> AuditWriter
├── Concerns/IsAudited.php            # Eloquent trait: auto-capture create/update/delete
├── AuditEventSubscriber.php          # auth.login / auth.logout / auth.failed
└── AuditServiceProvider.php          # binds writer, registers subscriber

app/Modules/Audit/                    # scaffolded by module:make Audit
├── permissions.php                   # ['audit.view']
├── routes/web.php                    # GET /audit -> AuditController (auth + can:audit.view)
├── Http/Controllers/AuditController.php
├── Data/AuditEntryData.php           # DTO shaping a row for the frontend
├── resources/js/pages/Index.tsx      # React viewer: filters + table + before/after diff
└── README.md

bootstrap/providers.php               # register App\Audit\AuditServiceProvider (modify)
```

---

## Task 1: `AuditActivity` model + `AuditWriter`

**Files:**
- Create: `app/Audit/Models/AuditActivity.php`
- Create: `app/Audit/AuditWriter.php`
- Test: `tests/Feature/Audit/AuditWriterTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/AuditWriterTest.php`:

```php
<?php

use App\Audit\AuditWriter;
use App\Audit\Models\AuditActivity;

it('writes an audit row with changes and properties', function () {
    $activity = app(AuditWriter::class)->write([
        'description' => 'Order updated',
        'event' => 'updated',
        'subject_type' => 'orders',
        'subject_id' => 7,
        'causer_type' => null,
        'causer_id' => null,
        'before' => ['status' => 'pending'],
        'after' => ['status' => 'approved'],
        'properties' => ['module' => 'Orders', 'ip' => '127.0.0.1'],
    ]);

    expect($activity)->toBeInstanceOf(AuditActivity::class);

    $fresh = AuditActivity::find($activity->id);
    expect($fresh->event)->toBe('updated')
        ->and($fresh->subject_type)->toBe('orders')
        ->and($fresh->subject_id)->toBe('7')
        ->and($fresh->attribute_changes)->toBe(['old' => ['status' => 'pending'], 'new' => ['status' => 'approved']])
        ->and($fresh->properties)->toBe(['module' => 'Orders', 'ip' => '127.0.0.1'])
        ->and($fresh->log_name)->toBe('audit');
});

it('omits attribute_changes when before and after are empty', function () {
    $activity = app(AuditWriter::class)->write([
        'description' => 'User logged in',
        'event' => 'auth.login',
        'subject_type' => null,
        'subject_id' => null,
        'causer_type' => null,
        'causer_id' => null,
        'before' => [],
        'after' => [],
        'properties' => ['ip' => '127.0.0.1'],
    ]);

    expect(AuditActivity::find($activity->id)->attribute_changes)->toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/AuditWriterTest.php`
Expected: FAIL with "Class App\Audit\AuditWriter not found".

- [ ] **Step 3: Implement the model**

Create `app/Audit/Models/AuditActivity.php`:

```php
<?php

namespace App\Audit\Models;

use Spatie\Activitylog\Models\Activity;

class AuditActivity extends Activity
{
    protected $table = 'activity_log';

    protected $fillable = [
        'log_name',
        'description',
        'subject_type',
        'subject_id',
        'event',
        'causer_type',
        'causer_id',
        'attribute_changes',
        'properties',
    ];

    protected $casts = [
        'attribute_changes' => 'array',
        'properties' => 'array',
    ];
}
```

- [ ] **Step 4: Implement the writer**

Create `app/Audit/AuditWriter.php`:

```php
<?php

namespace App\Audit;

use App\Audit\Models\AuditActivity;

class AuditWriter
{
    /**
     * @param array{
     *   description: string,
     *   event: ?string,
     *   subject_type: ?string,
     *   subject_id: int|string|null,
     *   causer_type: ?string,
     *   causer_id: int|string|null,
     *   before: array<string,mixed>,
     *   after: array<string,mixed>,
     *   properties: array<string,mixed>,
     * } $payload
     */
    public function write(array $payload): AuditActivity
    {
        $hasChanges = $payload['before'] !== [] || $payload['after'] !== [];

        return AuditActivity::create([
            'log_name' => 'audit',
            'description' => $payload['description'],
            'event' => $payload['event'],
            'subject_type' => $payload['subject_type'],
            'subject_id' => $payload['subject_id'],
            'causer_type' => $payload['causer_type'],
            'causer_id' => $payload['causer_id'],
            'attribute_changes' => $hasChanges
                ? ['old' => $payload['before'], 'new' => $payload['after']]
                : null,
            'properties' => $payload['properties'],
        ]);
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/AuditWriterTest.php`
Expected: PASS (2 passed).

- [ ] **Step 6: Commit**

```bash
git add app/Audit/Models/AuditActivity.php app/Audit/AuditWriter.php tests/Feature/Audit/AuditWriterTest.php
git commit -m "feat(audit): add AuditActivity model and AuditWriter"
```

---

## Task 2: `WriteAuditLog` queued job

**Files:**
- Create: `app/Audit/WriteAuditLog.php`
- Test: `tests/Feature/Audit/WriteAuditLogTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/WriteAuditLogTest.php`:

```php
<?php

use App\Audit\Models\AuditActivity;
use App\Audit\WriteAuditLog;

it('writes the audit row when handled', function () {
    $payload = [
        'description' => 'Async order updated',
        'event' => 'updated',
        'subject_type' => 'orders',
        'subject_id' => 9,
        'causer_type' => null,
        'causer_id' => null,
        'before' => [],
        'after' => ['status' => 'shipped'],
        'properties' => ['module' => 'Orders'],
    ];

    (new WriteAuditLog($payload))->handle(app(\App\Audit\AuditWriter::class));

    expect(AuditActivity::where('subject_id', 9)->where('event', 'updated')->exists())->toBeTrue();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/WriteAuditLogTest.php`
Expected: FAIL with "Class App\Audit\WriteAuditLog not found".

- [ ] **Step 3: Implement the job**

Create `app/Audit/WriteAuditLog.php`:

```php
<?php

namespace App\Audit;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class WriteAuditLog implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param array<string,mixed> $payload
     */
    public function __construct(public readonly array $payload) {}

    public function handle(AuditWriter $writer): void
    {
        $writer->write($this->payload);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/WriteAuditLogTest.php`
Expected: PASS (1 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Audit/WriteAuditLog.php tests/Feature/Audit/WriteAuditLogTest.php
git commit -m "feat(audit): add WriteAuditLog queued job"
```

---

## Task 3: `AuditLogger` fluent service (atomic/async)

**Files:**
- Create: `app/Audit/AuditLogger.php`
- Test: `tests/Feature/Audit/AuditLoggerTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/AuditLoggerTest.php`:

```php
<?php

use App\Audit\AuditLogger;
use App\Audit\Models\AuditActivity;
use App\Audit\WriteAuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

it('atomic mode writes immediately', function () {
    AuditLogger::atomic()
        ->subject('orders', 7)
        ->before(['status' => 'pending'])
        ->after(['status' => 'approved'])
        ->event('updated')
        ->module('Orders')
        ->log('Order approved');

    $row = AuditActivity::where('subject_type', 'orders')->where('subject_id', 7)->first();
    expect($row)->not->toBeNull()
        ->and($row->event)->toBe('updated')
        ->and($row->attribute_changes)->toBe(['old' => ['status' => 'pending'], 'new' => ['status' => 'approved']])
        ->and($row->properties['module'])->toBe('Orders');
});

it('atomic mode rolls back with the surrounding transaction', function () {
    try {
        DB::transaction(function () {
            AuditLogger::atomic()->subject('orders', 8)->event('deleted')->log('Order deleted');
            throw new RuntimeException('boom');
        });
    } catch (RuntimeException) {
        // expected
    }

    expect(AuditActivity::where('subject_id', 8)->exists())->toBeFalse();
});

it('records the authenticated user as causer', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    AuditLogger::atomic()->subject('orders', 7)->event('updated')->log('x');

    $row = AuditActivity::where('subject_id', 7)->first();
    expect($row->causer_id)->toBe((string) $user->id)
        ->and($row->causer_type)->toBe($user->getMorphClass());
});

it('async mode dispatches the WriteAuditLog job instead of writing inline', function () {
    Queue::fake();

    AuditLogger::async()->subject('orders', 7)->event('viewed')->log('Order viewed');

    Queue::assertPushed(WriteAuditLog::class, function (WriteAuditLog $job) {
        return $job->payload['subject_id'] === 7 && $job->payload['event'] === 'viewed';
    });
    expect(AuditActivity::count())->toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/AuditLoggerTest.php`
Expected: FAIL with "Class App\Audit\AuditLogger not found".

- [ ] **Step 3: Implement the service**

Create `app/Audit/AuditLogger.php`:

```php
<?php

namespace App\Audit;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    private ?string $subjectType = null;

    private int|string|null $subjectId = null;

    private ?string $event = null;

    /** @var array<string,mixed> */
    private array $before = [];

    /** @var array<string,mixed> */
    private array $after = [];

    /** @var array<string,mixed> */
    private array $properties = [];

    private ?Model $causer = null;

    private function __construct(private readonly string $mode) {}

    public static function atomic(): self
    {
        return new self('atomic');
    }

    public static function async(): self
    {
        return new self('async');
    }

    public function subject(string $type, int|string $id): self
    {
        $this->subjectType = $type;
        $this->subjectId = $id;

        return $this;
    }

    /**
     * @param array<string,mixed> $before
     */
    public function before(array $before): self
    {
        $this->before = $before;

        return $this;
    }

    /**
     * @param array<string,mixed> $after
     */
    public function after(array $after): self
    {
        $this->after = $after;

        return $this;
    }

    public function event(string $event): self
    {
        $this->event = $event;

        return $this;
    }

    public function module(string $module): self
    {
        $this->properties['module'] = $module;

        return $this;
    }

    /**
     * @param array<string,mixed> $properties
     */
    public function withProperties(array $properties): self
    {
        $this->properties = array_merge($this->properties, $properties);

        return $this;
    }

    public function by(?Model $causer): self
    {
        $this->causer = $causer;

        return $this;
    }

    public function log(string $description): void
    {
        $causer = $this->causer ?? Auth::user();

        $payload = [
            'description' => $description,
            'event' => $this->event,
            'subject_type' => $this->subjectType,
            'subject_id' => $this->subjectId,
            'causer_type' => $causer?->getMorphClass(),
            'causer_id' => $causer?->getKey(),
            'before' => $this->before,
            'after' => $this->after,
            'properties' => array_merge(['ip' => Request::ip()], $this->properties),
        ];

        if ($this->mode === 'async') {
            WriteAuditLog::dispatch($payload);

            return;
        }

        app(AuditWriter::class)->write($payload);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/AuditLoggerTest.php`
Expected: PASS (4 passed).

- [ ] **Step 5: Run the full gate**

Run: `composer check`
Expected: Pint + PHPStan level 6 + Pest all green.

- [ ] **Step 6: Commit**

```bash
git add app/Audit/AuditLogger.php tests/Feature/Audit/AuditLoggerTest.php
git commit -m "feat(audit): add AuditLogger with atomic and async modes"
```

---

## Task 4: `IsAudited` trait for Eloquent models

**Files:**
- Create: `app/Audit/Concerns/IsAudited.php`
- Test: `tests/Feature/Audit/IsAuditedTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/IsAuditedTest.php`. It defines a fixture model + table inline so the trait is tested in isolation:

```php
<?php

use App\Audit\Concerns\IsAudited;
use App\Audit\Models\AuditActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/**
 * Fixture model used only by this test.
 */
class AuditedWidget extends Model
{
    use IsAudited;

    protected $table = 'audited_widgets';

    protected $guarded = [];

    protected $hidden = ['secret'];
}

beforeEach(function () {
    Schema::create('audited_widgets', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('secret')->nullable();
        $table->timestamps();
    });
});

it('logs creation with the new attributes', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);

    $row = AuditActivity::where('event', 'created')->where('subject_id', $widget->id)->first();
    expect($row)->not->toBeNull()
        ->and($row->subject_type)->toBe(AuditedWidget::class)
        ->and($row->attribute_changes['new']['name'])->toBe('Alpha');
});

it('logs an update with before and after', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);
    $widget->update(['name' => 'Beta']);

    $row = AuditActivity::where('event', 'updated')->where('subject_id', $widget->id)->first();
    expect($row->attribute_changes['old']['name'])->toBe('Alpha')
        ->and($row->attribute_changes['new']['name'])->toBe('Beta');
});

it('logs deletion', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);
    $id = $widget->id;
    $widget->delete();

    expect(AuditActivity::where('event', 'deleted')->where('subject_id', $id)->exists())->toBeTrue();
});

it('never records hidden attributes', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha', 'secret' => 'p@ss']);

    $row = AuditActivity::where('event', 'created')->where('subject_id', $widget->id)->first();
    expect($row->attribute_changes['new'])->not->toHaveKey('secret');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/IsAuditedTest.php`
Expected: FAIL with "Trait App\Audit\Concerns\IsAudited not found".

- [ ] **Step 3: Implement the trait**

Create `app/Audit/Concerns/IsAudited.php`:

```php
<?php

namespace App\Audit\Concerns;

use App\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;

/**
 * Auto-captures create/update/delete on the model into the audit log (atomic mode).
 * Hidden attributes are never recorded.
 *
 * @mixin Model
 */
trait IsAudited
{
    public static function bootIsAudited(): void
    {
        static::created(function (Model $model): void {
            $model->recordAudit('created', [], $model->auditableAttributes($model->getAttributes()));
        });

        static::updated(function (Model $model): void {
            $changes = $model->auditableAttributes($model->getChanges());
            $before = array_intersect_key($model->auditableAttributes($model->getOriginal()), $changes);
            $model->recordAudit('updated', $before, $changes);
        });

        static::deleted(function (Model $model): void {
            $model->recordAudit('deleted', $model->auditableAttributes($model->getAttributes()), []);
        });
    }

    /**
     * @param array<string,mixed> $before
     * @param array<string,mixed> $after
     */
    public function recordAudit(string $event, array $before, array $after): void
    {
        AuditLogger::atomic()
            ->subject($this->getMorphClass(), $this->getKey())
            ->before($before)
            ->after($after)
            ->event($event)
            ->log(class_basename($this)." {$event}");
    }

    /**
     * Strip hidden attributes (e.g. passwords) from an attribute array.
     *
     * @param array<string,mixed> $attributes
     * @return array<string,mixed>
     */
    public function auditableAttributes(array $attributes): array
    {
        return array_diff_key($attributes, array_flip($this->getHidden()));
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/IsAuditedTest.php`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Audit/Concerns/IsAudited.php tests/Feature/Audit/IsAuditedTest.php
git commit -m "feat(audit): add IsAudited trait for Eloquent auto-capture"
```

---

## Task 5: `AuditEventSubscriber` (auth events)

**Files:**
- Create: `app/Audit/AuditEventSubscriber.php`
- Test: `tests/Feature/Audit/AuditEventSubscriberTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/AuditEventSubscriberTest.php`:

```php
<?php

use App\Audit\AuditEventSubscriber;
use App\Audit\Models\AuditActivity;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

beforeEach(function () {
    // Register the subscriber directly so the test does not depend on the provider.
    Event::subscribe(AuditEventSubscriber::class);
});

it('logs a login as auth.login with the causer', function () {
    $user = User::factory()->create();

    event(new Login('web', $user, false));

    $row = AuditActivity::where('event', 'auth.login')->first();
    expect($row)->not->toBeNull()
        ->and($row->causer_id)->toBe((string) $user->id);
});

it('logs a logout as auth.logout', function () {
    $user = User::factory()->create();

    event(new Logout('web', $user));

    expect(AuditActivity::where('event', 'auth.logout')->exists())->toBeTrue();
});

it('logs a failed attempt as auth.failed with the attempted email', function () {
    event(new Failed('web', null, ['email' => 'nobody@example.com', 'password' => 'secret']));

    $row = AuditActivity::where('event', 'auth.failed')->first();
    expect($row)->not->toBeNull()
        ->and($row->properties['email'])->toBe('nobody@example.com')
        ->and($row->properties)->not->toHaveKey('password');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/AuditEventSubscriberTest.php`
Expected: FAIL with "Class App\Audit\AuditEventSubscriber not found".

- [ ] **Step 3: Implement the subscriber**

Create `app/Audit/AuditEventSubscriber.php`:

```php
<?php

namespace App\Audit;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class AuditEventSubscriber
{
    public function handleLogin(Login $event): void
    {
        AuditLogger::async()->event('auth.login')->by($event->user)->log('User logged in');
    }

    public function handleLogout(Logout $event): void
    {
        AuditLogger::async()->event('auth.logout')->by($event->user)->log('User logged out');
    }

    public function handleFailed(Failed $event): void
    {
        AuditLogger::async()
            ->event('auth.failed')
            ->withProperties(['email' => $event->credentials['email'] ?? null])
            ->log('Failed login attempt');
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(Login::class, [self::class, 'handleLogin']);
        $events->listen(Logout::class, [self::class, 'handleLogout']);
        $events->listen(Failed::class, [self::class, 'handleFailed']);
    }
}
```

> Note: `$event->user` on `Logout`/`Login` is typed `?Authenticatable`. `AuditLogger::by()` accepts `?Model`; the framework's `User` is a `Model`, and PHPStan treats `Authenticatable` here as acceptable because `by()` is nullable. If Larastan flags the `by($event->user)` type, cast with `/** @var \Illuminate\Database\Eloquent\Model|null $u */` — but with the default `User` model this passes at level 6.

- [ ] **Step 4: Run test to verify it passes**

The async logger dispatches a job; in tests the default queue connection is `sync`, so the row is written immediately. Confirm `phpunit.xml` sets `QUEUE_CONNECTION=sync` (Laravel default for tests). If it is not present, add `<env name="QUEUE_CONNECTION" value="sync"/>` to `phpunit.xml`.

Run: `vendor/bin/pest tests/Feature/Audit/AuditEventSubscriberTest.php`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add app/Audit/AuditEventSubscriber.php tests/Feature/Audit/AuditEventSubscriberTest.php phpunit.xml
git commit -m "feat(audit): add auth event subscriber (login/logout/failed)"
```

---

## Task 6: `AuditServiceProvider` + registration

**Files:**
- Create: `app/Audit/AuditServiceProvider.php`
- Modify: `bootstrap/providers.php`
- Test: `tests/Feature/Audit/AuditServiceProviderTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/AuditServiceProviderTest.php`:

```php
<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Illuminate\Auth\Events\Login;

it('wires the auth subscriber so a login is audited end-to-end', function () {
    $user = User::factory()->create();

    event(new Login('web', $user, false));

    expect(AuditActivity::where('event', 'auth.login')->where('causer_id', $user->id)->exists())->toBeTrue();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/AuditServiceProviderTest.php`
Expected: FAIL — no subscriber registered yet, so no `auth.login` row exists.

- [ ] **Step 3: Implement the provider**

Create `app/Audit/AuditServiceProvider.php`:

```php
<?php

namespace App\Audit;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AuditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuditWriter::class);
    }

    public function boot(): void
    {
        Event::subscribe(AuditEventSubscriber::class);
    }
}
```

- [ ] **Step 4: Register the provider**

In `bootstrap/providers.php`, append `App\Audit\AuditServiceProvider::class` (keep all existing entries):

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Modular\ModuleServiceProvider::class,
    App\Audit\AuditServiceProvider::class,
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/AuditServiceProviderTest.php`
Expected: PASS (1 passed).

- [ ] **Step 6: Commit**

```bash
git add app/Audit/AuditServiceProvider.php bootstrap/providers.php tests/Feature/Audit/AuditServiceProviderTest.php
git commit -m "feat(audit): register AuditServiceProvider and auth subscriber"
```

---

## Task 7: Query Builder path (explicit logging)

**Files:**
- Test: `tests/Feature/Audit/QueryBuilderAuditTest.php`
- Modify: `docs/superpowers/specs/2026-06-09-laravel-modular-ai-template-design.md` (no — see note)

This task proves and documents the non-Eloquent path. No new production code — it exercises `AuditLogger` directly, the way a developer would for a `DB::table()` operation.

- [ ] **Step 1: Write the test**

Create `tests/Feature/Audit/QueryBuilderAuditTest.php`:

```php
<?php

use App\Audit\AuditLogger;
use App\Audit\Models\AuditActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

beforeEach(function () {
    Schema::create('legacy_orders', function (Blueprint $table) {
        $table->id();
        $table->string('status');
    });
});

it('audits a raw Query Builder update via explicit logging', function () {
    $id = DB::table('legacy_orders')->insertGetId(['status' => 'pending']);

    $before = (array) DB::table('legacy_orders')->find($id);
    DB::table('legacy_orders')->where('id', $id)->update(['status' => 'approved']);
    $after = (array) DB::table('legacy_orders')->find($id);

    AuditLogger::atomic()
        ->subject('legacy_orders', $id)
        ->before($before)
        ->after($after)
        ->event('updated')
        ->module('Legacy')
        ->log('Legacy order approved');

    $row = AuditActivity::where('subject_type', 'legacy_orders')->where('subject_id', $id)->first();
    expect($row->attribute_changes['old']['status'])->toBe('pending')
        ->and($row->attribute_changes['new']['status'])->toBe('approved')
        ->and($row->properties['module'])->toBe('Legacy');
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/QueryBuilderAuditTest.php`
Expected: PASS (1 passed) — `AuditLogger` already supports this; the test documents the pattern.

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Audit/QueryBuilderAuditTest.php
git commit -m "test(audit): document and verify the Query Builder audit path"
```

---

## Task 8: Scaffold Audit module + controller + route + permission

**Files:**
- Generate: `app/Modules/Audit/` (via `php artisan module:make Audit`)
- Modify: `app/Modules/Audit/permissions.php`
- Modify: `app/Modules/Audit/routes/web.php`
- Create: `app/Modules/Audit/Http/Controllers/AuditController.php`
- Test: `tests/Feature/Audit/AuditControllerTest.php`

- [ ] **Step 1: Scaffold the module**

```bash
php artisan module:make Audit
```
Expected: "Module Audit created at app/Modules/Audit."

- [ ] **Step 2: Declare the permission**

Replace `app/Modules/Audit/permissions.php` with:

```php
<?php

return [
    'audit.view',
];
```

- [ ] **Step 3: Write the failing test**

Create `tests/Feature/Audit/AuditControllerTest.php`:

```php
<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('audit.view', 'web');
});

it('forbids users without the audit.view permission', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/audit')->assertForbidden();
});

it('renders the audit viewer for permitted users', function () {
    $user = User::factory()->create()->givePermissionTo('audit.view');
    AuditActivity::create([
        'log_name' => 'audit',
        'description' => 'Order updated',
        'event' => 'updated',
        'subject_type' => 'orders',
        'subject_id' => 1,
        'properties' => ['module' => 'Orders'],
    ]);

    $this->actingAs($user)
        ->get('/audit')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Audit::pages/Index')
            ->has('activities.data', 1)
            ->has('filters')
        );
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/AuditControllerTest.php`
Expected: FAIL — route `/audit` does not exist yet (404), and the controller is missing.

- [ ] **Step 5: Define the route**

Replace `app/Modules/Audit/routes/web.php` with:

```php
<?php

use App\Modules\Audit\Http\Controllers\AuditController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'can:audit.view'])
    ->get('/audit', AuditController::class)
    ->name('audit.index');
```

> The root `ModuleServiceProvider` already wraps this file in the `web` middleware group, so do not add `web` here.

- [ ] **Step 6: Implement the controller (minimal — filtering added in Task 9)**

Create `app/Modules/Audit/Http/Controllers/AuditController.php`:

```php
<?php

namespace App\Modules\Audit\Http\Controllers;

use App\Audit\Models\AuditActivity;
use App\Modules\Audit\Data\AuditEntryData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController
{
    public function __invoke(Request $request): Response
    {
        $activities = AuditActivity::query()
            ->with('causer')
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditActivity $a) => AuditEntryData::fromModel($a));

        return Inertia::render('Audit::pages/Index', [
            'activities' => $activities,
            'filters' => $request->only(['event', 'causer_id', 'module', 'date_from', 'date_to']),
            'events' => AuditActivity::query()->whereNotNull('event')->distinct()->orderBy('event')->pluck('event'),
        ]);
    }
}
```

> `AuditEntryData` is created in Task 9. To make this task's test pass first, create a **temporary** minimal DTO now and replace it in Task 9 — OR implement Task 9's DTO here. For a clean TDD flow, create the DTO now (jump to Task 9 Step 3's `AuditEntryData` code), then Task 9 only adds filtering. Choose one; this plan assumes you create the DTO now using the exact code from Task 9 Step 3.

- [ ] **Step 7: Create the DTO** — use the exact `AuditEntryData` code from **Task 9, Step 3** (`app/Modules/Audit/Data/AuditEntryData.php`).

- [ ] **Step 8: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/AuditControllerTest.php`
Expected: PASS (2 passed). (The React page does not need to exist for `assertInertia` to pass — it asserts the response, not the rendered component.)

- [ ] **Step 9: Commit**

```bash
git add app/Modules/Audit/permissions.php app/Modules/Audit/routes/web.php app/Modules/Audit/Http/Controllers/AuditController.php app/Modules/Audit/Data/AuditEntryData.php tests/Feature/Audit/AuditControllerTest.php
git commit -m "feat(audit): scaffold Audit module with viewer controller and permission"
```

---

## Task 9: `AuditEntryData` DTO + controller filtering

**Files:**
- Create/confirm: `app/Modules/Audit/Data/AuditEntryData.php`
- Modify: `app/Modules/Audit/Http/Controllers/AuditController.php`
- Test: `tests/Feature/Audit/AuditFilterTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/Audit/AuditFilterTest.php`:

```php
<?php

use App\Audit\Models\AuditActivity;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('audit.view', 'web');
    $this->user = User::factory()->create()->givePermissionTo('audit.view');

    AuditActivity::create(['log_name' => 'audit', 'description' => 'a', 'event' => 'created', 'properties' => ['module' => 'Orders']]);
    AuditActivity::create(['log_name' => 'audit', 'description' => 'b', 'event' => 'updated', 'properties' => ['module' => 'Users']]);
});

it('filters by event', function () {
    $this->actingAs($this->user)
        ->get('/audit?event=created')
        ->assertInertia(fn (Assert $page) => $page->has('activities.data', 1));
});

it('filters by module', function () {
    $this->actingAs($this->user)
        ->get('/audit?module=Users')
        ->assertInertia(fn (Assert $page) => $page->has('activities.data', 1));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vendor/bin/pest tests/Feature/Audit/AuditFilterTest.php`
Expected: FAIL — filters are not applied yet, so both rows return for each query (`activities.data` has 2, not 1).

- [ ] **Step 3: Confirm the DTO**

Create (if not already created in Task 8) `app/Modules/Audit/Data/AuditEntryData.php`:

```php
<?php

namespace App\Modules\Audit\Data;

use App\Audit\Models\AuditActivity;
use Spatie\LaravelData\Data;

class AuditEntryData extends Data
{
    /**
     * @param array{old: array<string,mixed>, new: array<string,mixed>}|null $changes
     * @param array<string,mixed> $properties
     */
    public function __construct(
        public int $id,
        public string $description,
        public ?string $event,
        public ?string $subjectType,
        public int|string|null $subjectId,
        public ?string $causer,
        public ?array $changes,
        public array $properties,
        public string $createdAt,
    ) {}

    public static function fromModel(AuditActivity $a): self
    {
        return new self(
            id: $a->id,
            description: $a->description,
            event: $a->event,
            subjectType: $a->subject_type,
            subjectId: $a->subject_id,
            causer: $a->causer?->name ?? ($a->causer_id !== null ? "#{$a->causer_id}" : null),
            changes: $a->attribute_changes,
            properties: $a->properties ?? [],
            createdAt: $a->created_at?->toIso8601String() ?? '',
        );
    }
}
```

> `$a->causer?->name` assumes the causer model has a `name` attribute (the default `User` does).

- [ ] **Step 4: Add filtering to the controller**

Replace the query in `app/Modules/Audit/Http/Controllers/AuditController.php`'s `__invoke` with a filtered version:

```php
public function __invoke(Request $request): Response
{
    $activities = AuditActivity::query()
        ->with('causer')
        ->when($request->filled('event'), fn ($q) => $q->where('event', $request->string('event')))
        ->when($request->filled('causer_id'), fn ($q) => $q->where('causer_id', $request->integer('causer_id')))
        ->when($request->filled('module'), fn ($q) => $q->where('properties->module', $request->string('module')))
        ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
        ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')))
        ->latest()
        ->paginate(25)
        ->withQueryString()
        ->through(fn (AuditActivity $a) => AuditEntryData::fromModel($a));

    return Inertia::render('Audit::pages/Index', [
        'activities' => $activities,
        'filters' => $request->only(['event', 'causer_id', 'module', 'date_from', 'date_to']),
        'events' => AuditActivity::query()->whereNotNull('event')->distinct()->orderBy('event')->pluck('event'),
    ]);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `vendor/bin/pest tests/Feature/Audit/AuditFilterTest.php`
Expected: PASS (2 passed).

- [ ] **Step 6: Run the full gate**

Run: `composer check`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Audit/Data/AuditEntryData.php app/Modules/Audit/Http/Controllers/AuditController.php tests/Feature/Audit/AuditFilterTest.php
git commit -m "feat(audit): add AuditEntryData DTO and viewer filtering"
```

---

## Task 10: Audit viewer React page

**Files:**
- Create: `app/Modules/Audit/resources/js/pages/Index.tsx`

- [ ] **Step 1: Implement the page**

Create `app/Modules/Audit/resources/js/pages/Index.tsx`:

```tsx
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface AuditEntry {
    id: number;
    description: string;
    event: string | null;
    subjectType: string | null;
    subjectId: number | string | null;
    causer: string | null;
    changes: { old: Record<string, unknown>; new: Record<string, unknown> } | null;
    properties: Record<string, unknown>;
    createdAt: string;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    activities: Paginated<AuditEntry>;
    filters: { event?: string; module?: string; date_from?: string; date_to?: string };
    events: string[];
}

export default function Index({ activities, filters, events }: Props) {
    const [event, setEvent] = useState(filters.event ?? '');
    const [module, setModule] = useState(filters.module ?? '');

    const applyFilters = () => {
        router.get('/audit', { event, module }, { preserveState: true, replace: true });
    };

    return (
        <div className="p-6">
            <Head title="Audit log" />
            <h1 className="mb-4 text-2xl font-semibold">Audit log</h1>

            <div className="mb-4 flex flex-wrap gap-2">
                <select
                    className="rounded border px-2 py-1"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                >
                    <option value="">All events</option>
                    {events.map((ev) => (
                        <option key={ev} value={ev}>
                            {ev}
                        </option>
                    ))}
                </select>
                <input
                    className="rounded border px-2 py-1"
                    placeholder="Module"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                />
                <button className="rounded bg-black px-3 py-1 text-white" onClick={applyFilters}>
                    Filter
                </button>
            </div>

            <div className="overflow-x-auto rounded border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-2">When</th>
                            <th className="p-2">Event</th>
                            <th className="p-2">Description</th>
                            <th className="p-2">Subject</th>
                            <th className="p-2">By</th>
                            <th className="p-2">Changes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.data.map((a) => (
                            <tr key={a.id} className="border-t align-top">
                                <td className="p-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                                <td className="p-2">{a.event}</td>
                                <td className="p-2">{a.description}</td>
                                <td className="p-2">
                                    {a.subjectType ? `${a.subjectType}#${a.subjectId}` : '—'}
                                </td>
                                <td className="p-2">{a.causer ?? '—'}</td>
                                <td className="p-2">
                                    {a.changes ? (
                                        <pre className="max-w-md overflow-x-auto text-xs">
                                            {JSON.stringify(a.changes, null, 2)}
                                        </pre>
                                    ) : (
                                        '—'
                                    )}
                                </td>
                            </tr>
                        ))}
                        {activities.data.length === 0 && (
                            <tr>
                                <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                                    No audit entries.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify the build and frontend gate**

Run: `npm run build`
Expected: build succeeds, the module page is picked up by the Vite glob.

Run: `npm run format:check && npx eslint .`
Expected: both pass. If Prettier flags the new file, run `npm run format` then re-check.

- [ ] **Step 3: Commit**

```bash
git add app/Modules/Audit/resources/js/pages/Index.tsx
git commit -m "feat(audit): add Audit viewer React page"
```

---

## Task 11: Module README, permission sync, dogfood

**Files:**
- Modify: `app/Modules/Audit/README.md`

- [ ] **Step 1: Document the module**

Replace `app/Modules/Audit/README.md` with:

```markdown
# Audit

Read-only audit log viewer.

## Permissions

- `audit.view` — view the audit log.

## Routes

- `GET /audit` (`audit.index`) — viewer with filters (event, module, date range).

## Where audit entries come from

- **Eloquent models:** add the `App\Audit\Concerns\IsAudited` trait — create/update/delete are
  captured automatically (atomic mode; hidden attributes excluded).
- **Query Builder / raw SQL:** call the logger explicitly, e.g.
  `AuditLogger::atomic()->subject('orders', $id)->before($old)->after($new)->event('updated')->log('...')`.
- **Auth events:** login/logout/failed are recorded as `auth.login` / `auth.logout` / `auth.failed`.

Use `AuditLogger::atomic()` for critical events (rolls back with the transaction) and
`AuditLogger::async()` for high-volume/non-critical events (queued).
```

- [ ] **Step 2: Sync permissions**

Run: `php artisan permission:sync`
Expected: output includes `audit.view` among synced permissions.

- [ ] **Step 3: Dogfood end-to-end**

```bash
php artisan migrate --force
php artisan permission:sync
```

Run: `php artisan route:list --name=audit`
Expected: `audit.index` route listed, served from `app/Modules/Audit/routes/web.php`.

- [ ] **Step 4: Full gate**

Run: `composer check`
Expected: all green (Pint + PHPStan level 6 + Pest, all Audit tests passing).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/Modules/Audit/README.md
git commit -m "docs(audit): document the Audit module"
```

---

## Self-Review

**Spec coverage (Section 5 — Logging):**
- 5.1 Audit log unified for Eloquent + Query Builder → Tasks 1, 3, 4, 7 ✅
- Atomic mode (in-transaction) → Task 3 (rollback test) ✅
- Async mode (queued) → Tasks 2, 3 ✅
- Eloquent auto-capture trait → Task 4 ✅
- Non-Eloquent explicit path → Task 7 ✅
- 5.2 Authentication log (login/logout/failed) → Tasks 5, 6 ✅
- 5.3 Application/system log — unchanged Laravel Monolog channels; nothing to build (out of scope, correctly) ✅
- 5.4 Audit Viewer (read-only React, filters, before/after diff) → Tasks 8, 9, 10 ✅
- Audit module declares `audit.view`, namespaced Inertia page → Tasks 8, 10 ✅

**Out of scope (correctly deferred to a later plan):** Users module, RBAC management UI.

**Type consistency:** `AuditWriter::write(array): AuditActivity`, `AuditLogger` fluent methods (`subject/before/after/event/module/withProperties/by/log`), `WriteAuditLog->payload`, `AuditEntryData::fromModel(AuditActivity)` are referenced identically across tasks. Payload keys (`description, event, subject_type, subject_id, causer_type, causer_id, before, after, properties`) match between `AuditLogger::log()`, `WriteAuditLog`, and `AuditWriter::write()`. ✅

**Placeholder scan:** Every code step contains complete code. Task 8's note about creating the DTO early is resolved by reusing Task 9 Step 3's exact code (no placeholder). ✅

**Known design choices:**
- `subject_id` is read back as a string (SQLite morph id) — tests assert against string form. Acceptable; the viewer treats it as `number | string`.
- Auth events use **async** mode (queued; runs sync in tests). Model changes and explicit critical calls use **atomic**.
- `properties->module` JSON filter (Task 9) works on SQLite and MySQL via Laravel's JSON where.

---

## Next plan (not in scope here)

**Plan 3 — Built-in management modules:** `Users` (CRUD + Profile) and `Rbac` (Role/Permission UI + `Gate::before` super-admin), both using `IsAudited`. Then **Plan 4 — the skill pipeline + Scramble docs.**
