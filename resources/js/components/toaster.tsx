import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
    const { appearance } = useAppearance();
    return (
        <Sonner
            theme={appearance}
            position="top-right"
            offset={{ top: 12, right: 20 }}
            closeButton
            style={{ '--width': '43rem' } as React.CSSProperties}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'relative flex w-[var(--width)] items-start gap-2.5 rounded-xl border bg-popover p-3 pr-9 font-poppins text-popover-foreground shadow-lg',
                    content: 'flex flex-col gap-0.5',
                    title: 'text-sm font-semibold leading-tight',
                    description: 'text-xs leading-snug text-muted-foreground',
                    closeButton:
                        'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-none bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                    success:
                        'border-[#46B52B]/50 bg-[#F4FFE9] text-[#1A7431] dark:border-[#46B52B]/40 dark:bg-[#12331A] dark:text-[#8FE0A6] [&_[data-icon]]:text-[#46B52B]',
                    error: 'border-destructive/50 bg-destructive/10 text-destructive [&_[data-icon]]:text-destructive',
                },
            }}
        />
    );
}
