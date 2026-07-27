import type { ReactNode } from 'react';

import { Toaster } from '@/components/toaster';
import { useFlash } from '@/hooks/use-flash';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
}

export default function AppLayout({ children, breadcrumbs, headerActions, ...props }: AppLayoutProps) {
    useFlash();
    return (
        <>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} headerActions={headerActions} {...props}>
                {children}
            </AppLayoutTemplate>
            <Toaster />
        </>
    );
}
