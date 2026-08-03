# Catatan Deployment HexaRIS

## Kondisi saat ini (Agustus 2026)

Stack minimal: PHP 8.4 + Nginx + PostgreSQL + atomic release.
Tidak ada Redis, tidak ada queue worker, tidak ada object storage.

## Yang SENGAJA belum dipasang, dan kapan perlu ditambahkan

### Redis
**Kapan butuh:** kalau performa cache/session mulai terasa lambat, atau kalau
mau pakai queue driver `redis` (lebih cepat dari `database`).
**Cara tambah:** `apt-get install redis-server`, set `requirepass` di
`/etc/redis/redis.conf`, lalu ubah di shared/.env:
`CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis`.
**Catatan isolasi:** Redis tidak punya user-per-database seperti Postgres.
Pakai `REDIS_DB` berbeda per env (0=production, 1=staging) sebagai pemisah
namespace — tapi ini BUKAN isolasi keamanan. Kalau perlu isolasi sungguhan,
jalankan dua instance di port berbeda dengan password berbeda.

### Supervisor (queue worker)
**Kapan butuh:** begitu ada job background — kirim email, generate payslip,
export laporan besar, proses face recognition async.
**Cara tambah:** `apt-get install supervisor`, buat config di
`/etc/supervisor/conf.d/hexaris-<env>-worker.conf` yang menjalankan
`php <APP_DIR>/current/artisan queue:work`.
**PENTING:** kalau worker dipasang, `deploy.sh` HARUS ditambah
`supervisorctl restart hexaris-<env>-worker:*` setelah symlink switch.
Kalau tidak, worker terus menjalankan kode rilis LAMA tanpa ada yang sadar.

### MinIO / object storage
**Kapan butuh:** kalau HexaRIS mulai menyimpan dokumen karyawan (kontrak,
ijazah, KTP) atau foto. Jangan simpan di `shared/storage` untuk volume besar —
disk VPS bisa penuh dan backup jadi berat.
**Catatan UU PDP:** dokumen identitas karyawan itu data pribadi. Kalau dipasang,
buat bucket + user terpisah per environment, jangan satu bucket untuk semua.

### Python microservice (face recognition / ML)
**Kapan butuh:** saat fitur face enrollment mulai diimplementasikan.
**Pertimbangan:** deploy sebagai container Docker terpisah (bind localhost,
reverse-proxy lewat nginx kalau perlu diakses dari luar), bukan langsung di
host — biar dependency Python tidak bercampur dengan sistem.

### Role Postgres per-environment
Saat ini role `hexaris_production` dan `hexaris_staging` sudah terpisah, masing-
masing hanya memiliki database-nya sendiri. Ini sudah benar, tidak perlu diubah.

## Hal yang mudah terlupa

1. **`disable_symlinks off` di nginx** — tanpa ini, nginx bisa cache path
   symlink lama setelah deploy, jadi situs tetap jalan di rilis sebelumnya.

2. **`shared/.env` tidak ikut rsync** (di-exclude di deploy.yml). Kalau nambah
   env var baru, harus diedit MANUAL di server untuk kedua environment.

3. **APP_KEY** dibuat sekali di awal, lalu JANGAN diubah. Kalau berubah, semua
   data terenkripsi (session, cache, kolom encrypted) jadi tidak terbaca.

4. **Migrasi harus backward-compatible** kalau mau rollback jadi mungkin.
   Jangan `dropColumn` di rilis yang sama dengan yang menambah penggantinya —
   pakai pola expand-contract (tambah nullable → isi → rilis berikutnya baru drop).

5. **Prune release** menyimpan 5 terakhir. Kalau butuh rollback ke versi yang
   lebih lama dari itu, foldernya sudah tidak ada — harus deploy ulang dari tag.

## Cara rollback cepat

```bash
ssh deploy@<vps>
cd /var/www/hris.hexavara.com/releases
ls -1dt */          # lihat daftar release
ln -sfn /var/www/hris.hexavara.com/releases/<TS-lama> ../current.tmp
mv -Tf ../current.tmp ../current
sudo systemctl reload php8.4-fpm
```

Atau lewat GitHub Actions: Run workflow dengan `ref` = tag versi sebelumnya.
