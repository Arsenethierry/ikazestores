import { buttonVariants } from '@/components/ui/button';
import { NewCategoryFormModal } from '@/features/products/components/create-new-category-modal';
import { ProductsCategories } from '@/features/products/components/products-categories-list';
import { loadSearchParams } from '@/lib/searchParams';
import Link from 'next/link';
import { SearchParams } from 'nuqs';
import React from 'react';

type PageProps = {
    searchParams: Promise<SearchParams>
}
export default async function ProductsCategoriesPage({ searchParams }: PageProps) {
    const { createnew } = await loadSearchParams(searchParams);

    return (
        <div>
            <NewCategoryFormModal open={createnew} />
            <section className='flex justify-between border-b-2 py-3 mb-5'>
                <h2 className='font-bold'>Categories: {createnew}</h2>
                <Link className={buttonVariants()} href={'/dashboard/products/categories?createnew=true'}>New Category</Link>
            </section>
            <ProductsCategories />
        </div>
    );
}