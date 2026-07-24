import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface FilterOption {
    label: string;
    value: string;
}

export type FilterGroup =
    | { key: string; label: string; type: 'select'; options: FilterOption[] }
    | { key: string; label: string; type: 'chip-single'; options: FilterOption[] }
    | { key: string; label: string; type: 'chip-multiple'; options: FilterOption[] };

export type FilterValues = Record<string, string | string[] | undefined>;

interface FilterPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    groups: FilterGroup[];
    values: FilterValues;
    onValueChange: (key: string, value: string | string[] | undefined) => void;
    onApply: () => void;
    applyLabel?: string;
}

const chipClassName =
    'rounded-2xl border border-[#ACACAC] bg-white px-4 py-4 font-poppins text-sm text-[#ACACAC] data-[state=on]:border-[#1980C0] data-[state=on]:bg-[#EEF8FF] data-[state=on]:text-[#006C73]';

export function FilterPanel({
    open,
    onOpenChange,
    title = 'Filter',
    groups,
    values,
    onValueChange,
    onApply,
    applyLabel = 'Terapkan Filter',
}: FilterPanelProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[400px]">
                <div className="flex items-center justify-between rounded-t-[14px] border-b border-b-[#DCDCDC] px-5 py-[18px] shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                    <p className="font-poppins text-base font-semibold tracking-[0.01em] text-[#121212]">{title}</p>
                    <button type="button" onClick={() => onOpenChange(false)} aria-label="Close">
                        <X className="h-[18px] w-[18px]" />
                    </button>
                </div>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pt-[18px] pb-10">
                    {groups.map((group) => (
                        <div key={group.key} className="flex flex-col gap-2">
                            <p className="font-poppins text-sm font-semibold tracking-[0.01em] text-[#121212]">{group.label}</p>

                            {group.type === 'select' && (
                                <Select value={(values[group.key] as string) ?? undefined} onValueChange={(value) => onValueChange(group.key, value)}>
                                    <SelectTrigger className="font-poppins h-auto rounded-2xl border-[#ACACAC] px-4 py-4 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {group.options.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {group.type === 'chip-single' && (
                                <ToggleGroup
                                    type="single"
                                    className="flex-wrap justify-start gap-2"
                                    value={(values[group.key] as string) ?? ''}
                                    onValueChange={(value) => onValueChange(group.key, value || undefined)}
                                >
                                    {group.options.map((option) => (
                                        <ToggleGroupItem key={option.value} value={option.value} className={chipClassName}>
                                            {option.label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            )}

                            {group.type === 'chip-multiple' && (
                                <ToggleGroup
                                    type="multiple"
                                    className="flex-wrap justify-start gap-2"
                                    value={(values[group.key] as string[]) ?? []}
                                    onValueChange={(value) => onValueChange(group.key, value)}
                                >
                                    {group.options.map((option) => (
                                        <ToggleGroupItem key={option.value} value={option.value} className={chipClassName}>
                                            {option.label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            )}
                        </div>
                    ))}
                </div>

                <div className="rounded-[14px] border border-[#E7E7E7] bg-white px-5 py-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.06),1px_7px_14px_-2px_rgba(0,0,0,0.12)]">
                    <Button className="w-full" onClick={onApply}>
                        {applyLabel}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
