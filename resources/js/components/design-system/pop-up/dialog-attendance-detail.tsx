import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface AttendanceDetailRow {
    label: string;
    value: ReactNode;
}

type AttendanceStatusVariant = 'success' | 'warning' | 'danger';

interface DialogAttendanceDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    status: { label: string; variant: AttendanceStatusVariant };
    details: AttendanceDetailRow[];
}

const statusVariantClassName: Record<AttendanceStatusVariant, string> = {
    success: 'border-[#46B52B] bg-[#F7FBFE] text-[#46B52B]',
    warning: 'border-[#D97706] bg-[#FFFBEB] text-[#D97706]',
    danger: 'border-[#E84A39] bg-[#FEF2F1] text-[#E84A39]',
};

export function DialogAttendanceDetail({ open, onOpenChange, title = 'Detail Absensi', status, details }: DialogAttendanceDetailProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-start gap-5 px-5 pt-4 pb-5">
                    <span
                        className={cn(
                            'font-poppins inline-flex w-fit items-start gap-2.5 rounded-[32px] border px-2 py-0.5 text-xs',
                            statusVariantClassName[status.variant],
                        )}
                    >
                        {status.label}
                    </span>

                    <div className="flex w-full flex-col items-start gap-3">
                        {details.map((row) => (
                            <div key={row.label} className="flex w-full items-start gap-4">
                                <p className="font-poppins w-[134px] shrink-0 text-sm text-black">{row.label}</p>
                                <div className="font-poppins text-sm text-black">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
