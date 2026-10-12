import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { type Employee } from '@/data/Employee/employee';

import type { ResignRecord } from '../../pages/Resign/resign-dummy';
import { DetailDialog } from '../detail/detail-dialog';
import { TextField } from '../steps/wizard-fields';
import { ResignCard } from './resign-card';

export const RESIGN_STATUS_STYLES: Record<ResignRecord['status'], string> = {
    Menunggu: 'border-[#E5B800] text-[#C2A51B]',
    Ditolak: 'border-[#F5A524] text-[#D97706]',
    'Non Aktif': 'border-[#EF4938] text-[#EF4938]',
};

interface ResignDialogFrameProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children?: ReactNode;
    footer?: ReactNode;
}

/** Header/content/footer shell — mirrors the "+ Resign" popup so every resign dialog reads as one family. */
function ResignDialogFrame({ open, onOpenChange, title, description, children, footer }: ResignDialogFrameProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-3xl"
                onInteractOutside={(event) => event.preventDefault()}
                // Cegah Radix auto-focus ke input pertama (focus ring + text selection di field tanggal/textarea).
                onOpenAutoFocus={(event) => event.preventDefault()}
            >
                <DialogHeader className="border-b border-[#E5E7EB] px-6 py-4 text-left">
                    <DialogTitle className="font-poppins pr-8 text-[19px] font-semibold leading-6 text-[#121212]">{title}</DialogTitle>
                    <DialogDescription className="sr-only">{description}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-6 py-4">{children}</div>

                {footer && <div className="flex gap-3 border-t border-[#E5E7EB] px-6 py-4">{footer}</div>}
            </DialogContent>
        </Dialog>
    );
}

function BatalButton({ onClick }: { onClick: () => void }) {
    return (
        <Button
            type="button"
            variant="outline"
            onClick={onClick}
            className="h-11 flex-1 rounded-xl border border-[#1980C0] text-sm font-semibold text-[#1980C0] hover:bg-[#1980C0]/5"
        >
            Batal
        </Button>
    );
}

interface ApproveResignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: ResignRecord | null;
    onApprove: (record: ResignRecord, accDate: string) => void;
}

/**
 * "Approve Resign Karyawan" — reviews the pengajuan card and captures the
 * mandatory Tanggal ACC Resign/Cut Off before the row flips to Non Aktif.
 */
export function ApproveResignDialog({ open, onOpenChange, record, onApprove }: ApproveResignDialogProps) {
    const [accDate, setAccDate] = useState('');
    const [error, setError] = useState(false);

    // Fresh form for every record.
    useEffect(() => {
        if (open) {
            setAccDate('');
            setError(false);
        }
    }, [open]);

    const submit = () => {
        if (!record) return;

        if (!accDate) {
            setError(true);
            toast.error('Lengkapi field wajib.');
            return;
        }

        onApprove(record, accDate);
    };

    return (
        <ResignDialogFrame
            open={open}
            onOpenChange={onOpenChange}
            title="Approve Resign Karyawan"
            description="Konfirmasi persetujuan resign karyawan"
            footer={
                <>
                    <BatalButton onClick={() => onOpenChange(false)} />
                    <Button type="button" onClick={submit} className="h-11 flex-1 rounded-xl bg-[#1980C0] text-sm font-semibold hover:bg-[#1673AD]">
                        Simpan
                    </Button>
                </>
            }
        >
            {record && <ResignCard record={record} />}

            <TextField
                label="Tanggal ACC Resign/Cut Off"
                htmlFor="resign-acc-date"
                required
                type="date"
                value={accDate}
                onChange={(value) => {
                    setAccDate(value);
                    if (value) setError(false);
                }}
                error={error ? 'Wajib diisi.' : undefined}
            />
        </ResignDialogFrame>
    );
}

interface RejectResignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: ResignRecord | null;
    onReject: (record: ResignRecord, reason: string) => void;
}

