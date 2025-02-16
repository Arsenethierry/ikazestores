import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreCard } from '@/features/stores/components/store-card';
import { hasLabelAccess } from '@/hooks/use-has-label-permission';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { getAllVirtualStores } from '@/lib/actions/vitual-store.action';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

const AllStoresPage = async () => {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in?redirectUrl=/admin/stores")
    if (!hasLabelAccess(user, ['superAdmin'])) redirect("/");

    const stores = await getAllVirtualStores();

    return (
        <div className='space-y-5'>
            <section className='flex justify-between items-center'>
                <div>
                    <h3 className='text-xl font-medium'>
                        All Stores
                    </h3>
                    <p className='text-sm text-muted-foreground'>This is a shops list.</p>
                </div>
                <Link href={"/admin/stores/new"} className={buttonVariants()}>
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
                        Physical Stores
                    </TabsTrigger>
                </TabsList>
                <TabsContent key={"virtualStores"} value={"virtualStores"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        {stores.documents.map((store) => (
                            <StoreCard key={store.$id} store={store} />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent key={"physicalStores"} value={"physicalStores"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        Physical stres
                    </div>
                </TabsContent>
            </Tabs>
            {/* <AllStoresList store={stores.documents} /> */}
        </div>
    );
}

export default AllStoresPage;