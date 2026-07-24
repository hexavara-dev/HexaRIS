# "Sync permissions" button on `/iam/permissions` — Design

**Date:** 2026-06-11
**Status:** Approved (user: "oke langsung gas sampe push commit")

## Goal

Let an authorized admin run the module permission reconcile (`php artisan permission:sync`) from the
UI instead of the CLI, via a button on the `/iam/permissions` page. Additive only (creates missing
permissions; never deletes), audited, with a toast reporting the result.

## Decisions (from brainstorming)

- **Base branch:** build on `refactor/iam-module` → the commits join **PR #20** (awaiting approval).
  The permissions page already lives in the `Iam` module there.
- **Gating:** a **new permission `permissions.sync`**; the route is gated `can:permissions.sync`;
  super-admin bypasses. The button only renders when `usePermissions().can('permissions.sync')`.
- **Prune:** **additive only** in the UI (no delete). The destructive `--prune` stays CLI-only. No
  confirm dialog (the op is idempotent and safe).
- **Audit:** yes — an atomic domain event `permissions.synced`.
- **Build skill:** `add-action` (single operation, not CRUD).

## Architecture

### Reusable sync unit (DRY)

Extract the reconcile logic from `SyncPermissionsCommand::handle()` into
**`App\Modular\PermissionSynchronizer`** (next to `PermissionRegistry`):

```php
final class PermissionSynchronizer
{
    public function __construct(private readonly PermissionRegistry $registry) {}

    /** @return array{declared:int, created:int, invalid:array<int,string>} */
    public function sync(bool $prune = false): array
    {
        $declared = $this->registry->all();
        $invalid = array_values(array_filter($declared, fn ($n) => ! PermissionRegistry::isValidName($n)));
        if ($invalid !== []) {
            return ['declared' => count($declared), 'created' => 0, 'invalid' => $invalid];
        }

        $existing = Permission::query()->pluck('name')->all();
        $created = 0;
        foreach ($declared as $name) {
            if (! in_array($name, $existing, true)) { $created++; }
            Permission::findOrCreate($name, 'web');
        }
        if ($prune) {
            Permission::whereNotIn('name', $declared)->delete();
        }

        return ['declared' => count($declared), 'created' => $created, 'invalid' => []];
    }
}
```

`SyncPermissionsCommand` is refactored to call `$synchronizer->sync($this->option('prune'))`,
reporting invalid names as a failure and otherwise printing
`"{declared} permissions synced ({created} new)."` (CLI behavior preserved + slightly enriched).

### Route + controller

- `app/Modules/Iam/permissions.php`: add `'permissions.sync'`.
- `app/Modules/Iam/routes/web.php` (inside the `prefix('iam')->name('iam.')` group):
  ```php
  Route::post('permissions/sync', [PermissionController::class, 'sync'])
      ->name('permissions.sync')
      ->middleware('can:permissions.sync');
  ```
  → `POST /iam/permissions/sync`, name `iam.permissions.sync`.
- `PermissionController::sync(Request $request, PermissionSynchronizer $synchronizer): RedirectResponse`:
  - `$result = $synchronizer->sync();` (additive — no prune).
  - If `$result['invalid'] !== []` → `redirect()->back()->with('error', 'Invalid permission names: '.implode(', ', $invalid))` (nothing was created).
  - Else audit + flash:
    ```php
    AuditLogger::atomic()->event('permissions.synced')->module('Iam')->by($request->user())
        ->withProperties(['declared' => $result['declared'], 'created' => $result['created']])
        ->log("Synced {$result['declared']} permissions ({$result['created']} new)");
    return redirect()->back()->with('success', "Synced {$result['declared']} permissions ({$result['created']} new).");
    ```

### Frontend

`Iam::pages/permissions/Index.tsx`: add a **"Sync permissions"** button into the `PageHeader`
`actions` slot, gated by `usePermissions().can('permissions.sync')`. On click:
`router.post(route('iam.permissions.sync'), {}, { preserveScroll: true })` with a `processing` state
(button shows a spinner + "Syncing…", disabled while in flight). The existing flash → sonner toast
shows the success/error message; the page re-renders with the refreshed `groups`.

## Testing

- **Unit `tests/Unit/PermissionSynchronizerTest.php`:** creates missing permissions; idempotent
  (second call → `created: 0`); `created` count correct; invalid declared name → `invalid` populated,
  nothing created.
- **Feature `tests/Feature/Iam/PermissionSyncTest.php`:** `POST /iam/permissions/sync` →
  403 without `permissions.sync`; 200/redirect with it (or as super-admin); permissions exist after;
  an audit row with event `permissions.synced` is written; flash `success` set. (Inertia test quirks:
  `config(['inertia.testing.ensure_pages_exist' => false])` + `withoutVite()` where needed.)
- **Frontend:** `npm run types` + `npm run lint` + `npm run build` green; button gated.
- `composer check` green.

## Out of scope

- Prune/delete from the UI (CLI `--prune` only).
- A confirm dialog (additive sync is safe).
- Scheduling/auto-sync.

## Risks & mitigations

- **Unauthorized sync** → route gated `can:permissions.sync`; a 403 test covers it.
- **Invalid declared name crashes the request** → the synchronizer validates first and returns
  `invalid` without writing; the controller flashes an error.
- **Double-submit** → the button disables during the in-flight request; the op is idempotent anyway.
