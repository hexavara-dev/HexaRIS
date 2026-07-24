import { type FormEvent, type ReactNode } from 'react';

export function FormLayout({ onSubmit, footer, children }: { onSubmit: (e: FormEvent) => void; footer?: ReactNode; children: ReactNode }) {
    return (
        <form onSubmit={onSubmit} className="max-w-xl space-y-5">
            {children}
            {footer && <div className="flex items-center gap-2 pt-2">{footer}</div>}
        </form>
    );
}
