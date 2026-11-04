import { cn } from '@/lib/utils';
import { type AttendanceStatus } from './types';

const statusStyles: Record<AttendanceStatus, string> = {
    'On Time': 'border-[#7EDCC4] bg-[#F3FDFA] text-[#0F9F87]',
    Terlambat: 'border-[#F5CF86] bg-[#FFFBF2] text-[#B97C0A]',
    Cuti: 'border-[#A8D7F9] bg-[#F5FAFF] text-[#2E8FD8]',
    Izin: 'border-[#C8B2F3] bg-[#FAF7FF] text-[#7B4FD1]',
    Alpha: 'border-[#F6A9A9] bg-[#FFF7F7] text-[#D14343]',
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
    return (
        <span
            className={cn(
                'font-poppins inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
                statusStyles[status],
            )}
        >
            {status}
        </span>
    );
}
