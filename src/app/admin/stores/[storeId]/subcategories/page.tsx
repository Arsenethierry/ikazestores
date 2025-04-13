import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { getAllSubCategoriesByStoreId } from '@/features/categories/actions/sub-categories-actions';
import { AllSubCategories } from '@/features/categories/components/all-sub-categories';
import { getAuthState } from '@/lib/user-label-permission';
import Link from 'next/link';
import React from 'react';

async function CategoriesPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const subCategories = await getAllSubCategoriesByStoreId({ storeId });

    const {
        isSystemAdmin,
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        user
    } = await getAuthState();

    return (
        <div className='w-full max-w-7xl space-y-5'>
            <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold'>All subcategories Categories</h3>
                {(isPhysicalStoreOwner || isSystemAdmin || isVirtualStoreOwner) && (
                    <Link href={`/admin/stores/${storeId}/subcategories/new`} className={buttonVariants({ variant: 'teritary' })}>
                        Create new sub-category
                    </Link>
                )}
            </div>
            {subCategories.total === 0 ? (
                <NoItemsCard />
            ) : (
                <AllSubCategories
                    subcategories={subCategories.documents}
                    currentUser={user}
                />
            )}
        </div>
    )
}

export default CategoriesPage;