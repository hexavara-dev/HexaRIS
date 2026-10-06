export interface AssistantMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export interface RecentConversation {
    id: string;
    title: string;
    question: string;
}

/** Threads listed under "Recent Conversational" on the panel's home view. */
export const RECENT_CONVERSATIONS: RecentConversation[] = [
    {
        id: 'weather',
        title: 'Weather',
        question: 'Bagaimana cuaca hari ini?',
    },
    {
        id: 'company',
        title: 'Informasi seputar perusahaan',
        question: 'Ceritakan informasi seputar perusahaan',
    },
    {
        id: 'account',
        title: 'Apa yang dimaksud dengan akun HRIS?',
        question: 'Apa yang dimaksud dengan akun HRIS?',
    },
    {
        id: 'product',
        title: 'Produk yang dijual',
        question: 'Apa saja produk yang dijual perusahaan?',
    },
    {
        id: 'advantage',
        title: 'Keunggulan yang dimiliki oleh aplikasi ini',
        question: 'Apa keunggulan yang dimiliki oleh aplikasi ini?',
    },
];

/** One-click prompts shown under the recent list, so a first run has somewhere to go. */
export const SUGGESTED_PROMPTS: string[] = [
    'Berapa jumlah karyawan aktif bulan ini?',
    'Siapa saja karyawan yang kontraknya berakhir dekat ini?',
    'Bagaimana cara mengajukan cuti tahunan?',
    'Rekap absensi tim IT minggu ini',
];

interface Rule {
    keywords: string[];
    reply: string;
}

/**
 * Urutan penting: rule pertama yang cocok menang. Topik spesifik di atas,
 * sapaan/terima kasih di paling bawah supaya "halo, berapa jumlah karyawan?"
 * tetap dijawab soal karyawan.
 */
