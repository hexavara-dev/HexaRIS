import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// `group` lets the icon below react to this button's own `data-active` via group-data-*.
const ACTIVE_CLASSES =
    'group data-[active=true]:bg-[#1980C0] data-[active=true]:text-white data-[active=true]:hover:bg-[#1980C0] data-[active=true]:hover:text-white';

function NavIcon({ item }: { item: NavItem }) {
    if (item.iconSrc) {
        // Raster icons can't pick up `currentColor`, so force them white on an active row instead.
        return <img src={item.iconSrc} alt="" className="size-4 shrink-0 group-data-[active=true]:brightness-0 group-data-[active=true]:invert" />;
    }

    if (item.icon) {
        return <item.icon />;
    }

    return null;
}

function NavGroup({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
    const isChildActive = item.items!.some((subItem) => subItem.url === currentUrl);
    const [open, setOpen] = useState(isChildActive);

    // The sidebar persists across Inertia navigations (it never remounts), so a group
    // must re-open itself when the user lands on one of its children — `defaultOpen`
    // only fires once at mount and would otherwise stay stuck from an earlier visit.
    useEffect(() => {
        if (isChildActive) {
            setOpen(true);
        }
    }, [isChildActive]);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isChildActive} className={ACTIVE_CLASSES}>
                        <NavIcon item={item} />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items!.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={subItem.url === currentUrl} className={ACTIVE_CLASSES}>
                                    <Link href={subItem.url} prefetch>
                                        <NavIcon item={subItem} />
                                        <span>{subItem.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.items?.length ? (
                        <NavGroup key={item.title} item={item} currentUrl={page.url} />
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={item.url === page.url} className={ACTIVE_CLASSES}>
                                <Link href={item.url} prefetch>
                                    <NavIcon item={item} />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
