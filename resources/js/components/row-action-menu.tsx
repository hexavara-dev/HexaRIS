import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';

export interface RowAction {
    label: string;
    href?: string;
    onClick?: () => void;
    destructive?: boolean;
}

export function RowActionMenu({ actions }: { actions: RowAction[] }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {actions.map((action) => (
                    <DropdownMenuItem
                        key={action.label}
                        asChild={Boolean(action.href)}
                        onClick={action.onClick}
                        className={action.destructive ? 'text-destructive' : ''}
                    >
                        {action.href ? <Link href={action.href}>{action.label}</Link> : <span>{action.label}</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
