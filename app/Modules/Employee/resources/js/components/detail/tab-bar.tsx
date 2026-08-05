import { cn } from '@/lib/utils';

interface TabBarProps {
    tabs: string[];
    active: number;
    onChange: (index: number) => void;
}

/** Freely clickable pill tabs — not a linear stepper (this dialog has no next/back). */
export function TabBar({ tabs, active, onChange }: TabBarProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(index)}
                    className={cn(
                        'font-poppins cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors',
                        index === active
                            ? 'bg-[#1980C0] text-white'
                            : 'border border-[#ACACAC] bg-white text-[#121212] hover:border-[#1980C0]',
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
