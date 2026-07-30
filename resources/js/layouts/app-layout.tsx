import type { ReactNode } from 'react';

import { Toaster } from '@/components/toaster';
import { useFlash } from '@/hooks/use-flash';
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
    headerActions?: ReactNode;
    /**
     * Renders as a plain heading inside the top `<header>` bar, replacing the
     * breadcrumb trail there. Manual per page (e.g. the dashboard) — not
     * derived from the registry. Distinct from `tabTitle` (the browser tab)
     * and from `<PageHeader title>` (the `<h1>` in the page body below the
     * header bar).
     */
    headerTitle?: string;
}

export default function AppLayout({ children, tabTitle, breadcrumbs, headerActions, headerTitle, ...props }: AppLayoutProps) {
    useFlash();

    const { url } = usePage();
    const derivedTabTitle = tabTitle ?? titleFor(url);

    const derivedBreadcrumbs =
        breadcrumbs ??
        breadcrumbsFor(url).map((crumb, index, all) =>
            // An explicit `tabTitle` renames the page, so the crumb standing for it follows.
            tabTitle && index === all.length - 1 ? { ...crumb, title: tabTitle } : crumb,
        );

    return (
        <>
            {derivedTabTitle && <Head title={derivedTabTitle} />}
            <AppLayoutTemplate breadcrumbs={derivedBreadcrumbs} headerActions={headerActions} headerTitle={headerTitle} {...props}>
                {children}
            </AppLayoutTemplate>
            <Toaster />
        </>
    );
}
