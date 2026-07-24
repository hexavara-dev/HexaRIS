import { Switch } from '@/components/ui/switch';

export function SwitchDemo() {
    return (
        <div className="inline-flex items-center gap-4">
            <Switch aria-label="On" defaultChecked />
            <Switch aria-label="Off" />
        </div>
    );
}
