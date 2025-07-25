"use client";

import * as React from "react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main-sidebar";
import SpinningLoader from "@/components/spinning-loader";
import { useCurrentUser } from "../../../auth/queries/use-get-current-user";
import { LayoutDashboard } from "lucide-react";
import { NavUser } from "./sidebar-userbutton";
import { SidebarSkeleton } from "./sidebar-skeleton";
import { AdminDashboardType } from "@/lib/types";
import { getSidebarLinks } from "./sidebar-links";
import { StoreSwitcher } from "./store-switcher";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    adminType: AdminDashboardType;
    storeId?: string;
}

export function AdminSidebar({ adminType, storeId, ...props }: AdminSidebarProps) {
    const { data: user, isPending, refetch: refetchUser, isRefetching } = useCurrentUser();

    const sidebarLinks = React.useMemo(() => {
        if (!user) return [];

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
    }, [user, adminType, storeId]);

    React.useEffect(() => {
        if (!user) refetchUser()
    }, [user, refetchUser]);

    if (isPending || isRefetching) {
        return <SidebarSkeleton />;
    }

    if (!user || !adminType) {
        return null;
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
                                    adminUserId={user.$id}
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
                {!user ? (
                    <SpinningLoader />
                ) : (
                    <NavUser currentUser={user} />
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}