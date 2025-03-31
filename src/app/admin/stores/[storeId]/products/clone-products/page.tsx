import { buttonVariants } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CloneProductsPage from '@/features/products/components/clone-products/default-view-products';
import { NearByProducts } from '@/features/products/components/clone-products/near-by-products';
import { getAuthState } from '@/lib/user-label-permission';
import { MapPinHouse, TableOfContents } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

async function page({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const {
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        user
    } = await getAuthState();

    if (!isVirtualStoreOwner) {
        return <p className='text-3xl text-destructive font-bold'>Access denied!</p>
    }

    return (
        <>
            <Link href={`/admin/stores/${storeId}/products/new`} className={`${buttonVariants()} mb-5`}>Create New Product</Link>
            <Tabs defaultValue="defaultProductsDisplay">
                <ScrollArea>
                    <TabsList className="mb-3 gap-1 bg-transparent">
                        <TabsTrigger
                            value="defaultProductsDisplay"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full data-[state=active]:shadow-none"
                        >
                            <TableOfContents
                                className="-ms-0.5 me-1.5 opacity-60"
                                size={16}
                                aria-hidden="true"
                            />
                            Default
                        </TabsTrigger>
                        <TabsTrigger
                            value="nearBy"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full data-[state=active]:shadow-none"
                        >
                            <MapPinHouse
                                className="-ms-0.5 me-1.5 opacity-60"
                                size={16}
                                aria-hidden="true"
                            />
                            Near By
                        </TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <TabsContent value="defaultProductsDisplay">
                    <CloneProductsPage
                        storeId={storeId}
                        isPhysicalStoreOwner={isPhysicalStoreOwner}
                        isSystemAdmin={isSystemAdmin}
                        isVirtualStoreOwner={isVirtualStoreOwner}
                        user={user}
                    />
                </TabsContent>
                <TabsContent value="nearBy">
                    <NearByProducts
                        storeId={storeId}
                        isPhysicalStoreOwner={isPhysicalStoreOwner}
                        isSystemAdmin={isSystemAdmin}
                        isVirtualStoreOwner={isVirtualStoreOwner}
                        user={user}
                    />
                </TabsContent>
            </Tabs>
        </>
    );
}

export default page;