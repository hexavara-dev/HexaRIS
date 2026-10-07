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
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'relative flex w-[min(92vw,28rem)] max-w-[43rem] items-center gap-2.5 rounded-2xl border bg-popover p-4 pr-9 font-poppins text-popover-foreground shadow-lg',
                    content: 'flex flex-col gap-0.5',
                    title: 'text-base font-semibold leading-tight',
                    description: 'text-xs leading-snug text-muted-foreground',
                    closeButton:
                        'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-none bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                    // Kept identical in dark mode on purpose — this success toast is meant to always
                    // read as the same light-green card (per design reference), not adapt per theme.
                    success: '!border-[#A3E87E] !bg-[#F4FFE9] !text-black [&_[data-icon]]:text-[#46B52B]',
                    // Solid fill on purpose: the previous `/10` alpha made the card read as a
                    // translucent wash over the page instead of a toast.
                    error: '!border-[#EF4938] !bg-[#FFF1F0] !text-[#D92D20] [&_[data-icon]]:text-[#D92D20]',
                },
            }}
        />
    );
}
