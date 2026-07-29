---
name: review
description: Review pull request dengan kedalaman yang ditentukan otomatis berdasarkan blast radius perubahan. Ini skill review default — gunakan kecuali user meminta fokus spesifik (performance/security) atau memaksa kedalaman tertentu.
---

# Review PR (self-triage)

Tentukan sendiri kedalaman review yang tepat, lalu jalankan. Jangan tanya balik
ke user — putuskan dan kerjakan.

## Langkah 1 — Baca konteks

- Baca `CLAUDE.md` di root repo: konvensi, pola arsitektur, perintah verifikasi,
  format temuan standar, dan aturan keselarasan CLAUDE.md.
- Baca deskripsi PR dan daftar file yang berubah (`gh pr view`, `gh pr diff`).

## Langkah 2 — Ukur blast radius

Jangan menilai dari jumlah baris diff. Nilai dari **seberapa jauh efeknya
menyebar**. Cek indikator berikut:

- Apakah ada perubahan migration/skema database?
- Apakah ada file yang diubah berada di direktori shared/util/component yang
  dipakai lintas modul? (cek dengan grep siapa yang meng-import file tersebut)
- Apakah ada signature fungsi/method/props yang berubah atau dihapus?
- Apakah perubahan menyentuh lebih dari satu domain/modul?
- Apakah ada perubahan pada query yang menyentuh data tenant?

## Langkah 3 — Pilih kedalaman

**Review mendalam** — kalau **salah satu** indikator di atas terpenuhi.
Jalankan penuh:

1. Untuk tiap file yang diubah, baca versi lengkapnya di branch ini, bukan
   hanya potongan diff.
2. Grep seluruh codebase untuk mencari pemakai fungsi/method/class/route yang
   diubah atau dihapus — termasuk di luar folder yang disentuh PR.
3. Kalau ada perubahan skema: telusuri FK dari tabel lain, model, factory,
   dan seeder yang terkait.
4. Kalau ada perubahan tipe/props frontend: telusuri semua consumer-nya.
5. Bandingkan dengan `main` terkini (`git fetch origin main`,
   `git diff main...HEAD`) untuk mendeteksi konflik substantif — jangan hanya
   mengandalkan status mergeable dari GitHub.

**Review ringkas** — kalau **tidak ada** indikator yang terpenuhi (perubahan
terisolasi di satu domain, tidak menyentuh kontrak/skema). Cukup:

1. Periksa bug/logic error pada perubahan itu sendiri.
2. Periksa konsistensi dengan pola di `CLAUDE.md`.
3. Cek singkat kompatibilitas kalau ada yang menyentuh kode di luar diff.

## Langkah 4 — Verifikasi

Jalankan perintah test dan lint yang relevan dengan file yang berubah, sesuai
tabel perintah verifikasi di `CLAUDE.md`. Laporkan hasil aktualnya. Kalau ada
kegagalan, bedakan mana yang disebabkan PR ini dan mana yang tidak terkait.

## Langkah 5 — Laporkan

Gunakan format temuan standar dari `CLAUDE.md`. Post sebagai comment PR:

```
## Ringkasan
[Kedalaman yang dipilih: mendalam / ringkas — sebutkan alasan singkat,
misal "mendalam karena ada perubahan migration dan shared util"]
[1-2 kalimat: aman merge / butuh perbaikan / berisiko tinggi]

## Konflik dengan main
[hanya kalau review mendalam — detail, atau "tidak ditemukan konflik substantif"]

## Temuan
### Critical (n)
### Warning (n)
### Suggestion (n)

## Hasil Test & Lint

## Rekomendasi
```

Ikuti juga aturan keselarasan CLAUDE.md yang tertulis di `CLAUDE.md`.
