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
