import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { PengajuanPerubahan } from '../../pages/Data/pengajuan-dummy';
import { PerubahanCard } from './perubahan-card';

interface DetailPerubahanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pengajuan: PengajuanPerubahan | null;
}

export function DetailPerubahanDialog({ open, onOpenChange, pengajuan }: DetailPerubahanDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="
                    flex max-h-[90vh] w-[calc(100%-2rem)]
                    max-w-[720px] flex-col gap-0
                    overflow-hidden rounded-[24px]
                    border border-[#E7E7E7] bg-white
                    p-0 shadow-xl sm:max-w-[720px]
                    [&>button]:right-5
                    [&>button]:top-5
                    [&>button]:text-[#374151]
                    [&>button]:focus:outline-none
                    [&>button]:focus:ring-0
                    [&>button]:focus:ring-offset-0
                "
            >
                <DialogHeader className="shrink-0 border-b border-[#E7E7E7]
                        px-6 py-5 text-left">
                    <DialogTitle className="font-poppins pr-8 text-xl font-semibold text-[#121212]">
                        Detail Perubahan Data
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                    {pengajuan && (
                        <PerubahanCard pengajuan={pengajuan} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
