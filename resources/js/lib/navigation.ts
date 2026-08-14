import navAssetManagement from '@/assets/icons/nav-asset-management.png';
import navAttendance from '@/assets/icons/nav-attendance.png';
import navCalendar from '@/assets/icons/nav-calendar.png';
import navCheckIn from '@/assets/icons/nav-check-in.png';
import navCompany from '@/assets/icons/nav-company.png';
import navDashboard from '@/assets/icons/nav-dashboard.png';
import navDocumentCenter from '@/assets/icons/nav-document-center.png';
import navEmployees from '@/assets/icons/nav-employees.png';
import navMasterData from '@/assets/icons/nav-master-data.png';
import navOrgStructure from '@/assets/icons/nav-org-structure.png';
import navPayrollData from '@/assets/icons/nav-payroll-data.png';
import navPayrollSettings from '@/assets/icons/nav-payroll-settings.png';
import navPayroll from '@/assets/icons/nav-payroll.png';
import navPerformance from '@/assets/icons/nav-performance.png';
import navReimburse from '@/assets/icons/nav-reimburse.png';
import navShift from '@/assets/icons/nav-shift.png';
import navTraining from '@/assets/icons/nav-training.png';
import { type BreadcrumbItem, type NavItem } from '@/types';

/**
 * Single source of truth for the app's page tree.
 *
 * Every page is registered here once; the sidebar, the breadcrumb trail, and
 * the browser tab title are all derived from it, so a title or URL is never
 * written twice.
 *
 * - `url` may contain `:param` segments (e.g. `/iam/users/:id/edit`), which
 *   match any single segment when resolving the current page.
 * - `inSidebar` opts a node into the sidebar menu. Detail pages (create/edit)
 *   and pages reachable only by direct link stay out of it but still resolve
 *   to a title and breadcrumb trail.
 */
export interface NavNode {
    title: string;
    url: string;
    iconSrc?: string;
    permission?: string;
    inSidebar?: boolean;
    children?: NavNode[];
}

// NOTE: most sidebar routes below don't exist yet — only Dashboard and Data
// Karyawan are wired to real pages today. The rest are placeholders for the
// modules this nav anticipates and will 404 until those modules are built.
export const navigation: NavNode[] = [
    { title: 'Dashboard', url: '/dashboard', iconSrc: navDashboard, inSidebar: true },
    { title: 'Data Karyawan', url: '/employees', iconSrc: navEmployees, inSidebar: true },
    {
        title: 'Perusahaan',
        url: '/company',
        iconSrc: navCompany,
        inSidebar: true,
        children: [
            { title: 'Struktur Organisasi', url: '/company/structure', iconSrc: navOrgStructure, inSidebar: true },
            { title: 'Dokumen Center', url: '/company/documents', iconSrc: navDocumentCenter, inSidebar: true },
            { title: 'Manajemen Aset', url: '/company/asset', iconSrc: navAssetManagement, inSidebar: true },
        ],
    },
    {
        title: 'Monitoring Kehadiran',
        url: '/attendance',
        iconSrc: navAttendance,
        inSidebar: true,
        children: [
            { title: 'Absensi', url: '/attendance/check-in', iconSrc: navCheckIn, inSidebar: true },
            { title: 'Izin & Cuti', url: '/attendance/leave', iconSrc: navCalendar, inSidebar: true },
            { title: 'Lembur', url: '/attendance/overtime', iconSrc: navCalendar, inSidebar: true },
            { title: 'Shift & Jadwal', url: '/attendance/schedule', iconSrc: navShift, inSidebar: true },
        ],
    },
    { title: 'Penilaian Kinerja', url: '/performance', iconSrc: navPerformance, inSidebar: true },
    {
        title: 'Penggajian',
        url: '/payroll',
        iconSrc: navPayroll,
        inSidebar: true,
        children: [
            { title: 'Data Gaji', url: '/payroll/data', iconSrc: navPayrollData, inSidebar: true },
            { title: 'Pengaturan Gaji', url: '/payroll/settings', iconSrc: navPayrollSettings, inSidebar: true },
            { title: 'Reimburse', url: '/payroll/reimburse', iconSrc: navReimburse, inSidebar: true },
        ],
    },
    { title: 'Rekrutmen', url: '/recruitment', iconSrc: navCalendar, inSidebar: true },
    { title: 'Pelatihan', url: '/training', iconSrc: navTraining, inSidebar: true },
    { title: 'Master Data', url: '/master-data', iconSrc: navMasterData, inSidebar: true },

    // Reachable by direct link only — kept out of the sidebar, but still
    // resolved for titles and breadcrumbs.
    {
        title: 'Users',
        url: '/iam/users',
        children: [
            { title: 'New user', url: '/iam/users/create' },
            { title: 'Edit user', url: '/iam/users/:id/edit' },
        ],
    },
    {
        title: 'Roles',
        url: '/iam/roles',
        children: [
            { title: 'New role', url: '/iam/roles/create' },
            { title: 'Edit role', url: '/iam/roles/:id/edit' },
        ],
    },
    { title: 'Permissions', url: '/iam/permissions' },
    { title: 'Audit log', url: '/audit' },
    { title: 'API Explorer', url: '/docs/routes' },
];

/** Strips the query string and any trailing slash so `/employees?page=2` still matches `/employees`. */
function normalize(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function segmentsMatch(pattern: string, actual: string): boolean {
    const patternParts = normalize(pattern).split('/');
    const actualParts = normalize(actual).split('/');

    if (patternParts.length !== actualParts.length) return false;

    return patternParts.every((part, i) => part.startsWith(':') || part === actualParts[i]);
}

/**
 * Walks the tree for the deepest node matching `url`, returning that node
 * together with its ancestors (outermost first). Empty when nothing matches.
 */
export function trailFor(url: string): NavNode[] {
    const walk = (nodes: NavNode[], ancestors: NavNode[]): NavNode[] | null => {
        for (const node of nodes) {
            const trail = [...ancestors, node];

            // Depth first, so `/iam/roles/create` wins over its `/iam/roles` parent.
            const deeper = node.children ? walk(node.children, trail) : null;
            if (deeper) return deeper;

            if (segmentsMatch(node.url, url)) return trail;
        }

        return null;
    };

    return walk(navigation, []) ?? [];
}

/** Breadcrumb trail for the given URL. Empty when the page isn't registered. */
export function breadcrumbsFor(url: string): BreadcrumbItem[] {
    return trailFor(url).map((node) => ({ title: node.title, href: node.url }));
}

/** Browser tab title for the given URL. Undefined when the page isn't registered. */
export function titleFor(url: string): string | undefined {
    return trailFor(url).at(-1)?.title;
}

/** The sidebar menu, filtered to nodes that opted in via `inSidebar`. */
export function sidebarItems(): NavItem[] {
    const toNavItem = (node: NavNode): NavItem => {
        const children = node.children?.filter((child) => child.inSidebar).map(toNavItem);

        return {
            title: node.title,
            url: node.url,
            iconSrc: node.iconSrc,
            permission: node.permission,
            // Undefined rather than [], so a parent whose children are all
            // hidden renders as a plain link instead of an empty submenu.
            items: children?.length ? children : undefined,
        };
    };

    return navigation.filter((node) => node.inSidebar).map(toNavItem);
}
