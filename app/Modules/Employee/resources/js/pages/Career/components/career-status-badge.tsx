import { cn } from '@/lib/utils';
import { type CareerStatus } from '../types';

const statusStyles: Record<CareerStatus, string> = {
    Menunggu: 'border-[#E9D46E] bg-[#FFFBE7] text-[#8A6D00]',
    Ditolak: 'border-[#F48A8A] bg-[#FFF2F2] text-[#B42318]',
    Approved: 'border-[#74C983] bg-[#F1FFF3] text-[#146C2E]',
};

export function CareerStatusBadge({ status }: { status: CareerStatus }) {
    return <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', statusStyles[status])}>{status}</span>;
}
