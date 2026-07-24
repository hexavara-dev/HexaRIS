import { Checkbox } from '@/components/ui/checkbox';

interface ConfirmCheckboxProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
}

export function ConfirmCheckbox({ checked, onCheckedChange, label }: ConfirmCheckboxProps) {
    return (
        <label className="inline-flex w-full cursor-pointer items-center gap-2 rounded-2xl bg-[#F5F5F5] px-4 py-3">
            <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
            <p className="font-poppins text-xs text-[#121212]">{label}</p>
        </label>
    );
}
