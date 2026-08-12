import { SelectField, TextField } from '@/components/form/form-field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type PayrollGeneralSettings } from '@/data/Payroll/payrollGeneralSettings';
import { useState } from 'react';
import { toast } from 'sonner';
import { loadGeneralSettings, saveGeneralSettings } from '../../lib/payroll-settings-storage';

export function UmumPanel() {
    const [settings, setSettings] = useState<PayrollGeneralSettings>(loadGeneralSettings);
    const [tanggalInput, setTanggalInput] = useState(String(settings.tanggal_pembayaran));

    const save = () => {
        const tanggal = Number(tanggalInput.replace(/\D/g, '')) || settings.tanggal_pembayaran;
        const next = saveGeneralSettings({ ...settings, tanggal_pembayaran: tanggal });
        setSettings(next);
        setTanggalInput(String(next.tanggal_pembayaran));
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <div className="flex w-full flex-col items-start gap-3">
                <p className="font-poppins text-sm font-semibold text-black">Jenis Gaji</p>
                <RadioGroup
                    value={settings.jenis_gaji}
                    onValueChange={(value) => setSettings((current) => ({ ...current, jenis_gaji: value as PayrollGeneralSettings['jenis_gaji'] }))}
                    className="flex flex-col items-start gap-3"
                >
                    <label className="flex items-center gap-2.5">
                        <RadioGroupItem value="bulanan" />
                        <span className="font-poppins text-sm font-medium text-[#121212]">Bulanan</span>
                    </label>
                    <label className="flex items-center gap-2.5">
                        <RadioGroupItem value="harian" />
                        <span className="font-poppins text-sm font-medium text-[#121212]">Harian</span>
                    </label>
                </RadioGroup>
            </div>

            <div className="w-full">
                <TextField
                    label="Tanggal Pembayaran"
                    htmlFor="tanggal_pembayaran"
                    value={tanggalInput}
                    onChange={(value) => setTanggalInput(value.replace(/\D/g, ''))}
                />
            </div>

            <div className="w-full">
                <SelectField
                    label="Mata Uang"
                    htmlFor="mata_uang"
                    value={settings.mata_uang}
                    onValueChange={() => {}}
                    options={[{ value: 'IDR', label: 'Rupiah (IDR)' }]}
                />
            </div>

            <div className="flex w-full justify-end pt-4">
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
