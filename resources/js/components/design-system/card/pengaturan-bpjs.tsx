import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function PercentageInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    return (
        <div className="flex h-10 w-[300px] items-center justify-between rounded-lg border border-[#E7E7E7] bg-white px-4 py-2">
            <p className="w-fit text-base text-[#121212]">{value}</p>
            <div className="flex w-fit flex-col items-start gap-0.5">
                <button type="button" onClick={() => onChange(value + 1)} aria-label="Tambah persentase">
                    <ChevronUp className="size-2.5 text-[#64748B]" />
                </button>
                <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Kurangi persentase">
                    <ChevronDown className="size-2.5 text-[#64748B]" />
                </button>
            </div>
        </div>
    );
}

export interface BpjsSection {
    title: string;
    enabled: boolean;
    onEnabledChange: (value: boolean) => void;
    employeePercentage: number;
    onEmployeePercentageChange: (value: number) => void;
    companyPercentage: number;
    onCompanyPercentageChange: (value: number) => void;
}

function BpjsSectionBlock({
    title,
    enabled,
    onEnabledChange,
    employeePercentage,
    onEmployeePercentageChange,
    companyPercentage,
    onCompanyPercentageChange,
}: BpjsSection) {
    return (
        <div className="flex w-full flex-col items-start gap-5">
            <p className="font-poppins w-full text-sm font-semibold text-black">{title}</p>
            <div className="flex w-full items-center justify-between">
                <p className="w-fit text-[15px] font-medium text-[#64748B]">Aktifkan {title}</p>
                <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>
            {enabled && (
                <>
                    <div className="flex w-full items-center justify-between">
                        <p className="w-fit text-[15px] font-medium text-[#64748B]">Persentase Karyawan</p>
                        <div className="flex w-fit items-center gap-2">
                            <PercentageInput value={employeePercentage} onChange={onEmployeePercentageChange} />
                            <p className="w-fit text-base font-medium text-[#64748B]">%</p>
                        </div>
                    </div>
                    <div className="flex w-full items-center justify-between">
                        <p className="w-fit text-[15px] font-medium text-[#64748B]">Persentase Perusahaan</p>
                        <div className="flex w-fit items-center gap-2">
                            <PercentageInput value={companyPercentage} onChange={onCompanyPercentageChange} />
                            <p className="w-fit text-base font-medium text-[#64748B]">%</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface BpjsSettingsProps {
    sections: BpjsSection[];
}

export function BpjsSettings({ sections }: BpjsSettingsProps) {
    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] p-4">
            <p className="font-poppins w-fit text-xl font-semibold text-[#0F172A]">BPJS</p>
            {sections.map((section, index) => (
                <div key={section.title} className="flex w-full flex-col items-start gap-6">
                    <BpjsSectionBlock {...section} />
                    {index < sections.length - 1 && <div className="h-px w-full bg-[#E7E7E7]" />}
                </div>
            ))}
        </div>
    );
}

export function BpjsSettingsDemo() {
    const [kesehatanEnabled, setKesehatanEnabled] = useState(true);
    const [kesehatanEmployee, setKesehatanEmployee] = useState(1);
    const [kesehatanCompany, setKesehatanCompany] = useState(4);

    const [ketenagakerjaanEnabled, setKetenagakerjaanEnabled] = useState(true);
    const [ketenagakerjaanEmployee, setKetenagakerjaanEmployee] = useState(1);
    const [ketenagakerjaanCompany, setKetenagakerjaanCompany] = useState(2);

    return (
        <BpjsSettings
            sections={[
                {
                    title: 'BPJS Kesehatan',
                    enabled: kesehatanEnabled,
                    onEnabledChange: setKesehatanEnabled,
                    employeePercentage: kesehatanEmployee,
                    onEmployeePercentageChange: setKesehatanEmployee,
                    companyPercentage: kesehatanCompany,
                    onCompanyPercentageChange: setKesehatanCompany,
                },
                {
                    title: 'BPJS Ketenagakerjaan',
                    enabled: ketenagakerjaanEnabled,
                    onEnabledChange: setKetenagakerjaanEnabled,
                    employeePercentage: ketenagakerjaanEmployee,
                    onEmployeePercentageChange: setKetenagakerjaanEmployee,
                    companyPercentage: ketenagakerjaanCompany,
                    onCompanyPercentageChange: setKetenagakerjaanCompany,
                },
            ]}
        />
    );
}
