import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ImageIcon, LogIn, LogOut } from 'lucide-react';

export interface AttendanceDetailRow {
    label: string;
    value: ReactNode;
}

export type AttendanceStatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple';

export interface AttendanceEvidence {
    time: string;
    photo?: string;
}

export interface AttendanceSummary {
    totalHours: string;
    location: string;
    note: string;
}

interface DialogAttendanceDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    status: { label: string; variant: AttendanceStatusVariant };
    details: AttendanceDetailRow[];
    checkIn?: AttendanceEvidence;
    checkOut?: AttendanceEvidence;
    summary?: AttendanceSummary;
}

const statusVariantClassName: Record<AttendanceStatusVariant, string> = {
    success: 'border-[#46B52B] bg-[#F7FBFE] text-[#46B52B]',
    warning: 'border-[#D97706] bg-[#FFFBEB] text-[#D97706]',
    danger: 'border-[#E84A39] bg-[#FEF2F1] text-[#E84A39]',
    info: 'border-[#8FCBF3] bg-[#F1F9FF] text-[#2E8FD8]',
    purple: 'border-[#C8B2F3] bg-[#FAF7FF] text-[#7B4FD1]',
};

function EvidenceCard({ label, icon: Icon, evidence }: { label: string; icon: typeof LogIn; evidence: AttendanceEvidence }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6EEFA] bg-[#F5F9FD] p-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-[#E8F3FB]">
                        <Icon className="size-3 text-[#1980C0]" />
                    </span>
                    <p className="font-poppins text-xs text-[#374151]">{label}</p>
                </div>
                <p className="font-poppins text-base font-semibold text-[#111827]">{evidence.time}</p>
            </div>
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F3F4F6] text-[#9CA3AF]">
                {evidence.photo ? <img src={evidence.photo} alt={label} className="size-full object-cover" /> : <ImageIcon className="size-5" />}
            </div>
        </div>
    );
}

export function DialogAttendanceDetail({
    open,
    onOpenChange,
    title = 'Detail Absensi',
    status,
    details,
    checkIn,
    checkOut,
    summary,
}: DialogAttendanceDetailProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)] sm:max-w-xl">
                <DialogHeader className="border-b border-b-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
                    <span
                        className={cn(
                            'font-poppins inline-flex w-fit items-start gap-2.5 rounded-[32px] border px-2 py-0.5 text-xs',
                            statusVariantClassName[status.variant],
                        )}
                    >
                        {status.label}
                    </span>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {details.map((row) => (
                            <div key={row.label} className="flex min-w-0 flex-col gap-1">
                                <p className="font-poppins text-xs text-[#6B7280]">{row.label}</p>
                                <div className="font-poppins truncate text-sm text-[#111827]">{row.value}</div>
                            </div>
                        ))}
                    </div>

                    {(checkIn || checkOut) && (
                        <>
                            <div className="border-t border-[#E7E7E7]" />
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-1 rounded-full bg-[#1980C0]" />
                                    <p className="font-poppins text-sm font-semibold text-[#111827]">Bukti Absensi</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {checkIn && <EvidenceCard label="Check-in" icon={LogIn} evidence={checkIn} />}
                                    {checkOut && <EvidenceCard label="Check-out" icon={LogOut} evidence={checkOut} />}
                                </div>
                            </div>
                        </>
                    )}

                    {summary && (
                        <div className="grid grid-cols-3 divide-x divide-[#E6EEFA] rounded-2xl border border-[#E6EEFA] bg-[#F5F9FD] p-4">
                            <div className="flex flex-col gap-1 pr-3">
                                <p className="font-poppins text-xs text-[#6B7280]">Total Jam</p>
                                <p className="font-poppins text-sm font-semibold text-[#111827]">{summary.totalHours}</p>
                            </div>
                            <div className="flex flex-col gap-1 px-3">
                                <p className="font-poppins text-xs text-[#6B7280]">Lokasi</p>
                                <p className="font-poppins truncate text-sm font-semibold text-[#111827]">{summary.location}</p>
                            </div>
                            <div className="flex flex-col gap-1 pl-3">
                                <p className="font-poppins text-xs text-[#6B7280]">Catatan</p>
                                <p className="font-poppins text-sm font-semibold text-[#111827]">{summary.note}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
