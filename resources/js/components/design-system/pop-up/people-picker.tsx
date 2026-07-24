import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface PersonOption {
    id: string;
    name: string;
    role: string;
}

interface PeoplePickerProps {
    trigger: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    people: PersonOption[];
    selected: string[];
    onSelectedChange: (selected: string[]) => void;
    search: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    doneLabel?: string;
    onDone?: () => void;
}

export function PeoplePicker({
    trigger,
    open,
    onOpenChange,
    people,
    selected,
    onSelectedChange,
    search,
    onSearchChange,
    searchPlaceholder = 'Cari',
    doneLabel = 'Selesai',
    onDone,
}: PeoplePickerProps) {
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-80 rounded-2xl p-3 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black" />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="font-poppins h-auto rounded-2xl border-[#E7E7E7] py-3 pr-4 pl-11 text-sm shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_4px_0_rgba(0,0,0,0.05)] placeholder:text-[#ACACAC]"
                    />
                </div>

                <div className="mt-1 flex flex-col">
                    {people.map((person, index) => {
                        const checked = selected.includes(person.id);
                        return (
                            <label
                                key={person.id}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2 px-2 py-2',
                                    index !== people.length - 1 && 'border-b border-b-[#E3E8EF]',
                                )}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) =>
                                        onSelectedChange(value ? [...selected, person.id] : selected.filter((id) => id !== person.id))
                                    }
                                />
                                <div className="flex flex-col items-start">
                                    <p className="font-poppins text-xs text-[#121212]">{person.name}</p>
                                    <p className="font-poppins text-[10px] text-[#4F4F4F]">{person.role}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <button type="button" className="font-poppins mt-1 text-xs font-semibold text-[#1980C0]" onClick={onDone}>
                    {doneLabel}
                </button>
            </PopoverContent>
        </Popover>
    );
}
