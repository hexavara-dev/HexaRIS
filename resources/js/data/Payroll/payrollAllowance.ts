export interface PayrollAllowance {
    id: string;
    nama: string;
    nominal: number;
    periode: 'bulanan' | 'harian' | 'sekali';
    aktif: boolean;
}

// Applied uniformly to every employee in Data Gaji's recompute (Task 5) — there is no
// per-employee allowance-assignment concept in this dummy dataset.
export const payrollAllowance: PayrollAllowance[] = [
    { id: 'allowance-makan', nama: 'Tunjangan Makan', nominal: 400_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-transport', nama: 'Tunjangan Transport', nominal: 300_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-jabatan', nama: 'Tunjangan Jabatan', nominal: 500_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-komunikasi', nama: 'Tunjangan Komunikasi', nominal: 150_000, periode: 'bulanan', aktif: true },
    { id: 'allowance-kesehatan', nama: 'Tunjangan Kesehatan', nominal: 250_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-lembur-harian', nama: 'Tunjangan Lembur Harian', nominal: 50_000, periode: 'harian', aktif: false },
    { id: 'allowance-thr', nama: 'Tunjangan Hari Raya', nominal: 1_000_000, periode: 'sekali', aktif: false },
    { id: 'allowance-rumah', nama: 'Tunjangan Perumahan', nominal: 600_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-anak', nama: 'Tunjangan Anak', nominal: 200_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-jabatan-struktural', nama: 'Tunjangan Jabatan Struktural', nominal: 750_000, periode: 'bulanan', aktif: false },
    { id: 'allowance-shift', nama: 'Tunjangan Shift Malam', nominal: 100_000, periode: 'harian', aktif: false },
    { id: 'allowance-pulsa', nama: 'Tunjangan Pulsa', nominal: 100_000, periode: 'bulanan', aktif: false },
];
