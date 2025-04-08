import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { getAllSubcategories } from '@/features/categories/actions/sub-categories-actions';
import { AllSubCategories } from '@/features/categories/components/all-sub-categories';
import { getAuthState } from '@/lib/user-label-permission';
import Link from 'next/link';
import React from 'react';

async function CategoriesPage() {
    const subCategories = await getAllSubcategories();

    const {
        isSystemAdmin,
        isPhysicalStoreOwner,
        isVirtualStoreOwner
    } = await getAuthState();

    return (
        <div className='w-full max-w-7xl space-y-5'>
            <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold'>All subcategories Categories</h3>
                {(isPhysicalStoreOwner || isSystemAdmin || isVirtualStoreOwner) && (
                    <Link href={'/admin/subcategories/new'} className={buttonVariants()}>
                        Create new sub-category
                    </Link>
                )}
            </div>
            {subCategories.total === 0 ? (
                <NoItemsCard />
            ) : (
                <AllSubCategories
                    isSystemAdmin={isSystemAdmin}
                    subcategories={subCategories.documents}
                />
            )}
        </div>
    )
}

export default CategoriesPage;