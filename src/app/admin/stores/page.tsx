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
import { Plus, Store, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

enum StoreTabType {
    Physical = "physicalStores",
    Virtual = "virtualStores"
}

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

    if (isSystemAdmin) {
        redirect('/admin/sys-admin/stores')
    }

    const shouldFetchVirtual = isSystemAdmin || isPhysicalStoreOwner || isVirtualStoreOwner;
    const shouldFetchPhysical = isSystemAdmin || isPhysicalStoreOwner;
    const virtualStores = shouldFetchVirtual
        ? isSystemAdmin
            ? await getAllVirtualStores({ withProducts: true })
            : await getAllVirtualStoresByOwnerId(user.$id)
        : null;

    const physicalStores = shouldFetchPhysical
        ? isSystemAdmin
            ? await getPaginatedPhysicalStores({})
            : await getAllPshyicalStoresByOwnerId(user.$id)
        : null;

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

    const showVirtualTab = shouldFetchVirtual;
    const showPhysicalTab = shouldFetchPhysical;
    const availableTabs: StoreTabType[] = [];

    if (showVirtualTab) availableTabs.push(StoreTabType.Virtual);
    if (showPhysicalTab) availableTabs.push(StoreTabType.Physical);

    const getDefaultTab = () => {
        if (isVirtualStoreOwner && !isPhysicalStoreOwner) return 'virtualStores';
        if (isPhysicalStoreOwner) return availableTabs.includes(StoreTabType.Physical) ? 'physicalStores' : 'virtualStores';
        return availableTabs[0] || 'virtualStores';
    };

    const getAdminTypeInfo = () => {
        if (isPhysicalStoreOwner && isVirtualStoreOwner) {
            return { title: 'All Stores', subtitle: 'Manage your virtual and physical stores' };
        } else if (isPhysicalStoreOwner) {
            return { title: 'Physical & Virtual Stores', subtitle: 'Manage your physical stores and view virtual marketplace' };
        } else if (isVirtualStoreOwner) {
            return { title: 'Virtual Stores', subtitle: 'Manage your virtual marketplace stores' };
        }
        return { title: 'Stores', subtitle: 'Store management dashboard' };
    };

    const { title, subtitle } = getAdminTypeInfo();

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
                            <div className='space-y-6 main-container'>
                                <section className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
                                    <div className="space-y-1">
                                        <h3 className='text-2xl font-semibold text-foreground'>
                                            {title}
                                        </h3>
                                        <p className='text-sm text-muted-foreground'>{subtitle}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {/* Show different create buttons based on admin type */}
                                        {isPhysicalStoreOwner && (
                                            <Link
                                                href="/sell/new-store?type=physical"
                                                className={buttonVariants({ variant: "outline" })}
                                            >
                                                <Store className="w-4 h-4" />
                                                New Physical Store
                                            </Link>
                                        )}
                                        {(isVirtualStoreOwner || isPhysicalStoreOwner) && (
                                            <Link
                                                href="/sell/new-store?type=virtual"
                                                className={buttonVariants()}
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                New Virtual Store
                                            </Link>
                                        )}
                                        {/* Fallback for system admin or mixed permissions */}
                                        {!isPhysicalStoreOwner && !isVirtualStoreOwner && (
                                            <Link
                                                href={isSystemAdmin ? "/admin/stores/new" : "/sell/new-store"}
                                                className={buttonVariants()}
                                            >
                                                <Plus className="w-4 h-4" /> Create New Store
                                            </Link>
                                        )}
                                    </div>
                                </section>

                                {/* Only show tabs if there are multiple types available */}
                                {availableTabs.length > 1 ? (
                                    <Tabs defaultValue={getDefaultTab()} className="w-full">
                                        <TabsList className="w-full p-0 bg-background justify-start border-b rounded-none h-12">
                                            {showVirtualTab && (
                                                <TabsTrigger
                                                    value="virtualStores"
                                                    className="rounded-none bg-background h-full px-6 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background font-medium"
                                                >
                                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                                    Virtual Stores
                                                    {virtualStores && (
                                                        <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
                                                            {virtualStores.total}
                                                        </span>
                                                    )}
                                                </TabsTrigger>
                                            )}
                                            {showPhysicalTab && (
                                                <TabsTrigger
                                                    value="physicalStores"
                                                    className="rounded-none bg-background h-full px-6 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background font-medium"
                                                >
                                                    <Store className="w-4 h-4 mr-2" />
                                                    Physical Stores
                                                    {physicalStores && (
                                                        <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
                                                            {physicalStores.total}
                                                        </span>
                                                    )}
                                                </TabsTrigger>
                                            )}
                                        </TabsList>

                                        {showVirtualTab && (
                                            <TabsContent value="virtualStores" className="mt-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-lg font-medium">Virtual Stores</h4>
                                                        {virtualStores && virtualStores.total > 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {virtualStores.total} store{virtualStores.total !== 1 ? 's' : ''} found
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                                        {virtualStores && virtualStores.total > 0 ? virtualStores.documents.map((store) => (
                                                            <StoreCard
                                                                key={store.$id}
                                                                store={store as VirtualStoreTypes}
                                                                currentUser={user}
                                                                isAdminPage={true}
                                                            />
                                                        )) : (
                                                            <Card className='col-span-full py-12 border-dashed'>
                                                                <div className="text-center space-y-3">
                                                                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
                                                                    <div>
                                                                        <p className='font-medium text-lg'>No Virtual Stores</p>
                                                                        <p className='text-sm text-muted-foreground'>
                                                                            Create your first virtual store to start selling online
                                                                        </p>
                                                                    </div>
                                                                    <Link
                                                                        href="/sell/new-store?type=virtual"
                                                                        className={buttonVariants({ size: "sm" })}
                                                                    >
                                                                        <Plus className="w-4 h-4 mr-1" />
                                                                        Create Virtual Store
                                                                    </Link>
                                                                </div>
                                                            </Card>
                                                        )}
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        )}

                                        {showPhysicalTab && (
                                            <TabsContent value="physicalStores" className="mt-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-lg font-medium">Physical Stores</h4>
                                                        {physicalStores && physicalStores.total > 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {physicalStores.total} store{physicalStores.total !== 1 ? 's' : ''} found
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                                        {physicalStores && physicalStores.total > 0 ? physicalStores.documents.map((store) => (
                                                            <PhyscalStoreCard
                                                                store={store as PhysicalStoreTypes}
                                                                currentUser={user}
                                                                key={store.$id}
                                                            />
                                                        )) : (
                                                            <Card className='col-span-full py-12 border-dashed'>
                                                                <div className="text-center space-y-3">
                                                                    <Store className="w-12 h-12 mx-auto text-muted-foreground" />
                                                                    <div>
                                                                        <p className='font-medium text-lg'>No Physical Stores</p>
                                                                        <p className='text-sm text-muted-foreground'>
                                                                            Set up your first physical location to manage in-person sales
                                                                        </p>
                                                                    </div>
                                                                    {isPhysicalStoreOwner && (
                                                                        <Link
                                                                            href="/sell/new-store?type=physical"
                                                                            className={buttonVariants({ size: "sm", variant: "outline" })}
                                                                        >
                                                                            <Plus className="w-4 h-4 mr-1" />
                                                                            Create Physical Store
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        )}
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        )}
                                    </Tabs>
                                ) : (
                                    // Single store type view (no tabs needed)
                                    <div className="space-y-4">
                                        {showVirtualTab && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-medium">Virtual Stores</h4>
                                                    {virtualStores && virtualStores.total > 0 && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {virtualStores.total} store{virtualStores.total !== 1 ? 's' : ''} found
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                                    {virtualStores && virtualStores.total > 0 ? virtualStores.documents.map((store) => (
                                                        <StoreCard
                                                            key={store.$id}
                                                            store={store as VirtualStoreTypes}
                                                            currentUser={user}
                                                            isAdminPage={true}
                                                        />
                                                    )) : (
                                                        <Card className='col-span-full py-12 border-dashed'>
                                                            <div className="text-center space-y-3">
                                                                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
                                                                <div>
                                                                    <p className='font-medium text-lg'>No Virtual Stores</p>
                                                                    <p className='text-sm text-muted-foreground'>
                                                                        Create your first virtual store to start selling online
                                                                    </p>
                                                                </div>
                                                                <Link
                                                                    href="/sell/new-store?type=virtual"
                                                                    className={buttonVariants({ size: "sm" })}
                                                                >
                                                                    <Plus className="w-4 h-4 mr-1" />
                                                                    Create Virtual Store
                                                                </Link>
                                                            </div>
                                                        </Card>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </HydrationBoundary>
        </>
    );
}

export default AllStoresPage;