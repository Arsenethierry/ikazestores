import { VirtualProductsSearchParams } from "@/lib/types";
import { getPaginatedVirtualProducts, searchVirtualProducts } from "../../actions/virtual-products-actions";
import { NoItemsCard } from "@/components/no-items-card";
import { VirtualProductCard } from "../product-cards/virtual-product-card";

export async function SearchResultsPage({
    searchParams
}: {
    searchParams: VirtualProductsSearchParams & { query?: string }
}) {
    let products;

    if (searchParams.query && searchParams.query.trim() !== '') {
        products = await searchVirtualProducts({
            query: searchParams.query,
            limit: 10
        });

        if (products.total > 0 && (
            searchParams.category ||
            searchParams.minPrice ||
            searchParams.maxPrice ||
            searchParams.sortBy
        )) {
            products = await getPaginatedVirtualProducts({
                searchParams: {
                    ...searchParams,
                    query: searchParams.query
                }
            });
        }
    } else {
        products = await getPaginatedVirtualProducts({ searchParams });
    }

    if (!products || products.total === 0) {
        return (
            <div className="w-full py-10">
                <NoItemsCard
                    title="No products found"
                    description={searchParams.query ? `No results for "${searchParams.query}"` : "No products match your filters"}
                />
            </div>
        );
    }

    return (
        <>
            {products.documents.map((product) => (
                <div key={product.$id} className="w-1/4 min-w-[240px] p-2">
                    <VirtualProductCard product={product} />
                </div>
            ))}
        </>
    );
}