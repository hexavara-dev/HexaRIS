export interface PayrollDeductionSettings {
    alpha: { aktif: boolean; nominal: number };
    terlambat: { aktif: boolean; toleransi_menit: number; nominal_per_30_menit: number };
    bpjs_kesehatan: { aktif: boolean; persentase_karyawan: number; persentase_perusahaan: number };
    bpjs_ketenagakerjaan: { aktif: boolean; persentase_karyawan: number; persentase_perusahaan: number };
    pph21: { aktif: boolean; metode: 'ter' | 'tahunan'; pajak_ditanggung: 'karyawan' | 'perusahaan' };
}

// bpjs_kesehatan/bpjs_ketenagakerjaan's persentase_karyawan match the 1%/2% already hardcoded in
// resources/js/data/Payroll/payrollEntry.ts's generator, so Data Gaji's BPJS figures don't change
// the moment this ships — only when someone actually edits this settings tab.
export const payrollDeductionSettings: PayrollDeductionSettings = {
    alpha: { aktif: true, nominal: 300_000 },
    terlambat: { aktif: true, toleransi_menit: 15, nominal_per_30_menit: 10_000 },
    bpjs_kesehatan: { aktif: true, persentase_karyawan: 1, persentase_perusahaan: 4 },
    bpjs_ketenagakerjaan: { aktif: true, persentase_karyawan: 1, persentase_perusahaan: 2 },
    pph21: { aktif: true, metode: 'ter', pajak_ditanggung: 'karyawan' },
};
