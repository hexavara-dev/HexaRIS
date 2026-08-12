export interface PayrollAllowance {
    id: string;
    nama: string;
    nominal: number;
    periode: 'bulanan' | 'harian' | 'tahunan';
    aktif: boolean;
}

// Applied uniformly to every employee in Data Gaji's recompute (Task 5) — there is no
// per-employee allowance-assignment concept in this dummy dataset.
// IDs follow "PGT NN" (Pengaturan Gaji Tunjangan) — payroll-settings-storage.ts's
// createAllowance continues this sequence for locally-added rows.
export const payrollAllowance: PayrollAllowance[] = [
    { id: 'PGT 01', nama: 'Tunjangan Makan', nominal: 400_000, periode: 'bulanan', aktif: true },
    { id: 'PGT 02', nama: 'Tunjangan Transport', nominal: 300_000, periode: 'bulanan', aktif: true },
    { id: 'PGT 03', nama: 'Tunjangan Jabatan', nominal: 500_000, periode: 'bulanan', aktif: true },
    { id: 'PGT 04', nama: 'Tunjangan Komunikasi', nominal: 150_000, periode: 'bulanan', aktif: true },
    { id: 'PGT 05', nama: 'Tunjangan Kesehatan', nominal: 250_000, periode: 'bulanan', aktif: false },
    { id: 'PGT 06', nama: 'Tunjangan Lembur Harian', nominal: 50_000, periode: 'harian', aktif: false },
    { id: 'PGT 07', nama: 'Tunjangan Hari Raya', nominal: 1_000_000, periode: 'tahunan', aktif: false },
    { id: 'PGT 08', nama: 'Tunjangan Perumahan', nominal: 600_000, periode: 'bulanan', aktif: false },
    { id: 'PGT 09', nama: 'Tunjangan Anak', nominal: 200_000, periode: 'bulanan', aktif: false },
    { id: 'PGT 10', nama: 'Tunjangan Jabatan Struktural', nominal: 750_000, periode: 'bulanan', aktif: false },
    { id: 'PGT 11', nama: 'Tunjangan Shift Malam', nominal: 100_000, periode: 'harian', aktif: false },
    { id: 'PGT 12', nama: 'Tunjangan Pulsa', nominal: 100_000, periode: 'bulanan', aktif: false },
];
