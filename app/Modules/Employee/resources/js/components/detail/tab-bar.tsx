import { cn } from '@/lib/utils';

interface TabBarProps {
    tabs: string[];
    active: number;
    onChange: (index: number) => void;
}

/** Freely clickable tabs — not a linear stepper (this dialog has no next/back). */
export function TabBar({ tabs, active, onChange }: TabBarProps) {
    return (
        <div className="flex w-full min-w-0 gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab, index) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(index)}
                    className={cn(
                        'font-poppins flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-medium whitespace-nowrap transition-colors',
                        index === active
                            ? 'border-[#1980C0] bg-white text-[#1980C0]'
                            : 'border-[#E0E0E0] bg-white text-[#8F8F8F] hover:border-[#1980C0] hover:text-[#1980C0]',
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}