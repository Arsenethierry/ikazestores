import { parseSearchParams } from "@/lib/searchParamsCache";
import { CurrentUserType, VirtualStoreTypes } from "@/lib/types";
import { ProductsPagination } from "./products-pagination";
import { getFilteredProducts } from "@/lib/actions/original-products-actions";
import { CloningProductsGrid } from "./cloning-products-grid";

interface CloneProductsContainerProps {
    storeData: VirtualStoreTypes;
    user: CurrentUserType;
    searchParams: { [key: string]: string | string[] | undefined };
}

export async function CloneProductsContainer({
    storeData,
    user,
    searchParams,
}: CloneProductsContainerProps) {
    const filters = parseSearchParams(searchParams);
    const { products, total, hasMore, currentPage } = await getFilteredProducts(filters, storeData.operatingCountry);

    return (
        <div className="space-y-6">
            <CloningProductsGrid
                products={products}
                virtualStoreId={storeData.$id}
                user={user}
            />
            
            {total > 0 && (
                <ProductsPagination
                    currentPage={currentPage}
                    hasMore={hasMore}
                    total={total}
                />
            )}
        </div>
    );
}