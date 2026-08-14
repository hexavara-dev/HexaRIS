import { FormField } from '@/components/form/form-field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface AssetDateFieldProps {
    label: string;
    htmlFor: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function AssetDateField({ label, htmlFor, required, value, onChange, error }: AssetDateFieldProps) {
    return (
        <FormField label={label} htmlFor={htmlFor} required={required} error={error}>
            <div className="relative">
                <Input
                    id={htmlFor}
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={cn(
                        'h-auto w-full rounded-2xl border-[#ACACAC] px-4 py-4 pr-11 font-poppins text-sm placeholder:text-[#ACACAC]',
                        error && 'border-[#EE242D]',
                    )}
                />
                <Calendar className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#4F4F4F]" />
            </div>
        </FormField>
    );
}
