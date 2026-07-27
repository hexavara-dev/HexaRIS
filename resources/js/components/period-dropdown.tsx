import { ChevronDown } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PeriodDropdownProps {
    periods: string[];
    value: string;
    onValueChange: (period: string) => void;
}

export function PeriodDropdown({ periods, value, onValueChange }: PeriodDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] font-semibold text-[#0F172A] outline-none">
                {value}
                <ChevronDown className="size-3.5 text-[#475569]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {periods.map((period) => (
                    <DropdownMenuItem key={period} onSelect={() => onValueChange(period)}>
                        {period}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
