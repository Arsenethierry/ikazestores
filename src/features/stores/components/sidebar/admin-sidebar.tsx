
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
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVirtualStoreById } from "@/lib/actions/vitual-store.action";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    adminType: AdminDashboardType
}

export function AdminSidebar({ adminType, ...props }: AdminSidebarProps) {
    const { data: user, isPending } = useCurrentUser();
    const { storeId } = useParams<{ storeId: string; }>();

    const { data: storeData, isPending: storeDataPending } = useQuery({
        queryKey: [`${adminType}-store`, storeId],
        queryFn: async () => {
            if (!storeId) return null

            if (adminType === 'virtualStoreAdmin') {
                return getVirtualStoreById(storeId)
            } else if (adminType === 'physicalStoreAdmin') {
                return getPhysicalStoreById(storeId)
            }

            return null;
        },
        enabled: !!storeId && adminType !== 'systemAdmin',
        staleTime: 5 * 60 * 1000,
        retry: 1,
    })

    if (isPending) return <SidebarSkeleton />;

    const sidebarLinks = adminType === 'physicalStoreAdmin'
        ? getSidebarLinks(storeId).physicalStoreAdmin
        : adminType === 'systemAdmin'
            ? getSidebarLinks(null).systemAdmin
            : adminType === 'virtualStoreAdmin'
                ? getSidebarLinks(storeId).virtualStoreAdmin
                : [];

    const getDisplayName = () => {
        if (adminType === 'systemAdmin') {
            return 'IKAZESTORES';
        }

        if (storeDataPending) {
            return 'Loading...'
        }

        if (storeData && storeData.storeName) {
            return storeData.storeName
        }

        return 'IKAZESTORES';
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <LayoutDashboard className="size-4" />
                            </div>
                            <p className="text-lg uppercase font-bold">{getDisplayName()}</p>
                        </SidebarMenuButton>
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
                {isPending || !user
                    ? <SpinningLoader />
                    : <NavUser currentUser={user} />
                }
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}