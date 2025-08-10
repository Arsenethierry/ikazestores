import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/features/stores/components/sidebar/admin-sidebar";
import { getLoggedInUser } from "@/lib/actions/auth.action";
import { getQueryClient } from "@/lib/get-query-client";
import { getAuthState } from "@/lib/user-permission";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default async function AdminLayout({
    children,
}: AdminLayoutProps) {
    const queryClient = getQueryClient();

    const {
        isSystemAdmin,
        user
    } = await getAuthState();

    await queryClient.prefetchQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            try {
                const user = await getLoggedInUser();
                return user;
            } catch (error) {
                console.error("Failed to prefetch current user:", error);
                return null;
            }
        },
        staleTime: 60 * 1000,
        retry: 3
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SidebarProvider>
                <AdminSidebar
                    adminType={
                        isSystemAdmin ? 'systemAdmin'
                            : undefined
                    }
                    initialUser={user}
                />
                <SidebarInset>
                    <header className='sticky top-0 bg-muted z-20 flex h-16 shrink-0 items-center gap-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b'>
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className='-ml-1' />
                        </div>
                    </header>
                    <div className="main-container py-5 xl:py-10">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </HydrationBoundary>
    );
}
