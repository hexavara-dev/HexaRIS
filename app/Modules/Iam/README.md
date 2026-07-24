# Iam — Identity & Access Management

The `Iam` bounded context owns everything about *who* a user is and *what* they may do. It contains
four aggregates: **Auth**, **Users**, **Roles**, and **Permissions**. The `User` model itself lives at
`app/Models/User` (a core app model), not inside this module.

## Aggregates

- **Auth** — session `login` / `logout`. No public registration or self-service settings by design.
- **Users** — admin user management (full CRUD) with role assignment, at `/iam/users`.
- **Roles** — roles & their permissions (full CRUD) at `/iam/roles`. The `super-admin` role is
  protected: it cannot be edited or deleted.
- **Permissions** — read-only permission catalog at `/iam/permissions`.

## super-admin bypass

`IamServiceProvider` registers a `Gate::before` callback that grants **all** permissions to any user
holding the `super-admin` role (returning `null` for everyone else so normal gate checks proceed).

## Permissions

- `users.viewAny`, `users.create`, `users.update`, `users.delete`
- `roles.viewAny`, `roles.create`, `roles.update`, `roles.delete`
- `permissions.viewAny`

## Routes

- `GET /login` (`login`), `POST /login`, `POST /logout` (`logout`) — Auth.
- `GET /iam/users` (`iam.users.index`) `can:users.viewAny`, plus `create` / `store` / `edit` /
  `update` / `destroy` gated by the matching `users.*` permission.
- `GET /iam/roles` (`iam.roles.index`) `can:roles.viewAny`, plus `create` / `store` / `edit` /
  `update` / `destroy` gated by the matching `roles.*` permission.
- `GET /iam/permissions` (`iam.permissions.index`) `can:permissions.viewAny` — read-only.

Route **names** carry the `iam.` context prefix; **permission** names stay resource-scoped
(`users.*`, `roles.*`, `permissions.viewAny`).
