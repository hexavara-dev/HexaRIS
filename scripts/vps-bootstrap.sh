#!/usr/bin/env bash
# VPS bootstrap untuk HexaRIS — versi MINIMAL.
# Target: Ubuntu 24.04 LTS. Jalankan sebagai: root.
#
# Stack saat ini: PHP 8.4 + Nginx + SQLite. Deploy langsung ke satu direktori
# tetap (APP_DIR) — TANPA atomic release (tidak ada releases/, shared/, atau
# symlink current). Deliberately simpler untuk proyek ini; rollback = redeploy
# tag sebelumnya lewat GitHub Actions, bukan symlink flip instan.
# GitHub Actions yang build assets dan rsync — VPS TIDAK clone repo.
#
# Jalankan SEKALI PER ENVIRONMENT:
#   ENV=production DOMAIN=hris.hexavara.com \
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions-hexaris-deploy" \
#     bash vps-bootstrap.sh
#
#   ENV=staging DOMAIN=staging.hris.hexavara.com \
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions-hexaris-deploy" \
#     bash vps-bootstrap.sh
#
# Idempotent: aman dijalankan ulang. Tidak menimpa user/key/.env yang sudah ada.
#
# ==========================================================================
# BELUM DIPASANG — TODO kalau nanti dibutuhkan (lihat catatan di bawah skrip)
# ==========================================================================
#   [ ] Redis          — kalau cache/session/queue pindah dari database
#   [ ] Supervisor     — kalau ada queue worker (job background)
#   [ ] MinIO / S3     — kalau ada upload dokumen karyawan
#   [ ] PostgreSQL     — kalau skala data sudah outgrow SQLite
#
# TIDAK dilakukan skrip ini (harus manual):
#   - Generate SSH keypair (di laptop, bukan di server)
#   - Isi APP_KEY di APP_DIR/.env
#   - Setup DNS
#   - Jalankan Certbot setelah DNS resolve: certbot --nginx -d <DOMAIN>
#   - Isi GitHub Environment secrets

set -euo pipefail
export COMPOSER_ALLOW_SUPERUSER=1

# --- Validasi input --------------------------------------------------------

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: harus dijalankan sebagai root. Coba: sudo -i, lalu ulangi." >&2
  exit 1
fi

ENV="${ENV:?ENV wajib diisi: 'production' atau 'staging'}"
case "${ENV}" in
  production|staging) ;;
  *) echo "ERROR: ENV harus 'production' atau 'staging' (dapat '${ENV}')" >&2; exit 1 ;;
esac

: "${DOMAIN:?DOMAIN wajib diisi (mis. hris.hexavara.com)}"
: "${DEPLOY_PUBKEY:?DEPLOY_PUBKEY wajib diisi (paste full ssh-ed25519 ... pubkey)}"

if [[ ! "${DEPLOY_PUBKEY}" =~ ^(ssh-ed25519|ssh-rsa|ecdsa-sha2-) ]]; then
  echo "ERROR: DEPLOY_PUBKEY tidak terlihat seperti SSH public key yang valid" >&2
  exit 1
fi

APP_DIR="/var/www/${DOMAIN}"
DEPLOY_USER="deploy"

echo "==> Bootstrap HexaRIS — ENV=${ENV}, dir=${APP_DIR}"

# --- 1. Paket dasar --------------------------------------------------------

echo "==> [1/6] apt update + tools dasar"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
# Sengaja TIDAK apt-get upgrade: skrip yang bisa dijalankan ulang tidak boleh
# diam-diam meng-upgrade paket lain sebagai efek samping.
apt-get install -y curl wget git unzip ca-certificates gnupg lsb-release acl ufw \
  software-properties-common

# --- 2. PHP 8.4 ------------------------------------------------------------

echo "==> [2/6] PHP 8.4 + ekstensi"
if ! ls /etc/apt/sources.list.d/ondrej-* >/dev/null 2>&1; then
  add-apt-repository -y ppa:ondrej/php
  apt-get update -y
fi

apt-get install -y \
  php8.4 php8.4-cli php8.4-fpm \
  php8.4-sqlite3 php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip \
  php8.4-bcmath php8.4-intl php8.4-gd

# `php` di PATH HARUS resolve ke 8.4 — deploy.sh memanggil `php artisan` polos.
update-alternatives --set php /usr/bin/php8.4 2>/dev/null || true
php -v | grep -q 'PHP 8.4' || { echo "ERROR: 'php' tidak resolve ke 8.4" >&2; exit 1; }

# --- 3. Composer -----------------------------------------------------------

echo "==> [3/6] Composer"
if ! command -v composer >/dev/null 2>&1; then
  curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
  php /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
  rm -f /tmp/composer-setup.php
else
  echo "    composer sudah ada: $(composer --version | head -1)"
fi

# --- 4. Nginx --------------------------------------------------------------

echo "==> [4/6] Nginx"
apt-get install -y nginx

cat > "/etc/nginx/sites-available/${DOMAIN}" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Flat layout — deploy.sh rsync langsung ke APP_DIR, tidak ada symlink current.
    root ${APP_DIR}/public;
    index index.php;

    charset utf-8;
    client_max_body_size 20M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT \$realpath_root;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
EOF

ln -sfn "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default

nginx -t || { echo "ERROR: konfigurasi nginx invalid" >&2; exit 1; }
echo "    site ${DOMAIN} dibuat (reload setelah DNS resolve)"

# --- 5. User deploy --------------------------------------------------------

echo "==> [5/6] User '${DEPLOY_USER}' + SSH key"
if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  echo "    user ${DEPLOY_USER} dibuat"
else
  echo "    user ${DEPLOY_USER} sudah ada"
fi
usermod -aG www-data "${DEPLOY_USER}"

