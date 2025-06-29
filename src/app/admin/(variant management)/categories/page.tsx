import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { getGeneralCategories } from '@/features/categories/actions/categories-actions';
import { AllCategories } from '@/features/categories/components/categories-page';
import { getAuthState } from '@/lib/user-permission';
import Link from 'next/link';
import React from 'react';

async function CategoriesPage() {
    const categories = await getGeneralCategories();

    const {
        isSystemAdmin,
        user
    } = await getAuthState();

    return (
        <div className='w-full max-w-7xl space-y-5'>
            <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold'>All Categories</h3>
                {isSystemAdmin && (
                    <Link href={'/admin/categories/new'} className={buttonVariants()}>
                        Create new category
                    </Link>
                )}
            </div>
            {categories.total === 0 ? (
                <NoItemsCard />
            ) : (
                <AllCategories
                    isSystemAdmin={isSystemAdmin}
                    categories={categories.documents}
                    currentUser={user}
                />
            )}
        </div>
    )
}

export default CategoriesPage;