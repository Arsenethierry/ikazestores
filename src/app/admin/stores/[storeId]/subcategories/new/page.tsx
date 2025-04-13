import { AccessDeniedCard } from '@/components/access-denied-card';
import { NoItemsCard } from '@/components/no-items-card';
import { type Option } from '@/components/ui/multiselect';
import { getGeneralCategories } from '@/features/categories/actions/categories-actions';
import { SubCategoryForm } from '@/features/categories/components/sub-category-form';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';

async function NewCategory({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const {
        user,
        isSystemAdmin,
        isVirtualStoreOwner,
        isPhysicalStoreOwner
    } = await getAuthState();

    if (!user) redirect('/');

    if (!isSystemAdmin && !isVirtualStoreOwner && !isPhysicalStoreOwner) return <AccessDeniedCard />
    const categories = await getGeneralCategories();
    if (!categories.documents || categories.total === 0) return <NoItemsCard />

    const categoriesSelectOptions: Option[] = categories.documents.map(category => ({
        value: category.$id,
        label: category.categoryName
    }))

    return (
        <SubCategoryForm
            currentUser={user}
            categoriesOptions={categoriesSelectOptions}
            storeId={storeId}
        />
    )
}

export default NewCategory;