install -d -m 700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
AUTHKEYS="/home/${DEPLOY_USER}/.ssh/authorized_keys"
if [[ ! -f "${AUTHKEYS}" ]] || ! grep -qF "${DEPLOY_PUBKEY}" "${AUTHKEYS}" 2>/dev/null; then
  echo "${DEPLOY_PUBKEY}" >> "${AUTHKEYS}"
  echo "    DEPLOY_PUBKEY didaftarkan"
else
  echo "    DEPLOY_PUBKEY sudah terdaftar, dilewati"
fi
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${AUTHKEYS}"
chmod 600 "${AUTHKEYS}"

# Sudo terbatas: deploy.sh hanya butuh reload php-fpm.
cat > /etc/sudoers.d/hexaris-deploy <<EOF
${DEPLOY_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.4-fpm
EOF
chmod 440 /etc/sudoers.d/hexaris-deploy

# --- 6. Struktur APP_DIR flat + .env + SQLite -------------------------------

# Flat layout: APP_DIR langsung berisi kode aplikasi (deploy.sh rsync ke sini),
# bukan releases/<TS>/ + shared/. .env, storage/, dan database sqlite hidup
# langsung di APP_DIR dan dikecualikan dari rsync --delete (lihat deploy.yml)
# supaya tidak ikut tertimpa/terhapus tiap deploy.
install -d -m 2775 -o "${DEPLOY_USER}" -g www-data "${APP_DIR}"
sudo -u "${DEPLOY_USER}" mkdir -p \
  "${APP_DIR}/storage/app/public" \
  "${APP_DIR}/storage/app/private" \
  "${APP_DIR}/storage/framework/cache/data" \
  "${APP_DIR}/storage/framework/sessions" \
  "${APP_DIR}/storage/framework/views" \
  "${APP_DIR}/storage/logs" \
  "${APP_DIR}/database"

# www-data harus bisa menulis ke storage/ saat runtime.
chgrp -R www-data "${APP_DIR}/storage"
chmod -R g+rwx "${APP_DIR}/storage"
setfacl -R -m u:www-data:rwx "${APP_DIR}/storage"
setfacl -R -d -m u:www-data:rwx "${APP_DIR}/storage"

# SQLite database file — dimiliki www-data karena PHP-FPM berjalan sebagai www-data.
# Parent dir (database/) juga harus writable www-data agar SQLite bisa buat WAL/SHM.
DB_PATH="${APP_DIR}/database/database.sqlite"
if [[ ! -f "${DB_PATH}" ]]; then
  touch "${DB_PATH}"
  echo "    database.sqlite dibuat"
else
  echo "    database.sqlite sudah ada, tidak diubah"
fi
chown www-data:www-data "${DB_PATH}"
chmod 664 "${DB_PATH}"
chown www-data:www-data "${APP_DIR}/database"
chmod 775 "${APP_DIR}/database"

if [[ ! -f "${APP_DIR}/.env" ]]; then
  cat > "${APP_DIR}/.env" <<EOF
APP_NAME="HexaRIS"
APP_ENV=${ENV}
APP_DEBUG=false
APP_KEY=
APP_URL=https://${DOMAIN}

APP_LOCALE=id
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=id_ID

APP_MAINTENANCE_DRIVER=file
BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=warning

DB_CONNECTION=sqlite
DB_DATABASE=${DB_PATH}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=${DOMAIN}
SESSION_SECURE_COOKIE=true

CACHE_STORE=database
QUEUE_CONNECTION=sync
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local

MAIL_MAILER=log

VITE_APP_NAME="\${APP_NAME}"
EOF
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
  echo "    .env dibuat (APP_KEY masih kosong — isi manual!)"
else
  echo "    ${APP_DIR}/.env sudah ada, tidak diubah"
fi

# --- Firewall --------------------------------------------------------------

echo "==> Firewall (UFW)"
# Sengaja TANPA `ufw --force reset`: reset akan menghapus SEMUA aturan yang ada,
# termasuk yang ditambahkan manual di luar skrip ini. `ufw allow` sendiri sudah
# idempotent — menambah aturan yang sudah ada tidak menduplikasinya.
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# --- Selesai ---------------------------------------------------------------

echo ""
echo "=========================================="
echo "  BOOTSTRAP SELESAI — ENV=${ENV}"
echo "=========================================="
echo "  Dir:      ${APP_DIR}"
echo "  Database: ${APP_DIR}/database/database.sqlite (SQLite)"
echo "  Domain:   ${DOMAIN}"
echo "  PHP:      $(php -v | head -1)"
echo "------------------------------------------"
echo "  LANGKAH BERIKUTNYA (manual)"
echo "------------------------------------------"
echo "  1. APP_KEY — di laptop jalankan: php artisan key:generate --show"
echo "     lalu paste ke ${APP_DIR}/.env  (APP_KEY=base64:...)"
echo ""
echo "  2. DNS — buat A record ${DOMAIN} -> IP VPS ini"
echo ""
echo "  3. HTTPS — setelah DNS resolve:"
echo "       apt-get install -y certbot python3-certbot-nginx"
echo "       certbot --nginx -d ${DOMAIN}"
echo ""
echo "  4. GitHub -> Settings -> Environments -> '${ENV}':"
echo "       Variables: APP_DIR=${APP_DIR}"
echo "                  APP_HEALTH_URL=https://${DOMAIN}/up"
echo "       Secrets:   VPS_HOST=<ip vps>  VPS_USER=${DEPLOY_USER}  VPS_PORT=22"
echo "                  VPS_SSH_KEY=<private key pasangan DEPLOY_PUBKEY>"
echo ""
echo "  5. GitHub -> Actions -> 'Deploy to VPS' -> Run workflow"
echo "       environment=${ENV}, ref=<tag>"
echo ""
