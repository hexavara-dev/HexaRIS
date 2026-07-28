---
name: deep-review
description: Paksa review PR mendalam tanpa triage otomatis — telusuri seluruh codebase untuk pemakai kode yang berubah, cek konflik dengan main, dan analisis breaking change. Gunakan saat user secara eksplisit meminta review mendalam.
---

# Deep Review (override manual)

Jalankan review mendalam penuh, tanpa menilai dulu apakah perubahannya besar
atau kecil. User sudah memutuskan ini butuh kedalaman penuh.

## 1. Konteks

- Baca `CLAUDE.md`: konvensi, pola arsitektur, perintah verifikasi, format
  temuan standar, aturan keselarasan CLAUDE.md.
- Baca deskripsi PR dan daftar file berubah (`gh pr view`, `gh pr diff`).
- Identifikasi modul/domain yang tersentuh dari path file.

## 2. Eksplorasi di luar diff

Jangan berhenti di patch. Wajib:

- Baca versi lengkap tiap file yang diubah di branch ini, bukan hanya
  potongan diff-nya.
- Grep seluruh codebase untuk menemukan pemakai fungsi, method, class, atau
  route yang diubah/dihapus — termasuk di luar folder yang disentuh PR.
- Kalau ada perubahan migration/skema: telusuri tabel terkait, FK dari tabel
  lain yang bergantung pada kolom yang berubah, serta model, factory, dan
  seeder terkait.
- Kalau ada perubahan tipe, props, atau shared component di frontend:
  telusuri semua consumer-nya.

## 3. Konflik dengan main

- `git fetch origin main`, lalu `git diff main...HEAD` (atau setara).
- Identifikasi file yang sama-sama berubah di `main` sejak branch ini dibuat.
- Bedakan konflik trivial (whitespace/format) dari konflik substantif
  (logic bertabrakan). Jangan hanya mengandalkan status mergeable GitHub.

## 4. Analisis breaking change

Kategorikan tiap temuan sesuai kategori di `CLAUDE.md` (Critical / Warning /
Suggestion), dan tulis dengan format temuan standar dari `CLAUDE.md`.

Contoh kondisi yang wajib masuk Critical:

- Signature method berubah/dihapus tapi masih dipanggil di tempat lain
- Migration menghapus kolom yang masih direferensikan
- Route dihapus tapi masih dipanggil frontend
- Query menyentuh data tenant tanpa filter isolasi tenant

## 5. Verifikasi

Jalankan test dan lint sesuai tabel perintah verifikasi di `CLAUDE.md`.
Laporkan hasil aktual. Kalau ada yang gagal, bedakan penyebabnya: akibat PR ini
atau memang sudah gagal sebelumnya.

## 6. Format laporan

```
## Ringkasan
[1-2 kalimat: aman merge / butuh perbaikan / berisiko tinggi]

## Konflik dengan main
[detail, atau "tidak ditemukan konflik substantif"]

## Potensi Breaking Change
### Critical (n)
### Warning (n)
### Suggestion (n)

## Hasil Test & Lint

## Rekomendasi
[langkah konkret sebelum merge]
```

Ikuti juga aturan keselarasan CLAUDE.md yang tertulis di `CLAUDE.md`.
