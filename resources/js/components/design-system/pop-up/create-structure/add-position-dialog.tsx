import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { PositionCard } from './position-card';
import { type PositionInput, type PositionType } from './types';

interface AddPositionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (inputs: PositionInput[]) => void;
}

export function AddPositionDialog({ open, onOpenChange, onSubmit }: AddPositionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-xl p-0">
                <AddPositionForm onClose={() => onOpenChange(false)} onSubmit={onSubmit} />
            </DialogContent>
        </Dialog>
    );
}

export function TypeOption({ value, selected, label }: { value: PositionType; selected: boolean; label: string }) {
    const id = `position-type-${value}`;

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-[12px] leading-4 text-[#0F172A] transition-colors',
                selected ? 'border-[#1980C0] bg-[#EAF6FF]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]',
            )}
        >
            <RadioGroupItem value={value} id={id} className="shrink-0" />

            {label}
        </label>
    );
}

function AddPositionForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (inputs: PositionInput[]) => void }) {
    const [positions, setPositions] = useState<PositionInput[]>([
        {
            name: '',
            type: 'single',
            reportTo: 'none',
        },
    ]);

    function addPosition() {
        setPositions((current) => [
            ...current,
            {
                name: '',
                type: 'single',
                reportTo: 'none',
            },
        ]);
    }

    function updatePosition(index: number, position: PositionInput) {
        setPositions((current) => current.map((item, itemIndex) => (itemIndex === index ? position : item)));
    }

    function removePosition(index: number) {
        setPositions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }

    function submit() {
        const validPositions = positions.filter((position) => position.name.trim());

        if (validPositions.length === 0) return;

        onSubmit(validPositions);
    }

    const canSubmit = positions.some((position) => position.name.trim());

    return (
        <>
            <DialogHeader className="border-b border-[#E2E8F0] px-5 py-4">
                <DialogTitle className="text-[17px] font-semibold text-[#0F172A]">Tambah Posisi Jabatan</DialogTitle>
            </DialogHeader>

            <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto px-5 py-4">
                <button
                    type="button"
                    onClick={addPosition}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#1980C0] bg-blue-50 py-3 text-[13px] font-semibold text-[#1980C0]"
                >
                    <Plus aria-hidden="true" className="size-4" />
                    Tambah Posisi Jabatan
                </button>

                {positions.map((position, index) => (
                    <PositionCard
                        key={index}
                        position={position}
                        onChange={(nextPosition) => updatePosition(index, nextPosition)}
                        onRemove={positions.length > 1 ? () => removePosition(index) : undefined}
                    />
                ))}
            </div>

            <DialogFooter className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] px-5 py-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-11 w-full rounded-lg border-[#1980C0] bg-white text-[13px] font-semibold text-[#1980C0] hover:bg-[#EAF6FF] hover:text-[#1980C0]"
                >
                    Batal
                </Button>

                <Button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit}
                    className="h-11 w-full rounded-lg bg-[#1980C0] text-[13px] font-semibold text-white hover:bg-[#1565A3]"
                >
                    Simpan
                </Button>
            </DialogFooter>
        </>
    );
}
