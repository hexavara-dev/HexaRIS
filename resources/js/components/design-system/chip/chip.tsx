import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type ChipVariant = 'success' | 'warning' | 'danger' | 'info' | 'menu';

interface ChipProps {
    variant?: ChipVariant;
    children: ReactNode;
    className?: string;
}

const chipVariantClassName: Record<ChipVariant, string> = {
    success: 'rounded-[32px] border-[#46B52B] bg-[#F7FBFE] text-[#46B52B] px-2 py-0.5 text-xs',
    warning: 'rounded-[32px] border-[#D97706] bg-[#FFFBEB] text-[#D97706] px-2 py-0.5 text-xs',
    danger: 'rounded-[32px] border-[#E84A39] bg-[#FEF2F1] text-[#E84A39] px-2 py-0.5 text-xs',
    info: 'rounded-[32px] border-[#1980C0] bg-[#EEF8FF] text-[#1980C0] px-2 py-0.5 text-xs',
    menu: 'rounded-lg border-[#00B4BF] text-[#1980C0] px-4 py-2 text-sm font-medium',
};

export function Chip({ variant = 'success', children, className }: ChipProps) {
    return (
        <span className={cn('font-poppins inline-flex w-fit items-center gap-2.5 border', chipVariantClassName[variant], className)}>{children}</span>
    );
}
