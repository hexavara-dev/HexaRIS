import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-10 text-center">
            {Icon && <Icon className="text-muted-foreground size-8" />}
            <h3 className="font-medium">{title}</h3>
            {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
