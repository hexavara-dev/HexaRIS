import { ArrowRight, History } from 'lucide-react';
import { toast } from 'sonner';

export function AssetHistoryCard() {
    return (
        <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-[#E2E8F0] p-[18px]">
            <div className="flex w-full items-center justify-between">
                <div className="flex w-fit flex-col items-start gap-1">
                    <p className="font-poppins w-fit text-xs font-medium text-[#4F4F4F]">Riwayat Pinjam & Pengembalian</p>
                    <button
                        type="button"
                        onClick={() => toast('Segera hadir')}
                        className="font-poppins flex items-center gap-1 text-sm font-semibold text-[#1980C0] hover:underline"
                    >
                        Lihat
                        <ArrowRight className="size-3.5" />
                    </button>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(25,128,192,0.10)' }}>
                    <History className="size-5 shrink-0 text-[#1980C0]" />
                </div>
            </div>
        </div>
    );
}
