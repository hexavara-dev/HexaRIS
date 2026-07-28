# Claude Code di GitHub Actions — HexaRIS

Dokumen ini menjelaskan cara kerja integrasi Claude Code di repo ini, cara setup dari nol, dan prosedur serah terima kalau PIC-nya berganti.

## Cara kerja singkat

- Claude **tidak** jalan otomatis tiap ada PR baru. Trigger-nya manual:
  - Comment `@claude <instruksi>` di PR atau issue
  - Submit review dengan body mengandung `@claude`
  - Kasih label `claude-implement` di issue → Claude baca issue, implementasi, jalanin test, bikin PR
- Saat ini **hanya trigger dari akun GitHub `myfirnanda`** yang diproses. Comment/label dari akun lain otomatis di-skip (job langsung `skipped`, tidak ada API call, tidak kena biaya).
- File workflow: `.github/workflows/claude.yml`
- Environment yang disiapkan sebelum Claude jalan: PHP 8.4 + Node 22, `composer install`, `npm ci` — jadi Claude bisa jalanin `pest`, `pint`, `tsc`, dsb sebagai bagian dari kerjanya, bukan cuma baca kode.
- Permission `contents: write` — Claude bisa langsung push/edit kode, bukan cuma komentar. **Pastikan branch protection aktif di `main`** supaya hasil kerja Claude tetap lewat PR review.

## Autentikasi: OAuth token dari subscription Max

Kita pakai `CLAUDE_CODE_OAUTH_TOKEN` (bukan `ANTHROPIC_API_KEY`), karena narik dari kuota Claude Max subscription yang sudah ada — tidak ada biaya tambahan di luar subscription.

**Konsekuensi:** token ini terikat ke akun personal orang yang generate. Kalau akun itu logout / nonaktif, semua workflow yang bergantung ke situ langsung gagal (error 401) sampai token diganti.

## Setup dari nol (kalau harus dari awal lagi)

1. Install **Claude GitHub App** ke org (`hexavara-dev`), pilih repo HexaRIS: `github.com/apps/claude`
2. Generate token — di laptop siapa pun yang jadi PIC saat itu (harus subscriber Claude Pro/Max/Team/Enterprise):
   ```
   claude setup-token
   ```
   Browser kebuka, approve akses, token muncul di terminal (format `sk-ant-oat01-...`).
3. Simpan sebagai secret di repo:
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `CLAUDE_CODE_OAUTH_TOKEN`
   - Value: token dari langkah 2
4. Pastikan file `.github/workflows/claude.yml` ada dan ter-commit.
5. Test: comment `@claude review PR ini` di PR mana pun oleh akun yang diizinkan.

## Prosedur handover (PIC berganti)

Kalau orang yang pegang token berganti (resign, pindah role, dsb):

1. PIC baru generate token sendiri di laptopnya:
   ```
   claude setup-token
   ```
2. Update secret di repo (Settings → Secrets and variables → Actions → `CLAUDE_CODE_OAUTH_TOKEN` → Update). Tidak perlu hapus dulu, langsung timpa value-nya.
3. (Opsional, disarankan) PIC lama revoke akses lamanya sendiri — `claude logout` di laptopnya, atau lewat pengaturan akun Claude — supaya token lama tidak menggantung.
4. Kalau akun GitHub yang diizinkan trigger juga berubah (bukan `myfirnanda` lagi), update baris `if:` di `claude.yml`:
   ```yaml
   github.actor == 'username-baru' &&
   ```
   atau untuk beberapa orang sekaligus:
   ```yaml
   contains(fromJSON('["myfirnanda", "username-lain"]'), github.actor) &&
   ```
5. Catat di tabel di bawah siapa PIC saat ini dan kapan token terakhir di-generate.

## Log PIC token (isi manual tiap kali ganti)

| Tanggal | PIC (akun Claude) | Akun GitHub yang diizinkan trigger | Catatan |
|---|---|---|---|
| _isi tanggal setup awal_ | myfirnanda | myfirnanda | Setup awal |

## Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Workflow tidak jalan sama sekali saat comment `@claude` | Comment bukan dari akun yang diizinkan di `github.actor` | Cek baris `if:` di `claude.yml`, sesuaikan username |
| Workflow jalan tapi gagal di step "Run Claude Code Action" (401) | Token expired / di-revoke / akun PIC nonaktif | Generate token baru (`claude setup-token`), update secret |
| Comment mengandung `@claude` tapi tidak trigger apa-apa | Salah event — pastikan comment di issue/PR biasa (`issue_comment`), bukan format lain | Cek ulang lokasi comment |
| Label `claude-implement` tidak memicu apa-apa | Yang kasih label bukan akun yang diizinkan | Sama seperti kasus comment, dicek dari `github.actor` |
| Claude gagal jalanin test/lint | Dependency environment belum lengkap | Cek step "Install PHP deps" / "Install JS deps" di log Actions |

## Kapan pindah dari OAuth token ke API key (`ANTHROPIC_API_KEY`)

Pertimbangkan pindah kalau:
- Sudah lebih dari 1-2 orang yang gantian pegang PIC dan sering merepotkan
- Butuh billing terpisah dari subscription personal siapa pun
- Volume pemakaian CI mulai bentrok sama kuota pemakaian interaktif harian PIC

Kalau saatnya tiba, cukup ganti input `claude_code_oauth_token` jadi `anthropic_api_key` di `claude.yml`, dan secret-nya dari `console.anthropic.com` (dikelola di level organisasi, bukan individu).
