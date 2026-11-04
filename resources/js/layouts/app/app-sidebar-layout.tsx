import type { ReactNode } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';

interface AppSidebarLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
    headerTitle?: string;
    headerMeta?: ReactNode;
}

export default function AppSidebarLayout({ children, breadcrumbs = [], headerActions, headerTitle, headerMeta }: AppSidebarLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} actions={headerActions} title={headerTitle} meta={headerMeta} />
                {children}
            </AppContent>
        </AppShell>
    );
}
