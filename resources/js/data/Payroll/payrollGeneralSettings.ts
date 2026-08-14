export interface PayrollGeneralSettings {
    jenis_gaji: 'bulanan' | 'harian';
    tanggal_pembayaran: number;
    mata_uang: 'IDR';
}

export const payrollGeneralSettings: PayrollGeneralSettings = {
    jenis_gaji: 'bulanan',
    tanggal_pembayaran: 25,
    mata_uang: 'IDR',
};
