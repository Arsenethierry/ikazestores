import { buttonVariants } from '@/components/ui/button';
import AllStoresList from '@/features/stores/store-list';
import { hasLabelAccess } from '@/hooks/use-has-label-permission';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

const AllStoresPage = async () => {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in")
    if (!hasLabelAccess(user, ['superAdmin'])) redirect("/");

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
            <AllStoresList />
        </div>
    );
}

export default AllStoresPage;