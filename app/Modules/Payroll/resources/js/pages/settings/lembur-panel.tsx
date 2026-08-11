import { SelectField, TextField } from '@/components/form/form-field';
import { type PayrollOvertimeSettings } from '@/data/Payroll/payrollOvertimeSettings';
import { useState } from 'react';
import { toast } from 'sonner';
import { loadOvertimeSettings, saveOvertimeSettings } from '../../lib/payroll-settings-storage';

export function LemburPanel() {
    const [settings, setSettings] = useState<PayrollOvertimeSettings>(loadOvertimeSettings());
    const [nominalInput, setNominalInput] = useState(String(settings.nominal_per_jam));

    const save = () => {
        const nominal = Number(nominalInput.replace(/\D/g, '')) || settings.nominal_per_jam;
        const next = saveOvertimeSettings({ ...settings, nominal_per_jam: nominal });
        setSettings(next);
        setNominalInput(String(next.nominal_per_jam));
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <div className="grid w-full grid-cols-2 gap-6">
                <SelectField
                    label="Hitungan Lembur"
                    htmlFor="hitungan"
                    value={settings.hitungan}
                    onValueChange={() => {}}
                    options={[{ value: 'jam', label: 'Jam' }]}
                />
                <TextField
                    label="Nominal"
                    htmlFor="nominal_per_jam"
                    value={nominalInput}
                    onChange={(v) => setNominalInput(v.replace(/\D/g, ''))}
                    placeholder="Rp 0"
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
