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
import navShift from '@/assets/icons/nav-shift.png';
import navTraining from '@/assets/icons/nav-training.png';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import AppLogo from './app-logo';

// NOTE: most of these routes don't exist yet — only Dashboard is wired to a real page today.
// The rest point at placeholder paths for the modules this nav anticipates (Employees, Company,
// Attendance, Performance, Payroll, Recruitment, Training, Master Data) and will 404 until those
// modules are built. Update the `url` once each module ships.
const navItems: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', iconSrc: navDashboard },
    { title: 'Data Karyawan', url: '/employees', iconSrc: navEmployees },
    {
        title: 'Perusahaan',
        url: '/company',
        iconSrc: navCompany,
        items: [
            { title: 'Struktur Organisasi', url: '/company/structure', iconSrc: navOrgStructure },
            { title: 'Dokumen Center', url: '/company/documents', iconSrc: navDocumentCenter },
            { title: 'Manajemen Aset', url: '/company/assets', iconSrc: navAssetManagement },
        ],
    },
    {
        title: 'Monitoring Kehadiran',
        url: '/attendance',
        iconSrc: navAttendance,
        items: [
            { title: 'Absensi', url: '/attendance/check-in', iconSrc: navCheckIn },
            { title: 'Izin & Cuti', url: '/attendance/leave', iconSrc: navCalendar },
            { title: 'Lembur', url: '/attendance/overtime', iconSrc: navCalendar },
            { title: 'Shift & Jadwal', url: '/attendance/schedule', iconSrc: navShift },
        ],
    },
    { title: 'Penilaian Kinerja', url: '/performance', iconSrc: navPerformance },
    {
        title: 'Penggajian',
        url: '/payroll',
        iconSrc: navPayroll,
        items: [
            { title: 'Data Gaji', url: '/payroll/data', iconSrc: navPayrollData },
            { title: 'Pengaturan Gaji', url: '/payroll/settings', iconSrc: navPayrollSettings },
        ],
    },
    { title: 'Rekrutmen', url: '/recruitment', iconSrc: navCalendar },
    { title: 'Pelatihan', url: '/training', iconSrc: navTraining },
    { title: 'Master Data', url: '/master-data', iconSrc: navMasterData },
];

export function AppSidebar() {
    const { can } = usePermissions();
    const items = navItems.filter((item) => !item.permission || can(item.permission));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-sidebar-border/50 h-16 justify-center border-b px-4 py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between gap-1">
                            <SidebarMenuButton size="lg" asChild className="w-auto flex-1 group-data-[collapsible=icon]:hidden">
                                <Link href="/dashboard" prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                            <SidebarTrigger />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
