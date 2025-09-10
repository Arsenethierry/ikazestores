import { parseSearchParams } from "@/lib/searchParamsCache";
import { CurrentUserType, VirtualStoreTypes } from "@/lib/types";
import { ProductsPagination } from "./products-pagination";
import { ProductsGrid } from "./products-grid";
import { getFilteredProducts } from "@/lib/actions/original-products-actions";

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
        <>
            <ProductsGrid
                products={products}
                virtualStoreId={storeData.$id}
                user={user}
            />
            <ProductsPagination
                currentPage={currentPage}
                hasMore={hasMore}
                total={total}
            />
        </>
    );
}