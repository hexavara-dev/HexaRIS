---
name: light-review
description: Paksa review PR ringkas tanpa penelusuran codebase menyeluruh. Gunakan saat user secara eksplisit meminta review cepat untuk perubahan kecil dan terisolasi.
---

# Light Review (override manual)

Review cepat tanpa eksplorasi menyeluruh. User sudah menilai perubahan ini
kecil dan terisolasi.

## Langkah

1. Baca `CLAUDE.md`: konvensi, perintah verifikasi, format temuan standar,
   aturan keselarasan CLAUDE.md.
2. Baca diff PR (`gh pr diff`).
3. Periksa:
   - Bug atau logic error pada perubahan itu sendiri
   - Konsistensi dengan pola project di `CLAUDE.md` — bukan sekadar
     "terlihat wajar"
   - Kalau ada perubahan yang menyentuh kode di luar file yang di-diff,
     cek singkat apakah masih kompatibel
4. Jalankan test dan lint yang relevan dengan file yang berubah, sesuai tabel
   perintah verifikasi di `CLAUDE.md`. Laporkan hasil aktualnya.

## Kalau ternyata perubahannya tidak sekecil itu

Kalau saat membaca diff ternyata ditemukan indikator blast radius luas —
perubahan migration/skema, signature yang berubah, file shared/util yang
dipakai lintas modul, atau query tenant tanpa filter isolasi — **jangan
lanjutkan review ringkas**. Hentikan, sebutkan indikator yang ditemukan, dan
sarankan user menjalankan `/deep-review`. Ini lebih berguna daripada memberi
lampu hijau berdasarkan pemeriksaan yang tidak memadai.

## Format laporan

Gunakan format temuan standar dari `CLAUDE.md`, tapi ringkas:

```
## Ringkasan
[aman merge / ada yang perlu diperbaiki]

## Temuan
[maksimal beberapa poin, format temuan standar]

## Hasil Test & Lint
```

Ikuti juga aturan keselarasan CLAUDE.md yang tertulis di `CLAUDE.md`.
