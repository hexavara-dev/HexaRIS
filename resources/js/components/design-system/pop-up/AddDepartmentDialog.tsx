import { Plus, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, filterAvailable } from '@/lib/utils';

export const DEPARTMENT_CATALOG = [
    'Human Resource',
    'Information Technology',
    'Finance',
    'Marketing',
    'Operasional',
    'Kreatif',
    'Legal',
    'Sales',
    'General Affair',
];

export const DIVISION_CATALOG = [
    'Developer',
    'UI/UX Design',
    'QA',
    'Business Analyst',
    'Sales',
    'Marketing',
    'Social Media Specialist',
    'Content',
    'Customer Service',
    'Finance',
    'HR General',
    'Design',
];

export interface NewDepartmentDraft {
    name: string;
    hasDivisions: boolean;
    divisionNames: string[];
}

interface DepartmentBlock {
    id: string;
    departmentName: string | null;
    hasDivisions: 'ya' | 'tidak';
    divisions: { id: string; name: string }[];
}

function newId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyBlock(): DepartmentBlock {
    return { id: newId('block'), departmentName: null, hasDivisions: 'tidak', divisions: [] };
}

interface AddDepartmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingDepartmentNames: string[];
    onAdd: (departments: NewDepartmentDraft[]) => void;
}

