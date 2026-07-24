import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function RadioDemo() {
    return (
        <RadioGroup defaultValue="selected" className="inline-flex flex-row items-center gap-4">
            <RadioGroupItem value="unselected" aria-label="Unselected" />
            <RadioGroupItem value="selected" aria-label="Selected" />
        </RadioGroup>
    );
}
