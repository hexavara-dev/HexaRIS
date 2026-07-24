import { Checkbox } from '@/components/ui/checkbox';

export function CheckboxDemo() {
    return (
        <div className="inline-flex items-center gap-4">
            <Checkbox aria-label="Unchecked" />
            <Checkbox aria-label="Checked" defaultChecked />
            <Checkbox aria-label="Indeterminate" checked="indeterminate" />
        </div>
    );
}
