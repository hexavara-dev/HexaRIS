import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PeriodDropdownProps {
    periods: string[];
    defaultPeriod: string;
}

export function PeriodDropdown({ periods, defaultPeriod }: PeriodDropdownProps) {
    const [selected, setSelected] = useState(defaultPeriod);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] font-semibold text-[#0F172A] outline-none">
                {selected}
                <ChevronDown className="size-3.5 text-[#475569]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {periods.map((period) => (
                    <DropdownMenuItem key={period} onSelect={() => setSelected(period)}>
                        {period}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
