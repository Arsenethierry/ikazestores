import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/features/stores/components/sidebar/admin-sidebar";
import { getLoggedInUser } from "@/lib/actions/auth.action";
import { getQueryClient } from "@/lib/get-query-client";
import { getAuthState } from "@/lib/user-permission";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface AdminLayoutProps {
    children: React.ReactNode;
    params: { storeId?: string };
}

export default async function AdminLayout({
    children,
    params,
}: AdminLayoutProps) {
    const {
        isSystemAdmin,
        isVirtualStoreOwner,
        isPhysicalStoreOwner
    } = await getAuthState();
    const { storeId } = params;

    const queryClient = getQueryClient();

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

    if (!storeId) {
        return children;
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SidebarProvider>
                <AdminSidebar
                    storeId={storeId}
                    adminType={
                        isSystemAdmin ? 'systemAdmin'
                            : isPhysicalStoreOwner ? 'physicalStoreAdmin'
                                : isVirtualStoreOwner ? 'virtualStoreAdmin'
                                    : undefined
                    }
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