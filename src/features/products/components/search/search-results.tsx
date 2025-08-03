import { VirtualProductsSearchParams } from "@/lib/types";
import { NoItemsCard } from "@/components/no-items-card";
import { VirtualProductCard } from "../product-cards/virtual-product-card";
import { QueryFilter } from "@/lib/core/database";
import { getVirtualStoreProducts, searchVirtualStoreProducts } from "@/lib/actions/affiliate-product-actions";

export async function SearchResultsPage({
    searchParams
}: {
    searchParams: any & { query?: string }
}) {
    const {
        query,
        storeId,
        category,
        minPrice,
        maxPrice,
        sortBy,
        page = 1,
        limit = 20
    } = searchParams;

    if (!storeId) {
        return (
            <div className="w-full py-10">
                <NoItemsCard
                    title="Store required"
                    description="Please specify a virtual store to search products"
                />
            </div>
        );
    }

    let products;

    try {
        const filters: QueryFilter[] = [];

        if (category) {
            filters.push({ field: "categoryId", operator: "equal", value: category });
        }

        if (minPrice !== undefined) {
            filters.push({ field: "basePrice", operator: "greaterThanEqual", value: minPrice });
        }

        if (maxPrice !== undefined) {
            filters.push({ field: "basePrice", operator: "lessThanEqual", value: maxPrice });
        }

        const queryOptions = {
            limit: Number(limit),
            page: Number(page),
            search: query?.trim(),
            categoryId: category,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
        };

        if (query && query.trim() !== '') {
            products = await searchVirtualStoreProducts(storeId, queryOptions);
        } else {
            // Get products with filters applied
            const offset = (Number(page) - 1) * Number(limit);
            products = await getVirtualStoreProducts(storeId, {
                limit: Number(limit),
                offset,
                filters,
                orderBy: getSortField(sortBy),
                orderType: getSortOrder(sortBy)
            });

            // Transform to match expected structure
            products = {
                documents: products.documents,
                total: products.total,
                totalPages: Math.ceil(products.total / Number(limit)),
                currentPage: Number(page),
                hasMore: products.hasMore,
                success: true
            };
        }
    } catch (error) {
        console.error("Search error:", error);
        return (
            <div className="w-full py-10">
                <NoItemsCard
                    title="Search error"
                    description="Something went wrong while searching. Please try again."
                />
            </div>
        );
    }

    if (!products || !products.success || products.total === 0) {
        const noResultsTitle = query
            ? "No products found"
            : "No products available";

        const noResultsDescription = query
            ? `No results found for "${query}"${category ? ` in ${category}` : ''}`
            : "No products match your current filters";

        return (
            <div className="w-full py-10">
                <NoItemsCard
                    title={noResultsTitle}
                    description={noResultsDescription}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.documents.map((product) => (
                <div key={product.$id} className="w-full">
                    <VirtualProductCard
                        product={product}
                        storeId={storeId}
                    />
                </div>
            ))}
        </div>
    );
}

function getSortField(sortBy?: string): string {
    switch (sortBy) {
        case 'name_asc':
        case 'name_desc':
            return 'name';
        case 'price_asc':
        case 'price_desc':
            return 'basePrice';
        case 'date_asc':
        case 'date_desc':
            return '$createdAt';
        default:
            return '$createdAt';
    }
}

function getSortOrder(sortBy?: string): 'asc' | 'desc' {
    switch (sortBy) {
        case 'name_asc':
        case 'price_asc':
        case 'date_asc':
            return 'asc';
        case 'name_desc':
        case 'price_desc':
        case 'date_desc':
        default:
            return 'desc';
    }
}