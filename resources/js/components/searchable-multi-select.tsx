import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useState } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    options: SelectOption[];
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    emptyMessage?: string;
}

export function SearchableMultiSelect({ options, value, onChange, placeholder = 'Search…', emptyMessage = 'No results' }: Props) {
    const [query, setQuery] = useState('');
    const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;

    const toggle = (val: string) => {
        const set = new Set(value);
        if (set.has(val)) set.delete(val);
        else set.add(val);
        onChange([...set]);
    };

    return (
        <div className="overflow-hidden rounded-md border">
            <div className="relative border-b">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="h-9 rounded-none border-0 pl-8 shadow-none focus-visible:ring-0"
                />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-4 text-center text-sm">{emptyMessage}</p>
                ) : (
                    filtered.map((o) => (
                        <label
                            key={o.value}
                            className={cn(
                                'hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm',
                                value.includes(o.value) && 'bg-accent/60',
                            )}
                        >
                            <Checkbox checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
                            <span className="truncate">{o.label}</span>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
}
