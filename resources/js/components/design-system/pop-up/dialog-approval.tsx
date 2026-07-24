import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface ApprovalDetailRow {
    label: string;
    value: ReactNode;
}

type ApprovalDecision = 'reject' | 'accept';

interface DialogApprovalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    details: ApprovalDetailRow[];
    decision?: ApprovalDecision;
    onDecisionChange: (decision: ApprovalDecision) => void;
    rejectLabel?: string;
    acceptLabel?: string;
    saveLabel?: string;
    onSave: () => void;
}

export function DialogApproval({
    open,
    onOpenChange,
    title = 'Approve',
    details,
    decision,
    onDecisionChange,
    rejectLabel = 'Tolak Pengajuan',
    acceptLabel = 'Terima Pengajuan',
    saveLabel = 'Simpan',
    onSave,
}: DialogApprovalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
                    <div className="flex flex-col gap-3">
                        {details.map((row) => (
                            <div key={row.label} className="flex items-start gap-4">
                                <p className="font-poppins w-[134px] shrink-0 text-sm text-black">{row.label}</p>
                                <p className="font-poppins text-sm text-black">{row.value}</p>
                            </div>
                        ))}
                    </div>

                    <ToggleGroup
                        type="single"
                        className="items-stretch gap-3"
                        value={decision ?? ''}
                        onValueChange={(value) => value && onDecisionChange(value as ApprovalDecision)}
                    >
                        <ToggleGroupItem
                            value="reject"
                            className="font-poppins h-auto w-full justify-start gap-2.5 rounded-lg border border-[#1980C0] bg-transparent p-4 text-xs text-[#1980C0] data-[state=on]:bg-transparent"
                        >
                            <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[#1980C0]" />
                            {rejectLabel}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="accept"
                            className="font-poppins h-auto w-full justify-start gap-2.5 rounded-lg border border-[#1980C0] bg-transparent p-4 text-xs text-[#1980C0] data-[state=on]:bg-[#EEF8FF]"
                        >
                            <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[#1980C0]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1980C0]" />
                            </span>
                            {acceptLabel}
                        </ToggleGroupItem>
                    </ToggleGroup>

                    <Separator className="bg-[#E7E7E7]" />

                    <Button className="h-[52px] w-full" onClick={onSave}>
                        {saveLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
