/**
 * Seed data for the Karyawan Resign list — mirrors pengajuan-dummy's shape
 * (denormalized employee columns) so the table stays renderable without
 * joining the employee store, and keeps submitted requests across refresh.
 */
export interface ResignRecord {
    /** Unique request key — the ID column shows the employee id instead. */
    id: string;
    employeeId: string;
    name: string;
    branch: string;
    organization: string;
    position: string;
    /** Design shows the short US-style date, e.g. 12/19/26. */
    submittedAt: string;
    reason: string;
    status: 'Menunggu' | 'Ditolak' | 'Non Aktif';
    /** Short-date resign date from the "+ Resign" form — seeds fall back to submittedAt. */
    resignDate?: string;
    /** Supporting document filename, or undefined when none was attached. */
    doc?: string;
    /** Short-date ACC captured by the Approve dialog. */
    accDate?: string;
    /** Filled by the Reject dialog. */
    rejectReason?: string;
}

export const RESIGN_DUMMY: ResignRecord[] = [
    {
        id: 'RSG-001',
        employeeId: 'EM187',
        name: 'Saskya Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        submittedAt: '12/19/26',
        reason: 'Dapat opportunity di perusahaan lain',
        status: 'Menunggu',
    },
    {
        id: 'RSG-002',
        employeeId: 'EM188',
        name: 'Ayu Sasmita',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        submittedAt: '12/19/26',
        reason: 'Dapat opportunity di perusahaan lain',
        status: 'Ditolak',
    },
    {
        id: 'RSG-003',
        employeeId: 'EM189',
        name: 'Dimas Pratama',
        branch: 'Bandung',
        organization: 'IT',
        position: 'Supervisor',
        submittedAt: '12/20/26',
        reason: 'Melanjutkan pendidikan S2',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-004',
        employeeId: 'EM190',
        name: 'Bagas Saputra',
        branch: 'Jakarta',
        organization: 'Produksi',
        position: 'Senior Staff',
        submittedAt: '12/21/26',
        reason: 'Pindah domisili ke luar kota',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-005',
        employeeId: 'EM191',
        name: 'Nabila Zahra',
        branch: 'Bandung',
        organization: 'HR',
        position: 'Staff',
        submittedAt: '12/22/26',
        reason: 'Fokus pada usaha keluarga',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-006',
        employeeId: 'EM192',
        name: 'Rani Oktaviani',
        branch: 'Surabaya',
        organization: 'Finance',
        position: 'Manager',
        submittedAt: '12/23/26',
        reason: 'Dapat tawaran gaji lebih tinggi',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-007',
        employeeId: 'EM193',
        name: 'Ahmad Fauzi',
        branch: 'Surabaya',
        organization: 'Finance',
        position: 'Supervisor',
        submittedAt: '12/24/26',
        reason: 'Kesehatan keluarga',
        status: 'Menunggu',
    },
    {
        id: 'RSG-008',
        employeeId: 'EM194',
        name: 'Sinta Maharani',
        branch: 'Jakarta',
        organization: 'HR',
        position: 'Manager',
        submittedAt: '12/25/26',
        reason: 'Relokasi luar negeri',
        status: 'Menunggu',
    },
    {
        id: 'RSG-009',
        employeeId: 'EM195',
        name: 'Yoga Pratama',
        branch: 'Bandung',
        organization: 'IT',
        position: 'Staff',
        submittedAt: '12/26/26',
        reason: 'Kontrak kerja berakhir',
        status: 'Ditolak',
    },
    {
        id: 'RSG-010',
        employeeId: 'EM196',
        name: 'Lestari Wulan',
        branch: 'Malang',
        organization: 'Designer',
        position: 'Senior Staff',
        submittedAt: '12/27/26',
        reason: 'Alasan keluarga',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-011',
        employeeId: 'EM197',
        name: 'Rizky Ananda',
        branch: 'Jakarta',
        organization: 'IT',
        position: 'Senior Staff',
        submittedAt: '12/28/26',
        reason: 'Fokus karier di bidang lain',
        status: 'Menunggu',
    },
    {
        id: 'RSG-012',
        employeeId: 'EM198',
        name: 'Putri Amelia',
        branch: 'Bandung',
        organization: 'HR',
        position: 'Staff',
        submittedAt: '12/29/26',
        reason: 'Mengurus keluarga',
        status: 'Menunggu',
    },
    {
        id: 'RSG-013',
        employeeId: 'EM199',
        name: 'Yudi Saputra',
        branch: 'Surabaya',
        organization: 'Produksi',
        position: 'Supervisor',
        submittedAt: '12/30/26',
        reason: 'Pindah domisili ke luar kota',
        status: 'Ditolak',
    },
    {
        id: 'RSG-014',
        employeeId: 'EM200',
        name: 'Citra Lestari',
        branch: 'Malang',
        organization: 'Designer',
        position: 'Manager',
        submittedAt: '12/31/26',
        reason: 'Membuka usaha sendiri',
        status: 'Ditolak',
    },
    {
        id: 'RSG-015',
        employeeId: 'EM201',
        name: 'Fajar Nugroho',
        branch: 'Jakarta',
        organization: 'Finance',
        position: 'Staff',
        submittedAt: '01/02/27',
        reason: 'Kontrak kerja berakhir',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-016',
        employeeId: 'EM202',
        name: 'Ayu Wulandari',
        branch: 'Bandung',
        organization: 'Creatif',
        position: 'Senior Staff',
        submittedAt: '01/03/27',
        reason: 'Melanjutkan pendidikan S2',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-017',
        employeeId: 'EM203',
        name: 'Bagus Hermawan',
        branch: 'Surabaya',
        organization: 'IT',
        position: 'Staff',
        submittedAt: '01/04/27',
        reason: 'Dapat tawaran gaji lebih tinggi',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-018',
        employeeId: 'EM204',
        name: 'Nadia Safitri',
        branch: 'Jakarta',
        organization: 'HR',
        position: 'Manager',
        submittedAt: '01/05/27',
        reason: 'Relokasi keluarga',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-019',
        employeeId: 'EM205',
        name: 'Hendra Kusuma',
        branch: 'Malang',
        organization: 'Produksi',
        position: 'Supervisor',
        submittedAt: '01/06/27',
        reason: 'Kesehatan',
        status: 'Non Aktif',
    },
    {
        id: 'RSG-020',
        employeeId: 'EM206',
        name: 'Salsabila Ayu',
        branch: 'Jakarta',
        organization: 'Creatif',
        position: 'Staff',
        submittedAt: '01/07/27',
        reason: 'Dapat opportunity di perusahaan lain',
        status: 'Non Aktif',
    },
];

/**
 * Versioned key — an older build stored the first 10-record seed here, and a
 * plain length check would keep serving that stale copy over the 20-row seed.
 */
const STORAGE_KEY = 'hexaris.employee.resign-records-v2';

export function loadResignRecords(): ResignRecord[] {
    if (typeof window === 'undefined') return RESIGN_DUMMY;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return RESIGN_DUMMY;

        const parsed = JSON.parse(raw) as unknown;

        return Array.isArray(parsed) && parsed.length > 0 ? (parsed as ResignRecord[]) : RESIGN_DUMMY;
    } catch {
        return RESIGN_DUMMY;
    }
}

export function saveResignRecords(records: ResignRecord[]): ResignRecord[] {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    return records;
}
