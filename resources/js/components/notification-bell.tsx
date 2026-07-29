import { Bell } from 'lucide-react';

interface NotificationBellProps {
    count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
    return (
        <button
            type="button"
            className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#0F172A]"
            aria-label={count > 0 ? `${count} notifikasi belum dibaca` : 'Notifikasi'}
        >
            <Bell className="size-[18px]" />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
}
