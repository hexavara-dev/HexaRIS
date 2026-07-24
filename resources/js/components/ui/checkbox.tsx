import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
    ({ className, ...props }, ref) => (
        <CheckboxPrimitive.Root
            ref={ref}
            className={cn(
                'group peer size-4 shrink-0 rounded border border-[#E7E7E7] bg-white ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#117BBC] data-[state=checked]:bg-[#117BBC] data-[state=checked]:text-white data-[state=indeterminate]:border-[#117BBC]',
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
                <Check className="size-3 stroke-[3] group-data-[state=indeterminate]:hidden" />
                <span className="hidden size-2 rounded-[1px] bg-[#117BBC] group-data-[state=indeterminate]:block" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    ),
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