export function AddDepartmentDialog({ open, onOpenChange, existingDepartmentNames, onAdd }: AddDepartmentDialogProps) {
    const [blocks, setBlocks] = useState<DepartmentBlock[]>([emptyBlock()]);

    function resetAndClose() {
        setBlocks([emptyBlock()]);
        onOpenChange(false);
    }

    function updateBlock(id: string, patch: Partial<DepartmentBlock>) {
        setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
    }

    function setHasDivisions(id: string, value: 'ya' | 'tidak') {
        setBlocks((current) =>
            current.map((block) =>
                block.id === id
                    ? {
                          ...block,
                          hasDivisions: value,
                          divisions: value === 'ya' && block.divisions.length === 0 ? [{ id: newId('div'), name: '' }] : block.divisions,
                      }
                    : block,
            ),
        );
    }

    function addDivisionRow(blockId: string) {
        setBlocks((current) =>
            current.map((block) => (block.id === blockId ? { ...block, divisions: [...block.divisions, { id: newId('div'), name: '' }] } : block)),
        );
    }

    function removeDivisionRow(blockId: string, divisionId: string) {
        setBlocks((current) =>
            current.map((block) =>
                block.id === blockId ? { ...block, divisions: block.divisions.filter((division) => division.id !== divisionId) } : block,
            ),
        );
    }

    function updateDivisionName(blockId: string, divisionId: string, name: string) {
        setBlocks((current) =>
            current.map((block) =>
                block.id === blockId
                    ? { ...block, divisions: block.divisions.map((division) => (division.id === divisionId ? { ...division, name } : division)) }
                    : block,
            ),
        );
    }

    function addBlock() {
        setBlocks((current) => [...current, emptyBlock()]);
    }

    function removeBlock(id: string) {
        setBlocks((current) => (current.length > 1 ? current.filter((block) => block.id !== id) : current));
    }

    const takenNames = new Set(existingDepartmentNames);
    blocks.forEach((block) => block.departmentName && takenNames.add(block.departmentName));

    const validBlocks = blocks.filter((block) => block.departmentName);

    function handleSave() {
        const drafts: NewDepartmentDraft[] = validBlocks.map((block) => ({
            name: block.departmentName as string,
            hasDivisions: block.hasDivisions === 'ya',
            divisionNames: block.divisions.map((division) => division.name.trim()).filter(Boolean),
        }));
        if (drafts.length === 0) return;
        onAdd(drafts);
        resetAndClose();
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && resetAndClose()}>
            <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <div className="flex w-full items-center border-b border-[#E2E8F0] px-6 py-5">
                    <p className="font-poppins text-lg font-bold text-[#0F172A]">Tambah Departemen</p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="flex w-full flex-col gap-5">
                        {blocks.map((block, index) => {
                            const options = filterAvailable(DEPARTMENT_CATALOG, block.departmentName ?? '', takenNames);
                            return (
                                <div key={block.id} className="flex w-full flex-col gap-4 rounded-xl border border-[#E2E8F0] p-4">
                                    {index > 0 && (
                                        <div className="flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => removeBlock(block.id)}
                                                aria-label="Hapus departemen ini"
                                                className="text-[#E84A39]"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex w-full flex-col gap-2">
                                        <Label className="font-poppins text-sm font-semibold text-black">
                                            Departemen <span className="text-[#E84A39]">*</span>
                                        </Label>
                                        <Select
                                            value={block.departmentName ?? undefined}
                                            onValueChange={(value) => updateBlock(block.id, { departmentName: value })}
                                        >
                                            <SelectTrigger className="h-11 rounded-[10px] border-[#ACACAC] focus:ring-0 focus:ring-offset-0">
                                                <SelectValue placeholder="Pilih Departemen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.map((name) => (
                                                    <SelectItem key={name} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex w-full flex-col gap-2">
                                        <Label className="font-poppins text-sm font-semibold text-black">
                                            Apakah departemen ini dibawahnya memiliki divisi?
                                        </Label>
                                        <RadioGroup
                                            value={block.hasDivisions}
                                            onValueChange={(value) => setHasDivisions(block.id, value as 'ya' | 'tidak')}
                                            className="flex w-full gap-3"
                                        >
                                            <label
                                                className={cn(
                                                    'flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm text-black',
                                                    block.hasDivisions === 'ya' ? 'border-[#1980C0]' : 'border-[#E2E8F0]',
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value="ya"
                                                    className="outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                />{' '}
                                                Ya, memiliki divisi
                                            </label>
                                            <label
                                                className={cn(
                                                    'flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm text-black',
                                                    block.hasDivisions === 'tidak' ? 'border-[#1980C0]' : 'border-[#E2E8F0]',
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value="tidak"
                                                    className="outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                />{' '}
                                                Tidak, langsung staff
                                            </label>
                                        </RadioGroup>
                                    </div>

                                    {block.hasDivisions === 'ya' && (
                                        <div className="flex w-full flex-col gap-2">
                                            <Label className="font-poppins text-sm font-semibold text-black">
                                                Nama Divisi <span className="text-[#E84A39]">*</span>
                                            </Label>
                                            {(() => {
                                                const divisionTaken = new Set(block.divisions.map((division) => division.name).filter(Boolean));
                                                return block.divisions.map((division, divisionIndex) => {
                                                    const divisionOptions = filterAvailable(DIVISION_CATALOG, division.name, divisionTaken);
                                                    const isLast = divisionIndex === block.divisions.length - 1;
                                                    return (
                                                        <div key={division.id} className="flex w-full items-center gap-2">
                                                            <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-[#ACACAC] bg-white px-4">
                                                                <Select
                                                                    value={division.name || undefined}
                                                                    onValueChange={(value) => updateDivisionName(block.id, division.id, value)}
                                                                >
                                                                    <SelectTrigger className="h-12 flex-1 rounded-none border-0 bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0">
                                                                        <SelectValue placeholder="Pilih Divisi" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {divisionOptions.map((name) => (
                                                                            <SelectItem key={name} value={name}>
                                                                                {name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDivisionRow(block.id, division.id)}
                                                                    aria-label="Hapus divisi"
                                                                    className="shrink-0 text-black"
                                                                >
                                                                    <XCircle className="size-4" />
                                                                </button>
                                                            </div>
                                                            <div className="size-12 shrink-0">
                                                                {isLast && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => addDivisionRow(block.id)}
                                                                        aria-label="Tambah divisi"
                                                                        className="flex size-12 items-center justify-center rounded-2xl border border-[#ACACAC] bg-white text-black"
                                                                    >
                                                                        <Plus className="size-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={addBlock}
                            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#1980C0] py-3 text-sm font-semibold text-[#1980C0]"
                        >
                            <Plus className="size-4" />
                            Tambah Departemen Lainnya
                        </button>
                    </div>
                </div>

                <div className="flex w-full items-center justify-end gap-3 border-t border-[#E2E8F0] px-6 py-5">
                    <Button variant="outline" className="h-auto rounded-lg px-6 py-2.5" onClick={resetAndClose}>
                        Batal
                    </Button>
                    <Button className="h-auto rounded-lg px-6 py-2.5" onClick={handleSave} disabled={validBlocks.length === 0}>
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
