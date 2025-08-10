"use client";

import * as React from "react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main-sidebar";
import { useCurrentUser } from "../../../auth/queries/use-get-current-user";
import { LayoutDashboard } from "lucide-react";
import { NavUser } from "./sidebar-userbutton";
import { SidebarSkeleton } from "./sidebar-skeleton";
import { AdminDashboardType, CurrentUserType } from "@/lib/types";
import { getSidebarLinks } from "./sidebar-links";
import { StoreSwitcher } from "./store-switcher";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    adminType: AdminDashboardType;
    storeId?: string;
    initialUser?: CurrentUserType;
}

export function AdminSidebar({ adminType, storeId, initialUser, ...props }: AdminSidebarProps) {
    const { data: user, isPending } = useCurrentUser(initialUser);

    const sidebarLinks = React.useMemo(() => {
        // Use initialUser as fallback if query data isn't available yet
        const currentUser = user || initialUser;
        if (!currentUser) return [];

        const links = getSidebarLinks(storeId || null);

        switch (adminType) {
            case 'physicalStoreAdmin':
                return links.physicalStoreAdmin;
            case 'systemAdmin':
                return links.systemAdmin;
            case 'virtualStoreAdmin':
                return links.virtualStoreAdmin;
            default:
                return [];
        }
    }, [user, initialUser, adminType, storeId]);

    if (isPending && !initialUser) {
        return <SidebarSkeleton />;
    }

    const currentUser = user || initialUser;

    if (!currentUser || !adminType) {
        return <SidebarSkeleton />;
    }

    const isStoreAdmin = adminType === 'physicalStoreAdmin' || adminType === 'virtualStoreAdmin';

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {isStoreAdmin ? (
                            <div className="p-2">
                                <StoreSwitcher
                                    adminType={adminType}
                                    adminUserId={currentUser.$id}
                                />
                            </div>
                        ) : (
                            <SidebarMenuButton size="lg">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <LayoutDashboard className="size-4" />
                                </div>
                                <p className="text-lg uppercase font-bold">IkazeStores</p>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain
                    items={sidebarLinks}
                    adminType={adminType}
                />
            </SidebarContent>
            <SidebarFooter>
                <NavUser currentUser={currentUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}