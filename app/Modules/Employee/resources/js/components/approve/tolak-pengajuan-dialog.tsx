import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import type { PengajuanPerubahan } from '../../pages/Data/pengajuan-dummy';
import { PerubahanCard } from './perubahan-card';

interface TolakPengajuanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pengajuan: PengajuanPerubahan | null;
    onReject: (pengajuan: PengajuanPerubahan, reason: string) => void;
}

/**
 * "Tolak Pengajuan" — the same card as the Detail dialog plus the mandatory
 * rejection reason; Simpan only submits once the reason is filled in.
 */
export function TolakPengajuanDialog({ open, onOpenChange, pengajuan, onReject }: TolakPengajuanDialogProps) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState(false);

    // Fresh form for every pengajuan.
    useEffect(() => {
        if (open) {
            setReason('');
            setError(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl gap-0 rounded-2xl">
                <DialogHeader className="mb-4 pr-8 text-left">
                    <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Tolak Pengajuan</DialogTitle>
                </DialogHeader>

                {pengajuan && <PerubahanCard pengajuan={pengajuan} />}

                <div className="mt-5 flex flex-col gap-2">
                    <label htmlFor="alasan-tolak" className="text-sm font-medium text-[#121212]">
                        Alasan Tolak Pengajuan <span className="text-[#EF4938]">*</span>
                    </label>
                    <Textarea
                        id="alasan-tolak"
                        value={reason}
                        onChange={(event) => {
                            setReason(event.target.value);
                            if (event.target.value.trim()) setError(false);
                        }}
                        placeholder="Masukkan Alasan Tolak Pengajuan"
                        className="min-h-40 resize-none rounded-xl border-[#D1D5DB] px-4 py-3 text-sm focus-visible:border-[#1980C0] focus-visible:ring-[#1980C0]/10"
                    />
                    {error && <p className="text-sm text-[#EF4938]">Alasan tolak wajib diisi.</p>}
                </div>

                <div className="mt-5 flex items-center gap-4 border-t border-[#E7E7E7] pt-5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-xl border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            if (!pengajuan) return;
                            if (!reason.trim()) {
                                setError(true);
                                return;
                            }
                            onReject(pengajuan, reason.trim());
                        }}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-xl bg-[#1980C0] text-base font-semibold hover:bg-[#1668a0]"
                    >
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
