import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { getAllCategoriesByStoreId } from '@/features/categories/actions/categories-actions';
import { AllCategories } from '@/features/categories/components/categories-page';
import { getAuthState } from '@/lib/user-permission';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

async function CategoriesPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const categories = await getAllCategoriesByStoreId({ storeId });

    const {
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        user
    } = await getAuthState();

    if (!user) {
        redirect('/sign-in')
    }

    return (
        <div className='w-full max-w-7xl space-y-5'>
            <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold'>All Categories</h3>
                {isPhysicalStoreOwner && (
                    <Link href={`/admin/stores/${storeId}/categories/new`} className={buttonVariants()}>
                        Create new category
                    </Link>
                )}
                {isVirtualStoreOwner && (
                    <Link href={`/admin/stores/${storeId}/subcategories/new`} className={buttonVariants()}>
                        Add subcategories
                    </Link>
                )}
            </div>
            {categories.total === 0 ? (
                <NoItemsCard />
            ) : (
                <AllCategories
                    isSystemAdmin={false}
                    categories={categories.documents}
                    currentUser={user}
                />
            )}
        </div>
    )
}

export default CategoriesPage;