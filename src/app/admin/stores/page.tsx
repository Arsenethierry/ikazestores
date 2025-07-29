import { AccessDeniedCard } from '@/components/access-denied-card';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhyscalStoreCard } from '@/features/stores/components/physical-store-card';
import { AdminSidebar } from '@/features/stores/components/sidebar/admin-sidebar';
import { StoreCard } from '@/features/stores/components/store-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { getAllPshyicalStoresByOwnerId, getPaginatedPhysicalStores } from '@/lib/actions/physical-store.action';
import { getAllVirtualStores, getAllVirtualStoresByOwnerId } from '@/lib/actions/virtual-store.action';
import { getQueryClient } from '@/lib/get-query-client';
import { PhysicalStoreTypes, VirtualStoreTypes } from '@/lib/types';
import { getAuthState } from '@/lib/user-permission';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const AllStoresPage = async () => {
    const {
        isSystemAdmin,
        user,
        isPhysicalStoreOwner,
        isVirtualStoreOwner
    } = await getAuthState();
    const queryClient = getQueryClient();

    if (!user) return (
        <AccessDeniedCard />
    );

    const virtualStores = isSystemAdmin
        ? await getAllVirtualStores({ withProducts: true })
        : await getAllVirtualStoresByOwnerId(user.$id);

    const physicalStores = isSystemAdmin
        ? await getPaginatedPhysicalStores({})
        : await getAllPshyicalStoresByOwnerId(user.$id);

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
        <>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <SidebarProvider>
                    <AdminSidebar
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
                            <div className='space-y-5 main-container'>
                                <section className='flex justify-between items-center'>
                                    <div>
                                        <h3 className='text-xl font-medium'>
                                            All Stores
                                        </h3>
                                        <p className='text-sm text-muted-foreground'>This is a shops list.</p>
                                    </div>
                                    <Link
                                        href={isSystemAdmin ? "/admin/stores/new" : "/sell/new-store"}
                                        className={buttonVariants()}
                                    >
                                        <Plus /> Create New Store
                                    </Link>
                                </section>
                                <Tabs defaultValue={isPhysicalStoreOwner ? "physicalStores" :"virtualStores"} className="w-full">
                                    <TabsList className="w-full p-0 bg-background justify-start border-b rounded-none">
                                        <TabsTrigger
                                            key={"virtualStores"}
                                            value={"virtualStores"}
                                            className="rounded-none bg-background h-full data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
                                        >
                                            Virtual Stores
                                        </TabsTrigger>
                                        <TabsTrigger
                                            key={"physicalStores"}
                                            value={"physicalStores"}
                                            className="rounded-none bg-background h-full data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
                                        >
                                            Physical Vendors
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent key={"virtualStores"} value={"virtualStores"}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                            {virtualStores && virtualStores.total > 0 ? virtualStores.documents.map((store) => (
                                                <StoreCard
                                                    key={store.$id}
                                                    store={store as VirtualStoreTypes}
                                                    currentUser={user}
                                                    isAdminPage={true}
                                                />
                                            )) : (
                                                <Card className='py-10'>
                                                    <p className='font-medium text-xl text-center'>No Virtual Stores.</p>
                                                </Card>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent key={"physicalStores"} value={"physicalStores"}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                            {physicalStores && physicalStores.total > 0 ? physicalStores.documents.map((store) => (
                                                <PhyscalStoreCard
                                                    store={store as PhysicalStoreTypes}
                                                    currentUser={user}
                                                    key={store.$id}
                                                />
                                            )) : (
                                                <Card className='py-10'>
                                                    <p className='font-medium text-xl text-center'>No Physical Stores.</p>
                                                </Card>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </HydrationBoundary>
        </>
    );
}

export default AllStoresPage;