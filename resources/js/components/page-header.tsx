import { type ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold">{title}</h1>
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
