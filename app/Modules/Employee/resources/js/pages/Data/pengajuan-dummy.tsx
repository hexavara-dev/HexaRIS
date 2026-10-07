export interface PerubahanField {
    label: string;
    before: string;
    after: string;
}

export interface PengajuanPerubahan {
    /** Unique key of the request — the ID column shows the employee id instead. */
    id: string;
    employeeId: string;
    name: string;
    role: string;
    avatarUrl?: string;
    branch: string;
    organization: string;
    position: string;
    status: 'Aktif' | 'Non Aktif';
    changes: string;
    submittedAt: string;
    fields: PerubahanField[];
}

export const PENGAJUAN_DUMMY: PengajuanPerubahan[] = [
    {
        id: 'PGJ-001',
        employeeId: 'EM187',
        name: 'Ayu Sasmita',
        role: 'Staff Videografer',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        status: 'Aktif',
        changes: 'Data Personal, Data Pendukung',
        submittedAt: '18-12-2026',
        fields: [
            { label: 'Nama Lengkap', before: 'Ayu Sasmita', after: 'Ayu Sasmita Sari' },
            { label: 'Nomor WA', before: '089019281921', after: '08977668997' },
            { label: 'Kab/Kota', before: 'Jombang', after: 'Mojokerto' },
        ],
    },
    {
        id: 'PGJ-002',
        employeeId: 'EM204',
        name: 'Saskya Ayu',
        role: 'Staff Desainer',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        status: 'Aktif',
        changes: 'Data Pendidikan',
        submittedAt: '20-12-2026',
        fields: [
            { label: 'Pendidikan Terakhir', before: 'SMA', after: 'S1 Desain' },
            { label: 'Institusi', before: 'SMKN 2 Jakarta', after: 'Universitas Bina Nusantara' },
            { label: 'Tahun Lulus', before: '2019', after: '2024' },
        ],
    },
    {
        id: 'PGJ-003',
        employeeId: 'EM163',
        name: 'Dimas Pratama',
        role: 'Supervisor IT',
        branch: 'Bandung',
        organization: 'IT',
        position: 'Supervisor',
        status: 'Aktif',
        changes: 'Data Gaji & Bank',
        submittedAt: '21-12-2026',
        fields: [
            { label: 'Nomor Rekening', before: '8820123456', after: '7019876543' },
            { label: 'Bank', before: 'BCA', after: 'Mandiri' },
            { label: 'Nama Rekening', before: 'Dimas Pratama', after: 'Dimas P Saputra' },
        ],
    },
    {
        id: 'PGJ-004',
        employeeId: 'EM178',
        name: 'Bagas Saputra',
        role: 'Staf Produksi',
        branch: 'Jakarta',
        organization: 'Produksi',
        position: 'Senior Staff',
        status: 'Aktif',
        changes: 'Data Keluarga',
        submittedAt: '22-12-2026',
        fields: [
            { label: 'Status Perkawinan', before: 'Belum Kawin', after: 'Kawin' },
            { label: 'Jumlah Tanggungan', before: '0', after: '2' },
            { label: 'Nama Pasangan', before: '-', after: 'Sinta Maharani' },
        ],
    },
    {
        id: 'PGJ-005',
        employeeId: 'EM192',
        name: 'Nabila Zahra',
        role: 'Staf HR',
        branch: 'Bandung',
        organization: 'HR',
        position: 'Staff',
        status: 'Non Aktif',
        changes: 'Data Personal',
        submittedAt: '23-12-2026',
        fields: [
            { label: 'Nomor HP', before: '081298765432', after: '081377788899' },
            { label: 'Alamat', before: 'Jl. Kenanga No 12', after: 'Jl. Melati No 8' },
            { label: 'Kab/Kota', before: 'Bandung', after: 'Cimahi' },
        ],
    },
    {
        id: 'PGJ-006',
        employeeId: 'EM211',
        name: 'Rani Oktaviani',
        role: 'Staf Finance',
        branch: 'Surabaya',
        organization: 'Finance',
        position: 'Manager',
        status: 'Aktif',
        changes: 'Data Alamat',
        submittedAt: '24-12-2026',
        fields: [
            { label: 'Kab/Kota', before: 'Surabaya', after: 'Sidoarjo' },
            { label: 'Kode Pos', before: '60231', after: '61226' },
            { label: 'Alamat', before: 'Jl. Rungkut Asri Tengah 4', after: 'Jl. Pondok Jati Blok C 2' },
        ],
    },
    {
        id: 'PGJ-007',
        employeeId: 'EM219',
        name: 'Ahmad Fauzi',
        role: 'Supervisor Finance',
        branch: 'Surabaya',
        organization: 'Finance',
        position: 'Supervisor',
        status: 'Aktif',
        changes: 'Data Gaji & Bank',
        submittedAt: '25-12-2026',
        fields: [
            { label: 'Gaji Pokok', before: '7500000', after: '8750000' },
            { label: 'Bank', before: 'BNI', after: 'BCA' },
            { label: 'Nomor Rekening', before: '0451234567', after: '8820998877' },
        ],
    },
    {
        id: 'PGJ-008',
        employeeId: 'EM184',
        name: 'Sinta Maharani',
        role: 'Manager HR',
        branch: 'Jakarta',
        organization: 'HR',
        position: 'Manager',
        status: 'Aktif',
        changes: 'Data Personal',
        submittedAt: '26-12-2026',
        fields: [
            { label: 'Status Perkawinan', before: 'Belum Kawin', after: 'Kawin' },
            { label: 'Nomor WA', before: '081234567890', after: '081298761234' },
            { label: 'Alamat', before: 'Jl. Anggrek 3', after: 'Jl. Tulip Raya 12' },
        ],
    },
    {
        id: 'PGJ-009',
        employeeId: 'EM226',
        name: 'Yoga Pratama',
        role: 'Staf IT',
        branch: 'Bandung',
        organization: 'IT',
        position: 'Staff',
        status: 'Aktif',
        changes: 'Data Pendidikan',
        submittedAt: '27-12-2026',
        fields: [
            { label: 'Pendidikan Terakhir', before: 'D3 Teknik Informatika', after: 'S1 Teknik Informatika' },
            { label: 'Institusi', before: 'Politeknik Negeri Bandung', after: 'Universitas Teknologi Bandung' },
            { label: 'Tahun Lulus', before: '2021', after: '2025' },
        ],
    },
    {
        id: 'PGJ-010',
        employeeId: 'EM198',
        name: 'Lestari Wulan',
        role: 'Senior Staff Designer',
        branch: 'Malang',
        organization: 'Designer',
        position: 'Senior Staff',
        status: 'Aktif',
        changes: 'Data Pendukung',
        submittedAt: '28-12-2026',
        fields: [
            { label: 'NPWP', before: '-', after: '8712345678901234' },
            { label: 'Nama Bank', before: 'Mandiri', after: 'BRI' },
            { label: 'No. Rekening', before: '-', after: '0021010045673' },
        ],
    },
];
