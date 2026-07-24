import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRef } from 'react';

export function SearchInput({
    defaultValue = '',
    onSearch,
    placeholder = 'Search…',
}: {
    defaultValue?: string;
    onSearch: (value: string) => void;
    placeholder?: string;
}) {
    const timer = useRef<number | undefined>(undefined);

    return (
        <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="h-9 pl-8"
                onChange={(e) => {
                    const value = e.target.value;
                    window.clearTimeout(timer.current);
                    timer.current = window.setTimeout(() => onSearch(value), 300);
                }}
            />
        </div>
    );
}
