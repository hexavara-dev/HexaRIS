# Employee

Self-contained `Employee` module.

## Permissions

| Permission | Purpose |
|---|---|
| `employees.viewAny` | List employees |
| `employees.create` | Create an employee |
| `employees.update` | Update an employee |
| `employees.delete` | Delete an employee |

Run `php artisan permission:sync` after changing `permissions.php`.

## Routes

| Method | URI | Name | Permission |
|---|---|---|---|
| `GET` | `employees` | `employees.index` | _(not gated yet)_ |

The remaining CRUD routes (`create`/`store`/`edit`/`update`/`destroy`) are
scaffolded but commented out in `routes/web.php` and in the controller until the
Employee model, migration, FormRequests, and DTO exist. Uncomment each one —
together with its `can:` middleware — as it is implemented.
