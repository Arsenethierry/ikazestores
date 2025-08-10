import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export const SidebarSkeleton = () => {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <div className="animate-pulse rounded-md bg-primary/10 size-4" />
                            </div>
                            <div className="animate-pulse h-4 w-24 bg-primary/10 rounded" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <div className="space-y-4 px-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                </div>
            </SidebarContent>
            <SidebarFooter>
                <Skeleton className="h-10 w-full rounded-md" />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
