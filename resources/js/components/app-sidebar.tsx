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
import { sidebarItems } from '@/lib/navigation';
import { Link } from '@inertiajs/react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { can } = usePermissions();
    const items = sidebarItems().filter((item) => !item.permission || can(item.permission));

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
