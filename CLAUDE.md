# CLAUDE.md — Project instructions for AI agents

This is a modular Laravel 12 + Inertia React (TypeScript) application template.
A **module is a bounded context** that may contain several aggregates/resources,
organized as a self-contained directory under `app/Modules/<Name>/` — its routes,
controllers, FormRequests, DTOs, React pages, migrations, and permission
declarations together. The module system auto-registers everything at boot —
no manual `config/` edits needed. The built-in `Iam` context (auth, users, roles,
permissions) is the canonical reference; the `users` aggregate inside it is the
CRUD exemplar. RBAC is handled by spatie/laravel-permission with a `super-admin`
bypass gate. All sensitive writes should be audited.

## Before implementing anything

Read `docs/conventions.md` and `CONTRIBUTING.md` first. They are the canonical
source of truth for module structure, permission naming, CRUD shape, auditing
patterns, and the quality gate workflow.

## Skill pipeline (use for every feature)

To build a new feature, invoke the `.claude/skills/` pipeline in order:

1. `feature-brainstorm` — clarify requirements and edge cases.
2. `plan-feature` — produce a written implementation plan.
3. `create-module` / `add-resource` / `add-action` (+ `add-audit` / `add-permission`) — scaffold and implement.
4. `review-changes` — verify conventions, tests, and quality gate.
5. `finish-feature` — commit, push, open PR with a Conventional Commit title, then **stop and wait for the author's review approval before merging**.

- **Skill choice:** `create-module` = a new bounded context; `add-resource` = add a CRUD
  resource into a context (existing like `Iam`, or a new one); `add-action` = a single
  operation in a context. Adding an entity does not mean a new module — pick its context first.
- `feature-brainstorm` / `plan-feature` / `review-changes` / `finish-feature` build on the
  always-installed `superpowers` plugin — they add only the Laravel-specific parts.
- `draft-ticket` turns a spec into ready-to-paste GitHub Issue / Jira tickets (optional, for the board).

Skills live under `.claude/skills/`. Use the `Skill` tool to invoke them.

## Hard rules

- Permission names: `<resource>.<action>` (e.g. `posts.viewAny`, `posts.approve`).
  Run `php artisan permission:sync` after any change to a `permissions.php`.
- Gate every mutating route with `->middleware('can:<perm>')` — not in `authorize()`.
- Audit sensitive writes: use the `IsAudited` trait on models or call `AuditLogger`
  explicitly for domain events.
- Run `composer check` (Pint + PHPStan level 6 + Pest) AND `npm run build` before
  marking any task complete.
- Never commit to `main` — always PR + squash-merge with a Conventional Commit title.
- **Never auto-merge a PR.** After opening the PR and CI passing, STOP and wait for the author's
  explicit review approval before running `gh pr merge`. CI-green is not approval.

<!-- # Konfigurasi claude github actions -->

---
## Konfigurasi Review Otomatis

### Perintah verifikasi

Perintah yang dijalankan skill review saat memverifikasi perubahan.
Sesuaikan bagian ini kalau stack repo berubah — skill review tidak
meng-hardcode perintah apa pun, semuanya dibaca dari sini.

| Jenis | Perintah |
|---|---|
| Test backend | `./vendor/bin/pest` |
| Formatter/linter backend | `./vendor/bin/pint --test` |
| Linter frontend | `npm run lint` |
| Type check frontend | `npx tsc --noEmit` |
| Test frontend | `npm run test:run` |

### Isolasi tenant

Repo ini multi-tenant. Setiap query yang menyentuh data milik tenant wajib
difilter dengan `company_id` (atau scope tenant yang berlaku di modul tersebut).
Pelanggaran isolasi tenant **selalu** dikategorikan Critical, tanpa pengecualian.

---

## Format Temuan Standar

Semua skill review menggunakan format ini. Untuk **setiap** temuan, sertakan:

- **File & baris** — lokasi spesifik
- **Esensi** — apa sebenarnya masalah ini, dijelaskan dengan bahasa sederhana.
  Jangan cuma menyebut istilah teknisnya; jelaskan mekanismenya di kasus ini.
- **Dampak** — apa yang benar-benar terjadi kalau tidak diperbaiki: fitur/modul
  apa yang kena, kondisi apa yang memicunya, dan seberapa parah
  (data rusak? crash? hanya lambat? hanya tidak sesuai konvensi?)
- **Before** — kutipan kode aktual yang bermasalah (potongan relevan saja)
- **After** — kode setelah diperbaiki, dalam bahasa yang sama supaya bisa
  langsung dibandingkan
- **Kenapa lebih baik** — 1-2 kalimat yang menghubungkan balik ke Esensi & Dampak

### Kategori temuan

| Kategori | Kriteria |
|---|---|
| **Critical** | Merusak fungsi/fitur yang sudah ada, atau melanggar isolasi tenant |
| **Warning** | Berpotensi bermasalah tapi belum pasti terjadi |
| **Suggestion** | Bukan bug, tapi menyimpang dari konvensi di dokumen ini |

### Aturan umum pelaporan

- Jangan sekadar memparafrase diff. Kalau sebuah klaim butuh verifikasi
  (misal "fungsi ini dipakai di tempat lain"), benar-benar jalankan
  pencarian/grep-nya — jangan berasumsi.
- Laporkan hasil test/lint yang **aktual** (pass/fail beserta detail kegagalan),
  bukan sekadar menyatakan sudah dijalankan.
- Kalau tidak ada temuan pada suatu kategori, tulis "tidak ada" — jangan
  memaksakan temuan supaya laporan terlihat lengkap.

---

## Keselarasan CLAUDE.md

Setiap skill review, apa pun jenisnya, juga mengevaluasi apakah PR ini
membutuhkan pembaruan pada CLAUDE.md.

### Termasuk "perubahan besar" — wajib dicek dan dilaporkan

- Menambahkan modul/domain baru yang belum tercantum di dokumen ini
- Memperkenalkan pola arsitektur baru yang berpotensi dipakai berulang
  (pendekatan baru untuk approval flow, strategi kalkulasi baru, pola baru
  untuk multi-tenancy) dan belum terdokumentasi di sini
- Menyimpang dari konvensi yang sudah tertulis di dokumen ini
- Mengubah struktur skema inti (relasi antar modul, pola effective-dating,
  pola approval engine)
- Keputusan desain signifikan yang dibuat secara implisit lewat kode, tapi
  belum tercatat sebagai ADR

### Tidak termasuk — jangan disinggung sama sekali

- Perubahan UI/styling/posisi elemen
- Bug fix yang tidak mengubah pola/kontrak yang sudah ada
- Penambahan test
- Refactor yang hasil akhirnya tetap mengikuti pola yang sudah ada

### Kalau termasuk perubahan besar

Tambahkan section ini di akhir laporan:

```
## Kebutuhan Update CLAUDE.md
Status: PERLU DIPERBARUI

Alasan: [pola/keputusan baru apa di PR ini yang belum tercakup]

Saran penyesuaian:
- [bagian mana di CLAUDE.md yang perlu ditambah/diubah]
- [draft kalimat/section yang bisa langsung dipakai, kalau memungkinkan]
```

### Kalau tidak termasuk perubahan besar

Jangan tulis section itu sama sekali — termasuk jangan menulis "CLAUDE.md sudah
up to date". Itu noise yang tidak perlu di PR kecil.
