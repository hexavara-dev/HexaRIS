import { KpiStatCard } from '@/components/design-system/card/kpi-stat';
import { ArrowRight, History } from 'lucide-react';
import { toast } from 'sonner';

export function AssetHistoryCard() {
    return (
        <KpiStatCard
            label="Riwayat Pinjam & Pengembalian"
            iconBackground="rgba(25,128,192,0.10)"
            icon={<History className="size-5 shrink-0 text-[#1980C0]" />}
        >
            <button
                type="button"
                onClick={() => toast('Segera hadir')}
                className="font-poppins flex items-center gap-1 text-sm font-semibold text-[#1980C0] hover:underline"
            >
                Lihat
                <ArrowRight className="size-3.5" />
            </button>
        </KpiStatCard>
    );
}
