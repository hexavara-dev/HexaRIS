import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface TabItem {
    value: string;
    label: string;
}

interface TabsProps {
    tabs: TabItem[];
    value: string;
    onValueChange: (value: string) => void;
}

export function Tabs({ tabs, value, onValueChange }: TabsProps) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(next) => next && onValueChange(next)}
            className="w-full items-stretch justify-start gap-0 rounded-lg border border-[#E7E7E7]"
        >
            {tabs.map((tab) => (
                <ToggleGroupItem
                    key={tab.value}
                    value={tab.value}
                    className="font-poppins h-auto flex-1 rounded-lg border-l-4 border-l-transparent bg-transparent px-4 py-3 text-sm font-semibold tracking-[0.01em] text-[#5C5C5C] data-[state=on]:border-l-[#1980C0] data-[state=on]:bg-[#E9F2F9] data-[state=on]:text-[#1980C0]"
                >
                    {tab.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
