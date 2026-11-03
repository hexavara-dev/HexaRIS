import { SettingsDialog } from '@/components/settings-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronsUpDown, LogOut, UserCog } from 'lucide-react';
import { useState } from 'react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const cleanup = useMobileNavigation();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton size="lg" className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group">
                                <UserInfo user={auth.user} />
                                <ChevronsUpDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl p-1.5"
                            align="end"
                            side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                        >
                            <DropdownMenuItem className="gap-3 rounded-lg px-3 py-2.5" onSelect={() => setSettingsOpen(true)}>
                                <UserCog className="size-4" />
                                Setting
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="gap-3 rounded-lg px-3 py-2.5 text-red-500 focus:text-red-500">
                                <Link method="post" href={route('logout')} as="button" className="w-full" onClick={cleanup}>
                                    <LogOut className="size-4" />
                                    Log Out
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}
