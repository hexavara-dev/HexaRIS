import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface PphOption {
    label: string;
    value: string;
}

interface PphSettingsProps {
    enabled: boolean;
    onEnabledChange: (value: boolean) => void;
    calculationMethod?: string;
    onCalculationMethodChange: (value: string) => void;
    calculationMethodOptions: PphOption[];
    taxBorneBy?: string;
    onTaxBorneByChange: (value: string) => void;
    taxBorneByOptions: PphOption[];
}

const fieldControlClassName = 'h-auto w-full rounded-lg border-[#E7E7E7] px-4 py-3 text-sm font-medium text-[#1E293B]';

export function PphSettings({
    enabled,
    onEnabledChange,
    calculationMethod,
    onCalculationMethodChange,
    calculationMethodOptions,
    taxBorneBy,
    onTaxBorneByChange,
    taxBorneByOptions,
}: PphSettingsProps) {
    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] p-4">
            <p className="font-poppins w-fit text-xl font-semibold text-[#0F172A]">PPh 21</p>

            <div className="flex w-full items-center justify-between py-1">
                <p className="font-poppins w-fit text-sm font-semibold text-black">Aktifkan PPh 21</p>
                <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>

            {enabled && (
                <>
                    <div className="flex w-full flex-col items-start gap-2">
                        <p className="font-poppins w-full text-[13px] font-medium text-[#64748B]">Metode Perhitungan</p>
                        <Select value={calculationMethod} onValueChange={onCalculationMethodChange}>
                            <SelectTrigger className={cn(fieldControlClassName, 'justify-between')}>
                                <SelectValue placeholder="Pilih Metode Perhitungan" />
                            </SelectTrigger>
                            <SelectContent>
                                {calculationMethodOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-full flex-col items-start gap-2">
                        <p className="font-poppins w-full text-[13px] font-medium text-[#64748B]">Pajak Ditanggung</p>
                        <Select value={taxBorneBy} onValueChange={onTaxBorneByChange}>
                            <SelectTrigger className={cn(fieldControlClassName, 'justify-between')}>
                                <SelectValue placeholder="Pilih Pajak Ditanggung" />
                            </SelectTrigger>
                            <SelectContent>
                                {taxBorneByOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}
        </div>
    );
}

export function PphSettingsDemo() {
    const [enabled, setEnabled] = useState(true);
    const [calculationMethod, setCalculationMethod] = useState('ter');
    const [taxBorneBy, setTaxBorneBy] = useState('karyawan');

    return (
        <PphSettings
            enabled={enabled}
            onEnabledChange={setEnabled}
            calculationMethod={calculationMethod}
            onCalculationMethodChange={setCalculationMethod}
            calculationMethodOptions={[
                { label: 'Tarif Efektif (TER)', value: 'ter' },
                { label: 'Metode Gross', value: 'gross' },
                { label: 'Metode Gross Up', value: 'gross-up' },
            ]}
            taxBorneBy={taxBorneBy}
            onTaxBorneByChange={setTaxBorneBy}
            taxBorneByOptions={[
                { label: 'Karyawan', value: 'karyawan' },
                { label: 'Perusahaan', value: 'perusahaan' },
            ]}
        />
    );
}
