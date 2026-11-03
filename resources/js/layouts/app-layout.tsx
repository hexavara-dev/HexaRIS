import type { ReactNode } from 'react';

import { FloatingAssistantButton } from '@/components/floating-assistant-button';
import { NotificationBell } from '@/components/notification-bell';
import { Toaster } from '@/components/toaster';
import { useFlash } from '@/hooks/use-flash';
import { usePendingToast } from '@/hooks/use-pending-toast';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { breadcrumbsFor, titleFor } from '@/lib/navigation';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    /**
     * Overrides the `<title>` tag (the browser tab) and the last breadcrumb
     * crumb. Rarely needed — both are derived from the current URL via the
     * navigation registry (`resources/js/lib/navigation.ts`). Unrelated to
     * `headerTitle` below and to `<PageHeader title>`, which is the visible
     * `<h1>` inside the page body — all three are independent and may read
     * differently on purpose (e.g. a short tab title vs. a longer on-page
     * heading).
     */
    tabTitle?: string;
    /** Overrides the derived breadcrumb trail entirely. Pass `[]` to hide it. */
    breadcrumbs?: BreadcrumbItem[];
    /**
     * Extra controls for the top header bar. Rendered before the notification
     * bell, which the layout itself puts on every page so the header stays
     * identical everywhere.
     */
    headerActions?: ReactNode;
    /**
     * Secondary text after the header title/breadcrumbs (e.g. today's date).
     * Rendered in normal weight so it reads as a subtitle, not as part of the
     * bold page title.
     */
    headerMeta?: ReactNode;
    /**
     * Renders as a plain heading inside the top `<header>` bar, replacing the
     * breadcrumb trail there. Manual per page (e.g. the dashboard) — not
     * derived from the registry. Distinct from `tabTitle` (the browser tab)
     * and from `<PageHeader title>` (the `<h1>` in the page body below the
     * header bar).
     */
    headerTitle?: string;
}

/** Placeholder until unread notifications are backed by real data. */
const UNREAD_NOTIFICATIONS = 5;

export default function AppLayout({ children, tabTitle, breadcrumbs, headerActions, headerTitle, headerMeta, ...props }: AppLayoutProps) {
    useFlash();
    usePendingToast();

    const { url } = usePage();
    const derivedTabTitle = tabTitle ?? titleFor(url);

    const derivedBreadcrumbs =
        breadcrumbs ??
        breadcrumbsFor(url).map((crumb, index, all) =>
            // An explicit `tabTitle` renames the page, so the crumb standing for it follows.
            tabTitle && index === all.length - 1 ? { ...crumb, title: tabTitle } : crumb,
        );

    // The bell belongs to the shell, not to individual pages: rendering it here
    // keeps the header identical everywhere. `headerActions` only adds to it.
    const resolvedHeaderActions = (
        <>
            {headerActions}
            <NotificationBell count={UNREAD_NOTIFICATIONS} />
        </>
    );

    return (
        <>
            {derivedTabTitle && <Head title={derivedTabTitle} />}
            <AppLayoutTemplate
                breadcrumbs={derivedBreadcrumbs}
                headerActions={resolvedHeaderActions}
                headerTitle={headerTitle}
                headerMeta={headerMeta}
                {...props}
            >
                {children}
            </AppLayoutTemplate>
            {/* Rendered by the layout, not per page, so the assistant follows the user everywhere. */}
            <FloatingAssistantButton />
            <Toaster />
        </>
    );
}
