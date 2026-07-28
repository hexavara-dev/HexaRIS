# Review PR dengan Claude

Semua skill review hidup di `.claude/skills/`. Panggil dari comment PR:

| Command | Kapan dipakai |
|---|---|
| `@claude /review` | **Default.** Claude menilai sendiri blast radius perubahan lalu memilih kedalaman review yang sesuai, dan menyebutkan alasan pilihannya di laporan. |
| `@claude /deep-review` | Paksa review mendalam, lewati triage otomatis. |
| `@claude /light-review` | Paksa review ringkas. Kalau ternyata perubahannya luas, Claude akan berhenti dan menyarankan `/deep-review`. |
| `@claude /performance-review` | Fokus hanya performa: N+1, index, over-fetching, re-render, bundle size. |
| `@claude /security-review` | Fokus hanya keamanan, prioritas tertinggi pada isolasi tenant. |

Instruksi bebas juga tetap bisa: `@claude cek apakah migration di PR ini aman` atau bisa juga ditambah instruksi tambahan setelahnya, misal: `@claude /review fokus ekstra ke bagian migration-nya ya`
Skill hanya jalan pintas untuk alur yang sering dipakai.

## Di mana mengubah apa

| Mau mengubah | Edit di |
|---|---|
| Format laporan temuan (Esensi/Dampak/Before/After) | `CLAUDE.md` — berlaku ke semua skill sekaligus |
| Kriteria Critical/Warning/Suggestion | `CLAUDE.md` |
| Perintah test/lint yang dijalankan | `CLAUDE.md`, tabel perintah verifikasi |
| Aturan kapan CLAUDE.md wajib diperbarui | `CLAUDE.md`, section Keselarasan CLAUDE.md |
| Alur khusus satu jenis review | `SKILL.md` skill terkait |

Aturan praktisnya: apa pun yang berlaku untuk **semua** review ada di
`CLAUDE.md`, dan skill hanya berisi alur yang khas untuk dirinya sendiri.
Jangan menyalin format laporan ke dalam SKILL.md — itu menciptakan duplikasi
yang akan berbeda-beda seiring waktu.

## Memakai di repo lain

Skill di sini tidak meng-hardcode perintah stack apa pun; semuanya dibaca dari
`CLAUDE.md`. Untuk memakai di repo lain (stack berbeda), salin folder
`.claude/skills/` apa adanya, lalu sesuaikan `CLAUDE.md` repo tersebut:
tabel perintah verifikasi, aturan isolasi tenant (kalau ada), dan contoh
kondisi Critical yang relevan dengan stack itu.

Pengecualian: `security-review` dan `deep-review` menyebut isolasi tenant
secara spesifik. Untuk repo yang bukan multi-tenant, bagian itu bisa dihapus
dari SKILL.md-nya.

## Kalibrasi

Review otomatis bisa keliru — false positive maupun temuan yang terlewat.
Tanpa pengecekan berkala, satu-satunya sinyal bahwa kualitasnya menurun adalah
orang diam-diam mulai mengabaikan komentarnya.

Kebiasaan ringan yang cukup: setiap beberapa minggu, ambil beberapa PR yang
sudah di-review, dan cek apakah temuan Critical-nya memang valid.

- Banyak false positive pada pola tertentu → perjelas pola itu di `CLAUDE.md`
  supaya tidak lagi dianggap masalah.
- Ada masalah nyata yang lolos → tambahkan kondisinya ke daftar Critical di
  `CLAUDE.md` atau ke skill yang relevan.

Perbaikan hampir selalu dilakukan di `CLAUDE.md`, bukan dengan menambah skill baru.

## Catatan teknis

- Workflow `.github/workflows/claude.yml` sudah menjalankan `actions/checkout`
  sebelum step Claude, jadi skill di `.claude/skills/` otomatis terbaca.
  Kalau checkout dihapus, skill tidak akan ditemukan.
- Skill ikut ter-version di git — perubahannya bisa di-review lewat PR seperti
  kode biasa.
