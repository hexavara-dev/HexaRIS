---
name: performance-review
description: Review PR khusus aspek performa — query N+1, index yang hilang, over-fetching, re-render berlebihan, dan bundle size. Gunakan saat user ingin fokus hanya pada performa.
---

# Performance Review

Fokus **hanya** pada performa. Abaikan isu security, style, dan breaking change
umum kecuali berkaitan langsung dengan performa.

## Konteks

Baca `CLAUDE.md`: pola arsitektur, perintah verifikasi, format temuan standar,
aturan keselarasan CLAUDE.md.

## Yang diperiksa

**Database & query**

- Query N+1, terutama relasi yang kehilangan eager loading
- Query pada kolom `WHERE`/`JOIN` di tabel besar tanpa index yang jelas
  dibutuhkan
- Query atau panggilan API di dalam loop yang seharusnya di-batch
- Query yang mengambil seluruh kolom padahal hanya beberapa yang dipakai

**API & payload**

- Over-fetching: data yang dikirim ke client tapi tidak dipakai
- Endpoint yang mengembalikan koleksi besar tanpa pagination

**Frontend**

- Re-render berlebihan: komponen yang sering re-render tanpa memoization
  yang sesuai
- Perhitungan berat di dalam render body yang seharusnya di-memo
- Import eager untuk modul besar yang seharusnya lazy-loaded

## Cara melaporkan

Gunakan format temuan standar dari `CLAUDE.md`. Khusus untuk bagian **Dampak**,
sertakan estimasi skala kalau memungkinkan — misalnya bagaimana perilakunya
berubah pada 10 baris data versus 1000 baris, atau berapa query tambahan yang
dihasilkan per item.

Kalau sebuah temuan hanya berdampak pada dataset kecil dan tidak akan terasa
di kondisi nyata, katakan begitu — jangan naikkan tingkat keparahannya supaya
laporan terlihat berisi.

## Format laporan

```
## Ringkasan
[ada masalah performa signifikan / tidak ada temuan berarti]

## Temuan
### Critical (n)
### Warning (n)
### Suggestion (n)
```

Ikuti juga aturan keselarasan CLAUDE.md yang tertulis di `CLAUDE.md`.
