#!/usr/bin/env bash
# Server-side finalize for a deploy — flat layout, no atomic release/symlink.
# Called by GitHub Actions over SSH AFTER the CI runner has rsynced the built
# tree directly into APP_DIR (see .github/workflows/deploy.yml). Idempotent.
#
# Usage: bash <APP_DIR>/deploy.sh
#   APP_DIR is auto-derived from this script's own location, so the same script
#   works for any environment (/var/www/hris.hexavara.com, /var/www/staging.…).
#
# No maintenance mode and no symlink swap by design (deliberately simpler than
# atomic releases for this project) — rsync overwrites APP_DIR in place, so
# there's a brief window during composer install / migrate where a request
# could hit half-updated code. Accepted tradeoff. Rollback is "redeploy the
# previous tag", not an instant symlink flip — see .github/workflows/deploy.yml,
# which already requires production deploys to target an immutable tag.
set -euo pipefail

SELF="$(readlink -f "$0")"
APP_DIR="$(dirname "${SELF}")"
cd "${APP_DIR}"

echo "==> Installing PHP dependencies (no-dev)"
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# public/storage -> storage/app/public. After composer install (needs vendor/
# autoloader). --force replaces any stale link.
echo "==> Linking public storage"
php artisan storage:link --force

echo "==> Running database migrations"
php artisan migrate --force

echo "==> Caching config, events, routes, and views"
# `optimize` runs config:cache + event:cache + route:cache + view:cache — no need
# to call them separately. Routes are controller-only (no closures), so route:cache
# is safe.
php artisan optimize

# bootstrap/cache and storage/ are written by the deploy user, but the web
# server (www-data) must also be able to write them. The deploy user is a
# member of the www-data group (set up manually on the server), so this needs no sudo.
# Guarded so a not-yet-configured group doesn't abort the deploy.
echo "==> Fixing bootstrap/cache and storage permissions"
chmod -R ug+rwX "${APP_DIR}/bootstrap/cache" "${APP_DIR}/storage"
chgrp -R www-data "${APP_DIR}/bootstrap/cache" "${APP_DIR}/storage" 2>/dev/null || true
chgrp www-data "${APP_DIR}/database" 2>/dev/null || true

echo "==> Reloading php-fpm"
sudo systemctl reload php8.4-fpm

echo "==> Deploy complete at $(date -Iseconds)"
