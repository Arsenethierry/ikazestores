import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

export default async function ProductsCategoriesPage({
    params,
}: {
    params: Promise<{ currentStoreId: string }>
}) {
    const { currentStoreId } = await params;
    return (
        <div>
            <section className='flex justify-between border-b-2 py-3 mb-5'>
                <h2 className='font-bold'>Categories: for store {currentStoreId}</h2>
                <Link className={buttonVariants()} href={'/dashboard/products/categories?createnew=true'}>New Category</Link>
            </section>
        </div>
    );
}