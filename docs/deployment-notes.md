# Catatan Deployment HexaRIS

## Kondisi saat ini (Agustus 2026)

Stack minimal: PHP 8.4 + Nginx + SQLite. Deploy flat (langsung ke satu
direktori tetap, `APP_DIR`) — TANPA atomic release/symlink `current`,
deliberately lebih simpel untuk proyek ini. Rollback = redeploy tag
sebelumnya lewat GitHub Actions, bukan symlink flip instan.
Tidak ada Redis, tidak ada queue worker, tidak ada object storage.

## Yang SENGAJA belum dipasang, dan kapan perlu ditambahkan

### Redis
**Kapan butuh:** kalau performa cache/session mulai terasa lambat, atau kalau
mau pakai queue driver `redis` (lebih cepat dari `database`).
**Cara tambah:** `apt-get install redis-server`, set `requirepass` di
`/etc/redis/redis.conf`, lalu ubah di .env:
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
`php <APP_DIR>/artisan queue:work`.
**PENTING:** kalau worker dipasang, `deploy.sh` HARUS ditambah
`supervisorctl restart hexaris-<env>-worker:*` di akhir, setelah kode baru
selesai di-rsync. Kalau tidak, worker terus menjalankan proses lama (opcache
PHP-FPM lama) sampai direstart manual.

### MinIO / object storage
**Kapan butuh:** kalau HexaRIS mulai menyimpan dokumen karyawan (kontrak,
ijazah, KTP) atau foto. Jangan simpan di `APP_DIR/storage` untuk volume besar —
disk VPS bisa penuh dan backup jadi berat.
**Catatan UU PDP:** dokumen identitas karyawan itu data pribadi. Kalau dipasang,
buat bucket + user terpisah per environment, jangan satu bucket untuk semua.

### Python microservice (face recognition / ML)
**Kapan butuh:** saat fitur face enrollment mulai diimplementasikan.
**Pertimbangan:** deploy sebagai container Docker terpisah (bind localhost,
reverse-proxy lewat nginx kalau perlu diakses dari luar), bukan langsung di
host — biar dependency Python tidak bercampur dengan sistem.

## Hal yang mudah terlupa

1. **`.env` tidak ikut rsync** (di-exclude di deploy.yml, sama seperti
   `storage/` dan `database/*.sqlite`). Kalau nambah env var baru, harus
   diedit MANUAL di server untuk kedua environment.

2. **APP_KEY** dibuat sekali di awal, lalu JANGAN diubah. Kalau berubah, semua
   data terenkripsi (session, cache, kolom encrypted) jadi tidak terbaca.

3. **Migrasi harus backward-compatible** kalau mau rollback jadi mungkin.
   Jangan `dropColumn` di rilis yang sama dengan yang menambah penggantinya —
   pakai pola expand-contract (tambah nullable → isi → rilis berikutnya baru drop).

4. **Tidak ada maintenance mode selama deploy** (keputusan sadar — lihat
   `deploy.sh`). Ada jeda singkat saat rsync menimpa kode lama sebelum
   `composer install`/`migrate` selesai; request yang persis masuk di momen
   itu bisa kena error sesaat. Diterima demi kesederhanaan untuk proyek ini.

## Cara rollback

Tidak ada symlink untuk di-flip — deploy flat langsung menimpa `APP_DIR`.
Rollback berarti redeploy tag/commit sebelumnya:

```text
GitHub -> Actions -> "Deploy to VPS" -> Run workflow
  environment = production (atau staging)
  ref         = <tag versi sebelumnya, mis. v1.2.0>
```

Production wajib deploy dari tag (ditegakkan oleh deploy.yml), jadi rollback
selalu berarti "deploy ulang tag yang sudah pernah live" — bukan symlink flip
instan, tapi reproducible dan tidak butuh akses SSH manual.
