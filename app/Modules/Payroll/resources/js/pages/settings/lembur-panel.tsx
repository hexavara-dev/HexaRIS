import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type PayrollOvertimeSettings } from '@/data/Payroll/payrollOvertimeSettings';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { loadOvertimeSettings, saveOvertimeSettings } from '../../lib/payroll-settings-storage';

function formatRupiahInput(digits: string): string {
    if (!digits) return '';
    return `Rp${Number(digits).toLocaleString('id-ID')}`;
}

const HITUNGAN_OPTIONS: { value: PayrollOvertimeSettings['hitungan']; label: string }[] = [
    { value: 'jam', label: 'Jam' },
    { value: 'hari', label: 'Hari' },
];

function Row({ label, control }: { label: string; control: ReactNode }) {
    return (
        <div className="flex w-full items-center justify-between">
            <p className="font-poppins text-sm text-[#4F4F4F]">{label}</p>
            {control}
        </div>
    );
}

export function LemburPanel() {
    const [settings, setSettings] = useState<PayrollOvertimeSettings>(loadOvertimeSettings());
    const [nominalInput, setNominalInput] = useState(formatRupiahInput(String(settings.nominal_per_jam)));

    const save = () => {
        const digits = nominalInput.replace(/\D/g, '');
        const nominal = Number(digits) || settings.nominal_per_jam;
        const next = saveOvertimeSettings({ ...settings, nominal_per_jam: nominal });
        setSettings(next);
        setNominalInput(formatRupiahInput(String(next.nominal_per_jam)));
        toast.success('Berhasil Disimpan');
    };

    return (
        <div className="flex w-full flex-col items-start gap-5 rounded-lg border border-[#E7E7E7] bg-white p-6">
            <Row
                label="Hitungan Lembur"
                control={
                    <Select
                        value={settings.hitungan}
                        onValueChange={(v) => setSettings((current) => ({ ...current, hitungan: v as PayrollOvertimeSettings['hitungan'] }))}
                    >
                        <SelectTrigger className="w-[220px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {HITUNGAN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />
            <Row
                label="Nominal"
                control={
                    <input
                        id="nominal_per_jam"
                        type="text"
                        value={nominalInput}
                        placeholder="Rp 0"
                        onChange={(e) => setNominalInput(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                        className="font-poppins w-[220px] rounded-lg border border-[#E7E7E7] px-4 py-2 text-sm"
                    />
                }
            />

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