/** "Tolak Pengajuan" — the same card plus the mandatory rejection reason. */
export function RejectResignDialog({ open, onOpenChange, record, onReject }: RejectResignDialogProps) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (open) {
            setReason('');
            setError(false);
        }
    }, [open]);

    const submit = () => {
        if (!record) return;

        if (!reason.trim()) {
            setError(true);
            toast.error('Lengkapi field wajib.');
            return;
        }

        onReject(record, reason.trim());
    };

    return (
        <ResignDialogFrame
            open={open}
            onOpenChange={onOpenChange}
            title="Tolak Pengajuan"
            description="Tolak pengajuan resign karyawan"
            footer={
                <>
                    <BatalButton onClick={() => onOpenChange(false)} />
                    <Button type="button" onClick={submit} className="h-11 flex-1 rounded-xl bg-[#1980C0] text-sm font-semibold hover:bg-[#1673AD]">
                        Simpan
                    </Button>
                </>
            }
        >
            {record && <ResignCard record={record} />}

            <div className="flex w-full flex-col items-start gap-1.5">
                <p className="font-poppins text-sm font-semibold text-[#121212]">
                    Alasan Tolak Pengajuan <span className="text-[#EF4938]">*</span>
                </p>

                <Textarea
                    id="resign-reject-reason"
                    value={reason}
                    onChange={(event) => {
                        setReason(event.target.value);
                        if (event.target.value.trim()) setError(false);
                    }}
                    placeholder="Masukkan Alasan Tolak Pengajuan"
                    className={`min-h-[120px] resize-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-[#1980C0] focus:ring-2 focus:ring-[#1980C0]/10 ${
                        error ? 'border-[#EF4938]' : 'border-[#D1D5DB]'
                    }`}
                />

                {error && <p className="font-poppins text-xs text-[#EF4938]">Wajib diisi.</p>}
            </div>
        </ResignDialogFrame>
    );
}

interface DetailResignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: ResignRecord | null;
    /** The employee behind the request — Detail Karyawan renders the full tabbed profile. */
    employee: Employee | null;
    /** Wired to the card's Approve button while the request is still awaiting approval. */
    onApprove: () => void;
}

/**
 * "Detail Karyawan" from the Resign list — the same tabbed profile the Data
 * page opens, topped with the pink resign card. Non Aktif means the request
 * was already approved, so the Approve button only shows while it is pending.
 */
export function DetailResignDialog({ open, onOpenChange, record, employee, onApprove }: DetailResignDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl"
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogDescription className="sr-only">Detail data karyawan {employee?.full_name}</DialogDescription>

                {employee && record && <DetailDialog employee={employee} resign={record} onApprove={onApprove} />}
            </DialogContent>
        </Dialog>
    );
}

interface DeleteResignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: ResignRecord | null;
    onDelete: (record: ResignRecord) => void;
}

/** "Hapus Resign Karyawan?" — the irreversible-delete confirmation. */
export function DeleteResignDialog({ open, onOpenChange, record, onDelete }: DeleteResignDialogProps) {
    return (
        <ResignDialogFrame
            open={open}
            onOpenChange={onOpenChange}
            title="Hapus Resign Karyawan?"
            description="Hapus pengajuan resign karyawan"
            footer={
                <>
                    <BatalButton onClick={() => onOpenChange(false)} />
                    <Button
                        type="button"
                        onClick={() => {
                            if (record) onDelete(record);
                        }}
                        className="h-11 flex-1 rounded-xl bg-[#1980C0] text-sm font-semibold hover:bg-[#1673AD]"
                    >
                        Hapus
                    </Button>
                </>
            }
        >
            <p className="text-sm leading-relaxed text-[#374151]">
                Anda akan menghapus data Pengajuan Resign Karyawan ini secara permanen. Tindakan ini tidak dapat dibatalkan dan seluruh
                informasi terkait akan hilang.
            </p>
        </ResignDialogFrame>
    );
}
