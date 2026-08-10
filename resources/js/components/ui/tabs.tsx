import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('', {
    variants: {
        variant: {
            /** Underline tabs — matches Structure.tsx's tab bar (active = #1980C0 text + underline). */
            line: 'flex items-end gap-8',
            /** Boxed/pill tabs — the shadcn default look. */
            button: 'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            /** Individually-bordered rounded pills — matches Document.tsx's tab bar. */
            pill: 'flex items-center gap-2',
        },
    },
    defaultVariants: {
        variant: 'line',
    },
});

const tabsTriggerVariants = cva('cursor-pointer outline-hidden disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            line: 'group font-poppins flex flex-col items-center gap-2 text-sm font-semibold text-[#64748B] data-[state=active]:text-[#1980C0]',
            button:
                'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs',
            pill: 'font-poppins rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium whitespace-nowrap text-[#64748B] transition-colors data-[state=active]:border-[#1980C0] data-[state=active]:text-[#1980C0]',
        },
    },
    defaultVariants: {
        variant: 'line',
    },
});

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>, VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(({ className, variant, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ variant }), className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, VariantProps<typeof tabsTriggerVariants> {}

/** `variant="line"` renders its own active-underline indicator; `variant="button"` (the shadcn default) doesn't need one. */
const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
    ({ className, variant = 'line', children, ...props }, ref) => (
        <TabsPrimitive.Trigger ref={ref} className={cn(tabsTriggerVariants({ variant }), className)} {...props}>
            {children}
            {variant === 'line' && <span className="h-0.5 w-full rounded-sm bg-transparent group-data-[state=active]:bg-[#1980C0]" />}
        </TabsPrimitive.Trigger>
    ),
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content ref={ref} className={cn('outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