const RULES: Rule[] = [
    {
        keywords: ['cuaca', 'weather', 'hujan', 'panas', 'suhu', 'mendung', 'cerah', 'prakiraan'],
        reply: 'Hari ini cerah berawan dengan suhu 28–33°C dan kelembapan 74%. Tidak ada prediksi hujan sore hari, jadi perjalanan dinas aman. Besok berawan tebal dengan peluang hujan ringan setelah pukul 16.00.',
    },
    {
        keywords: ['perusahaan', 'profil', 'tentang kami', 'visi', 'misi', 'kantor', 'cabang', 'alamat', 'company'],
        reply: 'PT Hexavara Digital Nusantara berdiri sejak 2019 dan bergerak di bidang solusi HRIS untuk perusahaan manufaktur serta jasa. Kantor pusat di Jakarta dengan cabang di Bandung, Surabaya, dan Medan. Total karyawan tercatat 128 orang di 4 unit organisasi (HR, IT, Finance, Produksi).',
    },
    {
        keywords: ['akun', 'login', 'masuk', 'password', 'kata sandi', 'sandi', 'lupa', 'reset', 'username', 'email kantor'],
        reply: 'Akun HRIS dibuat otomatis oleh admin saat karyawan terdaftar, menggunakan email kantor sebagai username. Lupa kata sandi? Klik "Lupa password" di halaman login, tautan reset berlaku 30 menit. Jika email tidak masuk, hubungi tim HR agar akun diaktifkan ulang.',
    },
    {
        keywords: ['produk', 'dijual', 'layanan', 'harga', 'paket', 'lisensi', 'modul', 'langganan'],
        reply: 'Produk utama yang dijual berupa lisensi modul HexaRIS: Employee Data, Payroll, Attendance, Recruitment, sampai Talent & Performance. Dijual sebagai paket tahunan per jumlah karyawan, ditambah opsi implementasi dan pelatihan untuk tim HR.',
    },
    {
        keywords: ['keunggulan', 'fitur unggulan', 'kelebihan', 'fitur', 'manfaat', 'kenapa pakai', 'advantage'],
        reply: 'Keunggulan aplikasi ini: (1) data karyawan terpusat dengan arsip digital, (2) payroll otomatis dengan PPh 21 dan BPJS terhitung, (3) approval cuti/lembur langsung dari ponsel, (4) laporan siap audit, dan (5) kontrol akses per peran sehingga data sensitif hanya terlihat oleh yang berwenang.',
    },
    {
        keywords: ['bpjs', 'pph', 'pph21', 'pajak', 'npwp', 'asuransi', 'jaminan', 'tax'],
        reply: 'PPh 21 dan iuran BPJS (Kesehatan serta Ketenagakerjaan) dihitung otomatis saat payroll diproses, mengikuti data NPWP dan status karyawan. Bukti potong dan rekap iuran bisa diunduh dari menu Penggajian setelah periode ditutup.',
    },
    {
        keywords: ['lembur', 'overtime', 'kerja tambahan'],
        reply: 'Lembur diajukan maksimal H+1 lewat menu Monitoring Kehadiran, lalu disetujui atasan. Perhitungan upah lembur mengikuti ketentuan perusahaan dan otomatis masuk ke payroll periode berjalan setelah approval.',
    },
    {
        keywords: ['gaji', 'payroll', 'thr', 'bonus', 'pembayaran', 'slip', 'upah', 'tunjangan', 'salary', 'penggajian'],
        reply: 'Gaji diproses setiap tanggal 25 dengan periode cut-off tanggal 1–24. Slip gaji terbit otomatis setelah payroll di-approve finance. Untuk perubahan komponen gaji (tunjangan/potongan), kirim pengajuan ke HR paling lambat tanggal 20 agar masuk periode berjalan.',
    },
    {
        keywords: ['cuti', 'izin', 'libur', 'leave', 'sakit', 'melahirkan', 'tahunan'],
        reply: 'Cuti tahunan 12 hari kerja per tahun, bisa diajukan minimal H-3 lewat menu Monitoring Kehadiran → Izin & Cuti. Pengajuan akan berjalan ke approval atasan, lalu HR. Status pengajuan bisa dipantau di tab "Menunggu Approval" pada halaman Data Karyawan.',
    },
    {
        keywords: ['absensi', 'absen', 'check in', 'check-in', 'clock', 'hadir', 'kehadiran', 'terlambat', 'telat', 'attendance'],
        reply: 'Absensi menggunakan check-in/check-out dari browser atau aplikasi, dengan toleransi keterlambatan 15 menit. Rekap mingguan tersedia di menu Absensi; keterlambatan berulang 3 kali dalam sebulan otomatis dikirim ke atasan untuk ditindaklanjuti.',
    },
    {
        keywords: ['shift', 'jadwal', 'jam kerja', 'jam masuk', 'jam pulang', 'schedule'],
        reply: 'Jam kerja standar Senin–Jumat pukul 08.00–17.00 dengan istirahat 1 jam. Untuk unit Produksi berlaku 3 shift (pagi, siang, malam) yang jadwalnya diatur atasan dan bisa dilihat di menu Monitoring Kehadiran.',
    },
    {
        keywords: ['rekrutmen', 'lowongan', 'pelamar', 'recruitment', 'hiring', 'interview', 'wawancara', 'kandidat', 'melamar'],
        reply: 'Proses rekrutmen dikelola di menu Rekrutmen: buka lowongan, terima pelamar, jadwalkan wawancara, lalu kirim penawaran. Kandidat yang diterima bisa langsung dipindahkan menjadi karyawan baru di Data Karyawan tanpa input ulang.',
    },
    {
        keywords: ['pelatihan', 'training', 'kursus', 'sertifikasi', 'workshop', 'seminar'],
        reply: 'Jadwal dan pendaftaran pelatihan ada di menu Pelatihan. Karyawan bisa mendaftar sendiri, lalu pengajuan disetujui atasan. Sertifikat dan riwayat pelatihan tersimpan otomatis di profil karyawan.',
    },
    {
        keywords: ['kinerja', 'penilaian', 'performance', 'kpi', 'okr', 'evaluasi', 'review', 'appraisal'],
        reply: 'Penilaian kinerja dilakukan per semester lewat menu Penilaian Kinerja, berdasarkan KPI yang disepakati bersama atasan. Hasil penilaian menjadi dasar kenaikan gaji, promosi, dan evaluasi kontrak.',
    },
    {
        keywords: ['resign', 'mengundurkan diri', 'pengunduran', 'keluar kerja', 'berhenti kerja', 'offboarding'],
        reply: 'Pengajuan resign dibuat lewat menu Karyawan Resign (diajukan minimal 30 hari sebelum tanggal terakhir bekerja). Setelah disetujui, status karyawan berubah menjadi Non Aktif dan datanya tetap tersimpan sebagai riwayat.',
    },
    {
        keywords: ['kontrak', 'pkwt', 'pkwtt', 'berakhir', 'perpanjang', 'perpanjangan', 'probation', 'freelance', 'tetap'],
        reply: 'Kontrak PKWT yang berakhir dalam 30 hari muncul di halaman Kontrak Karyawan. Perpanjangan diajukan atasan paling lambat H-14 sebelum berakhir; jika tidak diperpanjang, sistem menyiapkan template surat non-perpanjangan otomatis di Dokumen Center.',
    },
    {
        keywords: ['arsip', 'archive', 'restore', 'pulihkan', 'dihapus'],
        reply: 'Karyawan yang diarsipkan tidak muncul di daftar utama, tetapi datanya aman. Buka tombol "Arsip" di halaman Data Karyawan untuk melihat daftar arsip, lalu pilih Restore untuk mengembalikannya.',
    },
    {
        keywords: ['approval', 'approve', 'persetujuan', 'setuju', 'pengajuan', 'menunggu', 'tolak', 'ditolak'],
        reply: 'Pengajuan perubahan data menunggu keputusan di kartu "Menunggu Approval" pada halaman Data Karyawan. Klik kartunya untuk melihat antrean, lalu pilih Approve atau Tolak; jumlahnya langsung ikut berubah.',
    },
    {
        keywords: ['karyawan', 'pegawai', 'employee', 'jumlah', 'data karyawan', 'total', 'staf', 'staff', 'aktif', 'non aktif'],
        reply: 'Saat ini tercatat 128 karyawan: 115 aktif, 13 non-aktif, dan 6 menunggu approval. Rincian per status kepegawaian — Tetap 32, PKWT 32, Probation 32, Freelance 32. Semua rincian bisa dilihat di halaman Data Karyawan, lengkap dengan pencarian dan filter cabang.',
    },
    {
        keywords: ['kontak', 'hubungi', 'telepon', 'telp', 'whatsapp', 'wa hr', 'bantuan hr', 'helpdesk', 'contact'],
        reply: 'Tim HR bisa dihubungi lewat email hr@hexavara.id atau ekstensi 101 pada jam kerja (Senin–Jumat, 08.00–17.00). Untuk kendala akun atau sistem, kirim tiket ke helpdesk IT.',
    },
    {
        keywords: ['terima kasih', 'makasih', 'thanks', 'thank you', 'thx', 'tengkyu', 'trims'],
        reply: 'Sama-sama! Kalau ada pertanyaan lain seputar HRIS, silakan tanya kapan saja.',
    },
    {
        keywords: ['dadah', 'bye', 'sampai jumpa', 'selesai', 'sudah cukup', 'goodbye'],
        reply: 'Baik, sampai jumpa! Kalau butuh bantuan lagi, saya ada di sini.',
    },
    {
        keywords: ['siapa kamu', 'siapa kau', 'kamu siapa', 'siapa anda', 'kamu bisa apa', 'bisa apa', 'bantu apa', 'help', 'bantuan', 'menu'],
        reply: 'Saya HRIS Assistant. Saya bisa menjawab seputar data karyawan, gaji & pajak, cuti, absensi, lembur, kontrak, resign, rekrutmen, pelatihan, kinerja, dan informasi perusahaan. Coba tanyakan salah satunya!',
    },
    {
        keywords: [
            'halo',
            'hallo',
            'hai',
            'hi',
            'hello',
            'hey',
            'hei',
            'p',
            'permisi',
            'selamat pagi',
            'selamat siang',
            'selamat sore',
            'selamat malam',
            'assalamualaikum',
            'salam',
        ],
        reply: 'Halo! Saya HRIS Assistant. Saya bisa bantu seputar data karyawan, gaji, cuti, absensi, kontrak, dan informasi perusahaan. Ada yang bisa saya bantu hari ini?',
    },
];

