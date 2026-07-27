#!/usr/bin/env bash
# Server-side finalize for an atomic release.
# Called by GitHub Actions over SSH AFTER the CI runner has rsynced the built
# tree into releases/<TS>. Idempotent per release.
#
# Usage: bash <APP_DIR>/releases/<TS>/deploy.sh <TS>
#   APP_DIR is auto-derived from this script's own location, so the same script
#   works for any environment (/var/www/spmb-production, /var/www/spmb-staging, …).
set -euo pipefail

TS="${1:?usage: deploy.sh <release-timestamp>}"
SELF="$(readlink -f "$0")"
APP_DIR="$(cd "$(dirname "${SELF}")/../.." && pwd)"   # .../<env>/releases/<TS>/deploy.sh -> <env>
REL="${APP_DIR}/releases/${TS}"
SHARED="${APP_DIR}/shared"
CURRENT="${APP_DIR}/current"
KEEP=5

# ADDED: guard — pastikan skrip dijalankan dari dalam release yang dimaksud,
# bukan tanpa sengaja dari 'current' (yang bisa jadi release LAIN). Tanpa ini,
# salah ketik TS bisa memfinalisasi tree yang salah.
if [ "$(readlink -f "$(dirname "${SELF}")")" != "$(readlink -f "${REL}")" ]; then
  echo "::error::deploy.sh dijalankan dari lokasi yang tidak cocok dengan TS='${TS}'." >&2
  echo "  Script di : $(dirname "${SELF}")" >&2
  echo "  Expected  : ${REL}" >&2
  exit 1
fi

# ADDED: kalau skrip mati di tengah SEBELUM symlink berpindah, buang release
# setengah jadi supaya tidak menumpuk sebagai sampah dan tidak mengacaukan prune.
# Dinonaktifkan tepat setelah switch symlink sukses (RELEASE_LIVE=1).
RELEASE_LIVE=0
cleanup_on_fail() {
  local code=$?
  if [ "${RELEASE_LIVE}" -eq 0 ] && [ "${code}" -ne 0 ]; then
    echo "==> Deploy gagal (exit ${code}). Membersihkan release ${TS} yang belum live."
    # Pastikan maintenance mode dimatikan lagi kalau sempat menyala di 'current'.
    if [ -L "${CURRENT}" ]; then
      php "${CURRENT}/artisan" up 2>/dev/null || true
    fi
    rm -rf "${REL}"
  fi
}
trap cleanup_on_fail EXIT

cd "${REL}"

echo "==> Linking shared .env and storage"
ln -sfn "${SHARED}/.env" "${REL}/.env"
rm -rf "${REL}/storage"
ln -sfn "${SHARED}/storage" "${REL}/storage"

echo "==> Installing PHP dependencies (no-dev)"
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# public/storage -> storage/app/public (i.e. shared/storage/app/public). Peserta
# berkas now live in MinIO (private `minio` disk), not here — this link only
# remains for any other public assets. After composer install (needs vendor/
# autoloader). --force replaces any stale link.
echo "==> Linking public storage"
php artisan storage:link --force

# ADDED: nyalakan maintenance mode HANYA di release yang sedang live (current),
# supaya user tidak kena skema setengah jalan selama migrasi. --render memberi
# halaman 503 yang rapi, bukan error mentah. Baru dinyalakan kalau 'current'
# sudah ada (deploy pertama tidak punya current, jadi dilewati).
if [ -L "${CURRENT}" ]; then
  echo "==> Maintenance mode ON (current release)"
  php "${CURRENT}/artisan" down --render="errors::503" --retry=15 2>/dev/null || true
fi

echo "==> Running database migrations"
php artisan migrate --force

# Idempotent: creates the MinIO bucket + staging-expiry lifecycle if missing.
# Requires MINIO_* credentials in shared/.env (see docs/deployment-checklist.md).
echo "==> Ensuring MinIO berkas bucket + lifecycle"
php artisan berkas:ensure-bucket

# Reference/master data is intentionally NOT seeded on deploy. Schema changes
# apply via `migrate --force` above; DATA is provisioned ONCE on first install
# (see docs/production-readiness.md §3) and then owned by the admin UI, so a
# routine code deploy can never mutate production data. Manual (re)seed if ever
# needed — first-provision guards keep it idempotent:
#   php artisan db:seed --force                  # first provision
#   php artisan db:seed --class=JadwalSeeder     # e.g. after adding a new JadwalKunci in code
# Provision the superadmin out-of-band with `php artisan admin:create`.

echo "==> Caching config, events, routes, and views"
# `optimize` runs config:cache + event:cache + route:cache + view:cache — no need
# to call them separately. Routes are controller-only (no closures), so route:cache
# is safe.
php artisan optimize

# bootstrap/cache lives inside each release and is written by the deploy user, but
# the web server (www-data) must also be able to write it. The deploy user is a
# member of the www-data group (see deployment checklist Phase A), so this needs no
# sudo. Guarded so a not-yet-configured group doesn't abort the deploy.
chmod -R ug+rwX "${REL}/bootstrap/cache"
chgrp -R www-data "${REL}/bootstrap/cache" 2>/dev/null || true

echo "==> Switching current symlink atomically"
# ADDED: simpan target 'current' lama untuk rollback kalau switch/reload gagal.
PREV_REL=""
if [ -L "${CURRENT}" ]; then
  PREV_REL="$(readlink -f "${CURRENT}")"
fi
ln -sfn "${REL}" "${APP_DIR}/current.tmp"
mv -Tf "${APP_DIR}/current.tmp" "${CURRENT}"
RELEASE_LIVE=1   # mulai titik ini, release baru sudah jadi 'current'

echo "==> Reloading php-fpm"
# ADDED: kalau reload gagal, kembalikan symlink ke release lama supaya situs
# tidak jalan di kode baru dengan opcache lama yang tidak sinkron.
if ! sudo systemctl reload php8.4-fpm; then
  echo "::error::php-fpm reload gagal."
  if [ -n "${PREV_REL}" ]; then
    echo "==> Rollback symlink ke release sebelumnya: ${PREV_REL}"
    ln -sfn "${PREV_REL}" "${APP_DIR}/current.tmp"
    mv -Tf "${APP_DIR}/current.tmp" "${CURRENT}"
    sudo systemctl reload php8.4-fpm || true
  fi
  php "${CURRENT}/artisan" up 2>/dev/null || true
  exit 1
fi

# ADDED: matikan maintenance mode di release yang SEKARANG live (release baru).
echo "==> Maintenance mode OFF"
php "${REL}/artisan" up 2>/dev/null || true

echo "==> Pruning old releases (keep ${KEEP})"
cd "${APP_DIR}/releases"
# CHANGED: jangan sampai prune menghapus release yang sedang jadi 'current'
# (mis. kalau ada release lama yang secara timestamp lebih baru karena jam server
# pernah kacau). Lindungi current secara eksplisit.
CURRENT_REL="$(basename "$(readlink -f "${CURRENT}")")"
ls -1dt */ | sed 's:/$::' | tail -n +$((KEEP + 1)) | while read -r old; do
  if [ "${old}" != "${CURRENT_REL}" ]; then
    rm -rf "${old}"
  fi
done

echo "==> Deploy complete: ${TS} at $(date -Iseconds)"
