import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
    const { appearance } = useAppearance();
    return (
        <Sonner
            theme={appearance}
            position="top-right"
            closeButton
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'flex items-center gap-4 w-full rounded-2xl border p-4 font-poppins bg-white',
                    title: 'text-base font-semibold text-black',
                    closeButton: 'border-none bg-transparent text-[#4F4F4F] hover:bg-transparent left-auto right-2',
                    success: 'border-[#46B52B] bg-[#F4FFE9] [&_[data-icon]]:text-[#46B52B]',
                    error: 'border-[#E84A39] bg-[#FFE8E5] [&_[data-icon]]:text-[#E84A39]',
                },
            }}
        />
    );
}
