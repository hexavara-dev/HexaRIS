---
name: create-module
description: Use when adding a brand-new bounded context (self-contained module) to the template. To add a resource into an existing context like Iam, use add-resource instead.
---

> Follow **`superpowers:test-driven-development`** for the TDD discipline (failing test first). The
> Laravel-specific steps are below.

A module is a **bounded context** that may own several aggregates/resources (the built-in `Iam`
context holds Auth, Users, Roles, and Permissions). Use this skill only for a **new** context. To
add a CRUD resource into an existing context use **add-resource**; for a single operation use
**add-action**.

## 1. Scaffold the module

```bash
php artisan module:make <StudlyName>
```

`MakeModuleCommand` (`app/Modular/Console/MakeModuleCommand.php`) creates the full tree under `app/Modules/<StudlyName>/` and writes these stubs automatically:

```
module.json                          # manifest
permissions.php                      # permission declarations (empty stub)
routes/web.php                       # auto-loaded under web middleware group
routes/api.php                       # auto-loaded under api middleware + /api prefix
Providers/<StudlyName>ServiceProvider.php
Database/Migrations/.gitkeep         # auto-loaded by ModuleServiceProvider
resources/js/pages/.gitkeep          # React pages (namespaced resolver)
README.md
```

No manual bootstrap/config edits are needed — `ModuleServiceProvider` discovers every `module.json` at boot.

## 2. Fill in `module.json`

Open `app/Modules/<StudlyName>/module.json` and set the four required fields:

```json
{
    "name": "Blog",
    "alias": "blog",
    "version": "1.0.0",
    "description": "Blog bounded context",
    "dependencies": []
}
```

- `name`: PascalCase, matches the directory.
- `alias`: kebab-case, used in permission names and route prefixes.
- `version`: semver string.
- `dependencies`: advisory list of other module aliases this module relies on. The framework does not enforce load order; list them so human readers know what must be present.

## 3. Declare initial permissions

Edit `app/Modules/<StudlyName>/permissions.php`. Use the format `<alias>.<action>` — the permission registry enforces `/^[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9]*$/`:

```php
<?php

return [
    'blog.viewAny',
    'blog.create',
    'blog.update',
    'blog.delete',
];
```

Canonical action names: `viewAny | view | create | update | delete`. Domain verbs are allowed (`approve`, `export`, `sync`). See `docs/conventions.md` §2 for the full grammar.

## 4. Sync permissions to the database

```bash
php artisan permission:sync
```

This upserts the declared permissions. Run `permission:sync --prune` to also delete permissions no longer declared. The command validates names first and exits non-zero on any invalid entry — fix the error before continuing.

## 5. What auto-registers (nothing else needed)

| Artefact | Mechanism |
|---|---|
| `Providers/<StudlyName>ServiceProvider.php` | Discovered by `ModuleServiceProvider` via `module.json` |
| `Database/Migrations/` | Loaded with `loadMigrationsFrom` |
| `routes/web.php` | Mounted under the `web` middleware group |
| `routes/api.php` | Mounted under the `api` middleware group with `/api` prefix |
| `resources/js/pages/*.tsx` | Resolved by the Inertia namespaced resolver in `resources/js/app.tsx` |

Reference pages in controllers with the `Name::` namespace prefix:

```php
return Inertia::render('Blog::pages/Index', ['posts' => $posts]);
```

## 6. Verify the scaffold

```bash
composer check   # Pint + PHPStan level 6 + Pest — must stay green
```

Do not commit until `composer check` is green.

## 7. Hand off

- To add a list/create/edit/delete resource: use the **add-resource** skill.
- To add a single non-CRUD endpoint: use the **add-action** skill.
