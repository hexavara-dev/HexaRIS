import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList } from 'lucide-react';

export function AttendanceIssueBanner({ count }: { count: number }) {
    return (
        <Link
            href="/attendance/report"
            className="font-poppins flex items-center gap-3 border-b border-[#F2F2F3] bg-[#FAFBFD] px-4 py-5 transition-colors hover:bg-[#F2F4F7] sm:px-6"
        >
            <ClipboardList className="size-4 shrink-0 text-[#1980C0]" />
            <p className="min-w-0 flex-1 text-xs leading-4 text-[#374151]">
                Ada <span className="font-semibold text-[#111827]">{count} laporan masalah</span> terkait absensi. Silakan{' '}
                <span className="font-semibold text-[#111827]">Check</span> dan tindak lanjuti
            </p>
            <ArrowRight className="size-4 shrink-0 text-[#111827]" />
        </Link>
    );
}
