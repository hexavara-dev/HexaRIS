---
name: security-review
description: Review PR khusus aspek keamanan dengan prioritas tertinggi pada isolasi tenant, ditambah authorization, validasi input, mass assignment, dan paparan data sensitif. Gunakan saat user ingin fokus hanya pada keamanan.
---

# Security Review

Fokus **hanya** pada keamanan. Abaikan isu performa dan style kecuali
berkaitan langsung dengan keamanan.

## Konteks

Baca `CLAUDE.md`: pola arsitektur, aturan isolasi tenant, perintah verifikasi,
format temuan standar, aturan keselarasan CLAUDE.md.

## Yang diperiksa, urut prioritas

**1. Isolasi tenant — prioritas tertinggi**

Setiap query yang menyentuh data tenant wajib difilter sesuai aturan isolasi
tenant di `CLAUDE.md`. Periksa juga jalur tidak langsung: relasi dan eager
loading yang tidak ter-scope bisa membocorkan data lintas tenant meskipun query
utamanya sudah benar. Pelanggaran isolasi tenant **selalu** Critical.

**2. Authorization**

Policy atau gate yang hilang pada action sensitif — terutama pada endpoint
baru, atau saat action yang sudah ada dipindah/di-refactor sehingga
pengecekannya tidak ikut terbawa.

**3. Validasi input**

Validasi yang hilang atau terlalu longgar, terutama pada input yang masuk ke
query mentah, file upload, atau operasi filesystem.

**4. Mass assignment**

Model tanpa `$fillable`/`$guarded` yang memadai, atau field sensitif yang
ikut ter-assign dari request.

**5. Paparan data sensitif**

Password, token, kredensial, atau dokumen identitas yang muncul di response
API, log, atau pesan error.

**6. Injection**

Raw query yang menggabungkan input pengguna tanpa binding.

## Cara melaporkan

Gunakan format temuan standar dari `CLAUDE.md`. Khusus untuk bagian **Dampak**,
sertakan skenario eksploitasi konkret bila relevan: siapa yang bisa
memanfaatkannya, apa yang bisa mereka akses atau ubah, dan prasyarat apa yang
dibutuhkan (perlu login? perlu role tertentu? bisa dari luar sama sekali?).

Kalau sebuah temuan secara teoretis lemah tapi tidak bisa dieksploitasi karena
ada lapisan proteksi lain, sebutkan lapisan itu dan turunkan tingkat
keparahannya. Jangan melebih-lebihkan tingkat keparahan.

## Format laporan

```
## Ringkasan
[ada temuan security dengan tingkat urgensinya / tidak ada temuan]

## Temuan
### Critical (n)
### Warning (n)
### Suggestion (n)
```

Ikuti juga aturan keselarasan CLAUDE.md yang tertulis di `CLAUDE.md`.
