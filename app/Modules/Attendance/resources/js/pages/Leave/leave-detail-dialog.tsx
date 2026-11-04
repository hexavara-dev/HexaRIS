import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { type LeaveRequest } from './leave-data';

type Decision = 'reject' | 'accept';

const decisionOptions: { value: Decision; label: string }[] = [
    { value: 'reject', label: 'Tolak Pengajuan' },
    { value: 'accept', label: 'Terima Pengajuan' },
];

function initialsOf(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[96px_1fr] gap-3 text-sm">
            <span className="text-[#6B7280]">{label}</span>
            <span className="text-[#111827]">{value}</span>
        </div>
    );
}

export function LeaveDetailDialog({
    request,
    onOpenChange,
    onSave,
}: {
    request: LeaveRequest | null;
    onOpenChange: (open: boolean) => void;
    onSave: (decision: Decision) => void;
}) {
    const [decision, setDecision] = useState<Decision | null>(null);
    const [reason, setReason] = useState('');

    const canSave = decision === 'accept' || (decision === 'reject' && reason.trim() !== '');

    return (
        <Dialog open={request !== null} onOpenChange={onOpenChange}>
            <DialogContent className="font-poppins gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)] sm:max-w-xl">
                {request && (
                    <>
                        <DialogHeader className="border-b border-[#E7E7E7] px-6 py-4 text-left">
                            <DialogTitle className="text-base font-semibold text-[#111827]">Detail</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-5 px-6 py-5">
                            <div className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-10">
                                        <AvatarFallback className="bg-[#E8F3FB] text-xs font-semibold text-[#1980C0]">{initialsOf(request.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold text-[#111827]">{request.name}</p>
                                        <p className="text-xs text-[#6B7280]">{`${request.organization} - ${request.branch}`}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[#6B7280]">Tgl Pengajuan</p>
                                    <p className="text-xs font-semibold text-[#111827]">{request.requestedAt}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <DetailRow label="Pengajuan" value={request.type} />
                                <DetailRow label="Periode" value={`${request.period} (${request.days} Hari)`} />
                                <DetailRow label="Keterangan" value={request.reason} />
                                <DetailRow label="Status" value={request.status === 'Menunggu' ? 'Sedang Menunggu' : request.status} />
                            </div>


                            <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] p-3">
                                <span className="grid size-10 place-items-center rounded-lg bg-[#FEF2F1]">
                                    <FileText className="size-5 text-[#E84A39]" />
                                </span>
                                <div>
                                    <p className="text-sm text-[#111827]">Surat Izin.pdf</p>
                                    <p className="text-xs text-[#6B7280]">0.8 Mb</p>
                                </div>
                            </div>

                            <RadioGroup value={decision ?? ''} onValueChange={(value) => setDecision(value as Decision)} className="grid grid-cols-2 gap-3">
                                {decisionOptions.map((option) => {
                                    const selected = decision === option.value;
                                    return (
                                        <Label
                                            key={option.value}
                                            htmlFor={`decision-${option.value}`}
                                            className={cn(
                                                'flex cursor-pointer flex-row-reverse justify-start gap-3 rounded-xl border px-4 py-3 text-sm font-normal',
                                                selected ? 'border-[#1980C0] bg-[#F0F7FC] text-[#1980C0]' : 'border-[#E5E7EB] text-[#374151]',
                                            )}
                                        >
                                            {option.label}
                                            <RadioGroupItem id={`decision-${option.value}`} value={option.value} />
                                        </Label>
                                    );
                                })}
                            </RadioGroup>

                            {decision === 'reject' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="reject-reason" className="text-sm font-normal text-[#374151]">
                                        Alasan Tolak Pengajuan <span className="text-[#E84A39]">*</span>
                                    </Label>
                                    <Textarea
                                        id="reject-reason"
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                        placeholder="Masukkan Alasan Tolak Pengajuan"
                                        className="min-h-24 resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-6">
                            <Button
                                className="h-11 w-full bg-[#1980C0] text-sm text-white hover:bg-[#1570AA]"
                                disabled={!canSave}
                                onClick={() => decision && onSave(decision)}
                            >
                                Simpan
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
