import { AccessDeniedCard } from '@/components/access-denied-card';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhyscalStoreCard } from '@/features/stores/components/physical-store-card';
import { StoreCard } from '@/features/stores/components/store-card';
import { getAllPshyicalStores, getAllPshyicalStoresByOwnerId } from '@/lib/actions/physical-store.action';
import { getAllVirtualStores, getAllVirtualStoresByOwnerId } from '@/lib/actions/vitual-store.action';
import { PhysicalStoreTypes, VirtualStoreTypes } from '@/lib/types';
import { getAuthState } from '@/lib/user-permission';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const AllStoresPage = async () => {
    const {
        isSystemAdmin,
        user
    } = await getAuthState();

    if (!user) return (
        <AccessDeniedCard />
    );

    const virtualStores = isSystemAdmin
        ? await getAllVirtualStores()
        : await getAllVirtualStoresByOwnerId(user.$id);

    const physicalStores = isSystemAdmin
        ? await getAllPshyicalStores()
        : await getAllPshyicalStoresByOwnerId(user.$id)

    return (
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
            <Tabs defaultValue={"virtualStores"} className="w-full">
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
    );
}

export default AllStoresPage;