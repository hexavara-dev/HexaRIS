import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

import { CATEGORY_OPTIONS } from '../../lib/asset-catalog';
import { type AssetFilterValue, type PeriodFilter } from '../../lib/asset-filter';

interface AssetFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Currently applied filter. */
    value: AssetFilterValue;
    /** Commits the draft — only fired by "Terapkan Filter", never on each toggle. */
    onApply: (value: AssetFilterValue) => void;
}

const PERIOD_OPTIONS: { value: Exclude<PeriodFilter, null>; label: string }[] = [
    { value: '7d', label: '7 Hari Terakhir' },
    { value: '30d', label: '30 Hari Terakhir' },
    { value: 'custom', label: 'Pilih Tanggal Sendiri' },
];

export function AssetFilterDialog({ open, onOpenChange, value, onApply }: AssetFilterDialogProps) {
    // Draft state, so toggling a chip or radio doesn't filter the table behind
    // the dialog — nothing applies until "Terapkan Filter" is pressed, and
    // closing without pressing it discards the changes.
    const [draft, setDraft] = useState<AssetFilterValue>(value);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);

    function toggleCategory(category: string) {
        setDraft((current) => ({
            ...current,
            categories: current.categories.includes(category)
                ? current.categories.filter((item) => item !== category)
                : [...current.categories, category],
        }));
    }

    function selectPeriod(period: Exclude<PeriodFilter, null>) {
        setDraft((current) => ({ ...current, period }));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 rounded-2xl p-0">
                <DialogTitle className="font-poppins border-b border-[#E2E8F0] p-5 text-base font-semibold text-[#121212]">Filter</DialogTitle>

                <div className="flex flex-col gap-3 p-5">
                    <p className="font-poppins text-sm font-semibold text-[#121212]">Kategori Aset</p>
                    <div className="flex flex-wrap gap-3">
                        {CATEGORY_OPTIONS.map((category) => {
                            const isOn = draft.categories.includes(category.value);
                            return (
                                <button
                                    key={category.value}
                                    type="button"
                                    onClick={() => toggleCategory(category.value)}
                                    aria-pressed={isOn}
                                    className={cn(
                                        'font-poppins cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors',
                                        isOn
                                            ? 'border-[#1980C0] bg-[#EEF8FF] text-[#1980C0]'
                                            : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1] hover:text-[#64748B]',
                                    )}
                                >
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-1 px-5 pb-5">
                    <p className="font-poppins mb-2 text-sm font-semibold text-[#121212]">Periode</p>
                    <RadioGroup
                        value={draft.period ?? ''}
                        onValueChange={(next) => selectPeriod(next as Exclude<PeriodFilter, null>)}
                        className="gap-0"
                    >
                        {PERIOD_OPTIONS.map((option, index) => (
                            <div key={option.value}>
                                {index > 0 && <div className="h-px bg-[#E2E8F0]" />}
                                {/* The whole row is one <label> wrapping the radio, so clicking anywhere in it
                                    (not just the small circle) selects the option — no manual click handler needed,
                                    which would otherwise double-fire alongside RadioGroup's own onValueChange. */}
                                <label className="flex w-full cursor-pointer items-center justify-between py-3">
                                    <span className="font-poppins text-sm text-[#121212]">{option.label}</span>
                                    <RadioGroupItem value={option.value} />
                                </label>
                            </div>
                        ))}
                    </RadioGroup>

                    {draft.period === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="filter-date-from" className="font-poppins text-xs font-semibold text-[#121212]">
                                    Dari Tgl
                                </Label>
                                <Input
                                    id="filter-date-from"
                                    type="date"
                                    value={draft.dateFrom}
                                    onChange={(event) => setDraft((current) => ({ ...current, dateFrom: event.target.value }))}
                                    className="h-auto w-full rounded-2xl border-[#ACACAC] px-4 py-3 font-poppins text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="filter-date-to" className="font-poppins text-xs font-semibold text-[#121212]">
                                    Sampai Tgl
                                </Label>
                                <Input
                                    id="filter-date-to"
                                    type="date"
                                    value={draft.dateTo}
                                    onChange={(event) => setDraft((current) => ({ ...current, dateTo: event.target.value }))}
                                    className="h-auto w-full rounded-2xl border-[#ACACAC] px-4 py-3 font-poppins text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 pt-0">
                    <Button
                        type="button"
                        onClick={() => {
                            onApply(draft);
                            onOpenChange(false);
                        }}
                        className="font-poppins h-12 w-full cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white hover:bg-[#1668a0]"
                    >
                        Terapkan Filter
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
