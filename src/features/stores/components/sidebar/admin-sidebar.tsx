
"use client";

import * as React from "react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main-sidebar";
import SpinningLoader from "@/components/spinning-loader";
import { useCurrentUser } from "../../../auth/queries/use-get-current-user";
import { LayoutDashboard } from "lucide-react";
import { sidebarLinks } from "./sidebar-links";
import { NavUser } from "./sidebar-userbutton";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    isSubdomain: boolean;
}

export function AdminSidebar({ isSubdomain = false, ...props }: AdminSidebarProps) {
    const { data: user, isPending } = useCurrentUser();

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
                            <p className="text-lg uppercase font-bold">ikazestores</p>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain
                    items={isSubdomain ? sidebarLinks.virtualStoreAdmin : sidebarLinks.systemAdmin}
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