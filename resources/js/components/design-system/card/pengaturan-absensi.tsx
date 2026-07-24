import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function formatRupiah(value: number) {
    return `Rp${value.toLocaleString('id-ID')}`;
}

interface AttendanceSettingsProps {
    deductOnAbsent: boolean;
    onDeductOnAbsentChange: (value: boolean) => void;
    absentDeductionAmount: number;
    onAbsentDeductionAmountChange: (value: number) => void;

    deductOnLate: boolean;
    onDeductOnLateChange: (value: boolean) => void;
    lateToleranceMinutes: number;
    onLateToleranceMinutesChange: (value: number) => void;
    lateDeductionAmount: number;
    onLateDeductionAmountChange: (value: number) => void;
    lateDeductionIntervalMinutes: number;
}

export function AttendanceSettings({
    deductOnAbsent,
    onDeductOnAbsentChange,
    absentDeductionAmount,
    onAbsentDeductionAmountChange,
    deductOnLate,
    onDeductOnLateChange,
    lateToleranceMinutes,
    onLateToleranceMinutesChange,
    lateDeductionAmount,
    onLateDeductionAmountChange,
    lateDeductionIntervalMinutes,
}: AttendanceSettingsProps) {
    return (
        <div className="flex w-full flex-col items-start gap-6 rounded-lg border border-[#E7E7E7] p-4">
            <p className="font-poppins w-fit text-xl font-semibold text-[#0F172A]">Absensi</p>

            <div className="flex w-full flex-col items-start gap-6">
                <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex w-full items-center justify-between">
                        <p className="font-poppins w-fit text-sm font-semibold text-black">Potong Jika Alpha</p>
                        <Switch checked={deductOnAbsent} onCheckedChange={onDeductOnAbsentChange} />
                    </div>
                    {deductOnAbsent && (
                        <div className="flex w-full flex-col items-start gap-3 pl-3">
                            <div className="flex w-full items-center justify-between">
                                <p className="w-[180px] text-sm font-medium text-[#64748B]">Nominal</p>
                                <Input
                                    value={formatRupiah(absentDeductionAmount)}
                                    onChange={(event) => onAbsentDeductionAmountChange(Number(event.target.value.replace(/\D/g, '')) || 0)}
                                    className="h-auto w-[280px] rounded-lg border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px w-full bg-[#E2E8F0]" />

                <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex w-full items-center justify-between">
                        <p className="font-poppins w-fit text-sm font-semibold text-black">Potong Jika Terlambat</p>
                        <Switch checked={deductOnLate} onCheckedChange={onDeductOnLateChange} />
                    </div>
                    {deductOnLate && (
                        <div className="flex w-full flex-col items-start gap-3 pl-3">
                            <div className="flex w-full items-center justify-between">
                                <p className="w-[180px] text-sm font-medium text-[#64748B]">Toleransi Keterlambatan</p>
                                <div className="flex w-fit items-center gap-3">
                                    <Input
                                        type="number"
                                        value={lateToleranceMinutes}
                                        onChange={(event) => onLateToleranceMinutesChange(Number(event.target.value) || 0)}
                                        className="h-auto w-[200px] rounded-lg border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A]"
                                    />
                                    <p className="w-20 text-sm font-medium text-[#64748B]">Menit</p>
                                </div>
                            </div>
                            <div className="flex w-full items-center justify-between">
                                <p className="w-[180px] text-sm font-medium text-[#64748B]">Nominal Potongan</p>
                                <div className="flex w-fit items-center gap-3">
                                    <div className="flex h-auto w-[200px] items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">
                                        <p className="w-fit text-sm text-[#0F172A]">{formatRupiah(lateDeductionAmount)}</p>
                                        <div className="flex w-fit flex-col items-start gap-0.5">
                                            <button
                                                type="button"
                                                onClick={() => onLateDeductionAmountChange(lateDeductionAmount + 1000)}
                                                aria-label="Tambah nominal"
                                            >
                                                <ChevronUp className="size-2.5 text-[#64748B]" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onLateDeductionAmountChange(Math.max(0, lateDeductionAmount - 1000))}
                                                aria-label="Kurangi nominal"
                                            >
                                                <ChevronDown className="size-2.5 text-[#64748B]" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="w-20 text-sm font-medium text-[#64748B]">/ {lateDeductionIntervalMinutes} Menit</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AttendanceSettingsDemo() {
    const [deductOnAbsent, setDeductOnAbsent] = useState(true);
    const [absentDeductionAmount, setAbsentDeductionAmount] = useState(300000);
    const [deductOnLate, setDeductOnLate] = useState(true);
    const [lateToleranceMinutes, setLateToleranceMinutes] = useState(15);
    const [lateDeductionAmount, setLateDeductionAmount] = useState(10000);

    return (
        <AttendanceSettings
            deductOnAbsent={deductOnAbsent}
            onDeductOnAbsentChange={setDeductOnAbsent}
            absentDeductionAmount={absentDeductionAmount}
            onAbsentDeductionAmountChange={setAbsentDeductionAmount}
            deductOnLate={deductOnLate}
            onDeductOnLateChange={setDeductOnLate}
            lateToleranceMinutes={lateToleranceMinutes}
            onLateToleranceMinutesChange={setLateToleranceMinutes}
            lateDeductionAmount={lateDeductionAmount}
            onLateDeductionAmountChange={setLateDeductionAmount}
            lateDeductionIntervalMinutes={30}
        />
    );
}
