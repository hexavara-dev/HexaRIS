import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    actions?: ReactNode;
    title?: string;
}

export function AppSidebarHeader({ breadcrumbs = [], actions, title }: AppSidebarHeaderProps) {
    return (
        <header className="border-sidebar-border/50 bg-background flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 md:hidden" />
                {title ? <h1 className="font-poppins text-lg font-semibold text-[#0F172A]">{title}</h1> : <Breadcrumbs breadcrumbs={breadcrumbs} />}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>
    );
}
