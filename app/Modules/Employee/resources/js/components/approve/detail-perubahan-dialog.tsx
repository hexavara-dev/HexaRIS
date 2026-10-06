import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { PengajuanPerubahan } from '../../pages/Data/pengajuan-dummy';
import { PerubahanCard } from './perubahan-card';

interface DetailPerubahanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pengajuan: PengajuanPerubahan | null;
}

/**
 * "Detail Perubahan Data" — read-only review of one pengajuan. The decision
 * itself is taken from the queue row, never from inside this dialog.
 */
export function DetailPerubahanDialog({ open, onOpenChange, pengajuan }: DetailPerubahanDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl gap-0 rounded-2xl">
                <DialogHeader className="mb-4 pr-8 text-left">
                    <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Detail Perubahan Data</DialogTitle>
                </DialogHeader>

                {pengajuan && <PerubahanCard pengajuan={pengajuan} />}
            </DialogContent>
        </Dialog>
    );
}
