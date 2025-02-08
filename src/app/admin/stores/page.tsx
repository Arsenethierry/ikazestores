import { buttonVariants } from '@/components/ui/button';
import AllStoresList from '@/features/stores/store-list';
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

    const stores = await getAllVirtualStores()

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
            <AllStoresList store={stores.documents} />
        </div>
    );
}

export default AllStoresPage;