import { buttonVariants } from '@/components/ui/button';
import AllStoresList from '@/features/system-admin/store-list';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const AllStoresPage = () => {
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