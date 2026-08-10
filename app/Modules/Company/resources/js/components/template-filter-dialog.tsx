import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { DOCUMENT_CATEGORIES } from '../lib/document-catalog';

interface TemplateFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Currently applied category values. */
    selected: string[];
    /** Commits the selection — only fired by "Terapkan Filter", never on each toggle. */
    onApply: (categories: string[]) => void;
}

/** Multi-select category filter for the Document Center grid. */
export function TemplateFilterDialog({ open, onOpenChange, selected, onApply }: TemplateFilterDialogProps) {
    // Draft state, so toggling a chip doesn't filter the grid behind the dialog —
    // the mockup has an explicit "Terapkan Filter", meaning nothing applies until
    // it's pressed and closing without pressing it discards the changes.
    const [draft, setDraft] = useState<string[]>(selected);

    useEffect(() => {
        if (open) setDraft(selected);
    }, [open, selected]);

    function toggle(value: string) {
        setDraft((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 rounded-2xl p-0">
                <DialogTitle className="font-poppins border-b border-[#E2E8F0] p-5 text-base font-semibold text-[#121212]">Filter</DialogTitle>

                <div className="flex flex-col gap-3 p-5">
                    <p className="font-poppins text-sm font-semibold text-[#121212]">Kategori Dokumen</p>
                    <div className="flex flex-wrap gap-3">
                        {DOCUMENT_CATEGORIES.map((category) => {
                            const isOn = draft.includes(category.value);
                            return (
                                <button
                                    key={category.value}
                                    type="button"
                                    onClick={() => toggle(category.value)}
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