let fallbackCount = 0;

/**
 * Keyword pendek (≤3 huruf, mis. "hi", "wa") harus kata utuh supaya tidak
 * nyangkut di tengah kata ("kar-i-yawan"). Keyword lebih panjang cukup cocok
 * dari awal kata, jadi "karyawan" tetap kena untuk "karyawannya".
 */
function matchesKeyword(normalized: string, keyword: string): boolean {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tail = keyword.length <= 3 ? '($|[^a-z0-9])' : '';

    return new RegExp(`(^|[^a-z0-9])${escaped}${tail}`).test(normalized);
}

/**
 * Deterministic-ish canned reply for a question: first matching keyword rule
 * wins, otherwise a generic "still learning" answer so the chat never dead-ends.
 */
export function assistantReply(question: string): string {
    const normalized = question.toLowerCase();

    const matched = RULES.find((rule) => rule.keywords.some((keyword) => matchesKeyword(normalized, keyword)));

    if (matched) {
        return matched.reply;
    }

    const fallbacks = [
        `Pertanyaan "${question.trim()}" belum masuk pengetahuan dummy saya. Coba tanyakan seputar data karyawan, gaji, cuti, absensi, atau kontrak — saya siap menjelaskan.`,
        `Maaf, untuk "${question.trim()}" saya belum punya jawaban pasti. Saya bisa bantu rangkum Data Karyawan, proses approval, atau kebijakan cuti perusahaan.`,
    ];

    const reply = fallbacks[fallbackCount % fallbacks.length];
    fallbackCount += 1;

    return reply;
}
