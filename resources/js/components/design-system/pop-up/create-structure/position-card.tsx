import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

import { TypeOption } from './add-position-dialog';
import { type PositionInput, type PositionType } from './types';

interface PositionCardProps {
    position: PositionInput;
    onChange: (position: PositionInput) => void;
    onRemove?: () => void;
}

export function PositionCard({ position, onChange, onRemove }: PositionCardProps) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="position-name" className="text-[13px] font-semibold text-[#0F172A]">
                            Nama Posisi Jabatan <span className="text-[#E84A39]">*</span>
                        </Label>

                        <Input
                            value={position.name}
                            onChange={(event) =>
                                onChange({
                                    ...position,
                                    name: event.target.value,
                                })
                            }
                            placeholder="Masukkan Nama Posisi Jabatan"
                            className="h-11 rounded-lg border-[#CBD5E1] text-[13px]"
                        />
                    </div>
                </div>

                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="mt-7 rounded-md p-2 text-[#64748B] hover:bg-red-50 hover:text-red-500"
                        aria-label="Hapus posisi"
                    >
                        <Trash2 className="size-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label className="text-[13px] font-semibold text-[#0F172A]">
                    Report To <span className="text-[#E84A39]">*</span>
                </Label>

                <Select
                    value={position.reportTo}
                    onValueChange={(value) =>
                        onChange({
                            ...position,
                            reportTo: value,
                        })
                    }
                >
                    <SelectTrigger className="h-11 w-full cursor-pointer rounded-lg border-[#CBD5E1] text-[13px] shadow-none">
                        <SelectValue placeholder="Report To" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="none">Tidak ada atasan / Posisi utama dalam organisasi ini</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <Label className="text-[13px] font-semibold text-[#0F172A]">
                    Apakah karyawan di posisi ini bisa lebih dari 1? <span className="text-[#E84A39]">*</span>
                </Label>

                <RadioGroup
                    value={position.type}
                    onValueChange={(value) =>
                        onChange({
                            ...position,
                            type: value as PositionType,
                        })
                    }
                    className="grid grid-cols-2 gap-2"
                >
                    <TypeOption value="multi" selected={position.type === 'multi'} label="Ya, bisa lebih dari 1" />

                    <TypeOption value="single" selected={position.type === 'single'} label="Tidak, hanya 1 karyawan" />
                </RadioGroup>
            </div>
        </div>
    );
}
