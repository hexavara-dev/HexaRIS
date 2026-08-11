import { SelectField } from '@/components/form/form-field';
import { Switch } from '@/components/ui/switch';
import { type PayrollDeductionSettings } from '@/data/Payroll/payrollDeductionSettings';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { loadDeductionSettings, saveDeductionSettings } from '../../lib/payroll-settings-storage';

function toNumber(value: string): number {
    return Number(value.replace(/\D/g, '')) || 0;
}

function SettingRow({ label, control, aktif }: { label: string; control: ReactNode; aktif?: boolean }) {
    return (
        <div className={aktif === false ? 'flex w-full items-center justify-between opacity-50' : 'flex w-full items-center justify-between'}>
            <p className="font-poppins text-sm text-[#4F4F4F]">{label}</p>
            {control}
        </div>
    );
}

function NumberInput({ value, onChange, suffix, disabled }: { value: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(toNumber(e.target.value))}
                className="font-poppins w-[180px] rounded-lg border border-[#E7E7E7] px-4 py-2 text-sm disabled:bg-[#F5F5F5] disabled:text-[#ACACAC]"
            />
            {suffix && <span className="font-poppins text-sm text-[#4F4F4F]">{suffix}</span>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex w-full flex-col items-start gap-5 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <p className="font-poppins text-base font-semibold text-black">{title}</p>
            <div className="flex w-full flex-col items-start gap-5">{children}</div>
        </div>
    );
}

export function PotonganPanel() {
    const [settings, setSettings] = useState<PayrollDeductionSettings>(loadDeductionSettings);

    const set = <K extends keyof PayrollDeductionSettings>(key: K, patch: Partial<PayrollDeductionSettings[K]>) =>
        setSettings((current) => ({ ...current, [key]: { ...current[key], ...patch } }));

    const save = () => {
        const next = saveDeductionSettings(settings);
        setSettings(next);
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-4">
            <Section title="Absensi">
                <SettingRow
                    label="Potong Jika Alpha"
                    control={<Switch checked={settings.alpha.aktif} onCheckedChange={(v) => set('alpha', { aktif: v })} />}
                />
                <SettingRow
                    label="Nominal"
                    aktif={settings.alpha.aktif}
                    control={
                        <NumberInput
                            value={settings.alpha.nominal}
                            disabled={!settings.alpha.aktif}
                            onChange={(v) => set('alpha', { nominal: v })}
                        />
                    }
                />
                <SettingRow
                    label="Potong Jika Terlambat"
                    control={<Switch checked={settings.terlambat.aktif} onCheckedChange={(v) => set('terlambat', { aktif: v })} />}
                />
                <SettingRow
                    label="Toleransi Keterlambatan"
                    aktif={settings.terlambat.aktif}
                    control={
                        <NumberInput
                            value={settings.terlambat.toleransi_menit}
                            suffix="Menit"
                            disabled={!settings.terlambat.aktif}
                            onChange={(v) => set('terlambat', { toleransi_menit: v })}
                        />
                    }
                />
                <SettingRow
                    label="Nominal Potongan"
                    aktif={settings.terlambat.aktif}
                    control={
                        <NumberInput
                            value={settings.terlambat.nominal_per_30_menit}
                            suffix="/ 30 Menit"
                            disabled={!settings.terlambat.aktif}
                            onChange={(v) => set('terlambat', { nominal_per_30_menit: v })}
                        />
                    }
                />
            </Section>

            <Section title="BPJS">
                <p className="font-poppins text-sm font-semibold text-black">BPJS Kesehatan</p>
                <SettingRow
                    label="Aktifkan BPJS Kesehatan"
                    control={<Switch checked={settings.bpjs_kesehatan.aktif} onCheckedChange={(v) => set('bpjs_kesehatan', { aktif: v })} />}
                />
                <SettingRow
                    label="Persentase Karyawan"
                    aktif={settings.bpjs_kesehatan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_kesehatan.persentase_karyawan}
                            suffix="%"
                            disabled={!settings.bpjs_kesehatan.aktif}
                            onChange={(v) => set('bpjs_kesehatan', { persentase_karyawan: v })}
                        />
                    }
                />
                <SettingRow
                    label="Persentase Perusahaan"
                    aktif={settings.bpjs_kesehatan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_kesehatan.persentase_perusahaan}
                            suffix="%"
                            disabled={!settings.bpjs_kesehatan.aktif}
                            onChange={(v) => set('bpjs_kesehatan', { persentase_perusahaan: v })}
                        />
                    }
                />

                <p className="font-poppins text-sm font-semibold text-black">BPJS Ketenagakerjaan</p>
                <SettingRow
                    label="Aktifkan BPJS Ketenagakerjaan"
                    control={<Switch checked={settings.bpjs_ketenagakerjaan.aktif} onCheckedChange={(v) => set('bpjs_ketenagakerjaan', { aktif: v })} />}
                />
                <SettingRow
                    label="Persentase Karyawan"
                    aktif={settings.bpjs_ketenagakerjaan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_ketenagakerjaan.persentase_karyawan}
                            suffix="%"
                            disabled={!settings.bpjs_ketenagakerjaan.aktif}
                            onChange={(v) => set('bpjs_ketenagakerjaan', { persentase_karyawan: v })}
                        />
                    }
                />
                <SettingRow
                    label="Persentase Perusahaan"
                    aktif={settings.bpjs_ketenagakerjaan.aktif}
                    control={
                        <NumberInput
                            value={settings.bpjs_ketenagakerjaan.persentase_perusahaan}
                            suffix="%"
                            disabled={!settings.bpjs_ketenagakerjaan.aktif}
                            onChange={(v) => set('bpjs_ketenagakerjaan', { persentase_perusahaan: v })}
                        />
                    }
                />
            </Section>

            <Section title="PPh 21">
                <SettingRow
                    label="Aktifkan PPh 21"
                    control={<Switch checked={settings.pph21.aktif} onCheckedChange={(v) => set('pph21', { aktif: v })} />}
                />
                <div className="w-full max-w-xs">
                    <SelectField
                        label="Metode Perhitungan"
                        htmlFor="metode"
                        disabled={!settings.pph21.aktif}
                        value={settings.pph21.metode}
                        onValueChange={(v) => set('pph21', { metode: v as PayrollDeductionSettings['pph21']['metode'] })}
                        options={[
                            { value: 'ter', label: 'Tarif Efektif (TER)' },
                            { value: 'tahunan', label: 'Perhitungan Tahunan' },
                        ]}
                    />
                </div>
                <div className="w-full max-w-xs">
                    <SelectField
                        label="Pajak Ditanggung"
                        htmlFor="pajak_ditanggung"
                        disabled={!settings.pph21.aktif}
                        value={settings.pph21.pajak_ditanggung}
                        onValueChange={(v) => set('pph21', { pajak_ditanggung: v as PayrollDeductionSettings['pph21']['pajak_ditanggung'] })}
                        options={[
                            { value: 'karyawan', label: 'Karyawan' },
                            { value: 'perusahaan', label: 'Perusahaan' },
                        ]}
                    />
                </div>
            </Section>

            <div className="flex w-full justify-end">
                <button
                    type="button"
                    onClick={save}
                    className="font-poppins cursor-pointer rounded-lg bg-[#1980C0] px-8 py-3 text-sm font-semibold text-white"
                >
                    Simpan
                </button>
            </div>
        </div>
    );
}
