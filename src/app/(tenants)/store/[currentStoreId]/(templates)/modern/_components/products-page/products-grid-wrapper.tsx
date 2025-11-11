import { getVirtualStoreProducts } from "@/lib/actions/affiliate-product-actions";
import { QueryFilter, QueryOptions } from "@/lib/core/database";
import { ProductsGrid } from "./products-grid";
import { ProductFilterSidebar } from "./products-filter-sidebar";
import { getVariantTemplatesByStoreProducts } from "@/lib/actions/variant-templates.actions";
import { cache } from "react";

interface ProductsGridWrapperProps {
    storeId: string;
    filters: {
        category?: string;
        productType?: string;
        search?: string;
        minPrice?: string;
        maxPrice?: string;
        sortBy?: string;
    };
}

// Cached data fetching
const getCachedProducts = cache(async (storeId: string, options: QueryOptions) => {
    return await getVirtualStoreProducts(storeId, options);
});

const getCachedVariantTemplates = cache(async (storeId: string) => {
    return await getVariantTemplatesByStoreProducts(storeId);
});

function buildQueryFilters(filters: ProductsGridWrapperProps["filters"]): QueryFilter[] {
    const queryFilters: QueryFilter[] = [];

    if (filters.category) {
        queryFilters.push({
            field: "categoryId",
            operator: "equal",
            value: filters.category,
        });
    }

    if (filters.productType) {
        queryFilters.push({
            field: "productTypeId",
            operator: "equal",
            value: filters.productType,
        });
    }

    if (filters.minPrice) {
        queryFilters.push({
            field: "basePrice",
            operator: "greaterThanEqual",
            value: parseInt(filters.minPrice),
        });
    }

    if (filters.maxPrice) {
        queryFilters.push({
            field: "basePrice",
            operator: "lessThanEqual",
            value: parseInt(filters.maxPrice),
        });
    }

    return queryFilters;
}

function getSortOptions(sortBy?: string): { orderBy: string; orderType: "asc" | "desc" } {
    switch (sortBy) {
        case "price_asc":
            return { orderBy: "basePrice", orderType: "asc" };
        case "price_desc":
            return { orderBy: "basePrice", orderType: "desc" };
        case "newest":
            return { orderBy: "$createdAt", orderType: "desc" };
        case "popular":
            return { orderBy: "popularity", orderType: "desc" };
        case "rating":
            return { orderBy: "rating", orderType: "desc" };
        default:
            return { orderBy: "$createdAt", orderType: "desc" };
    }
}

export async function ProductsGridWrapper({ storeId, filters }: ProductsGridWrapperProps) {
    const queryFilters = buildQueryFilters(filters);
    const { orderBy, orderType } = getSortOptions(filters.sortBy);

    // Fetch initial products (first page)
    const queryOptions: QueryOptions = {
        limit: 20,
        offset: 0,
        filters: queryFilters,
        orderBy,
        orderType,
    };

    // Parallel data fetching
    const [productsResult, variantTemplatesResult] = await Promise.all([
        getCachedProducts(storeId, queryOptions),
        getCachedVariantTemplates(storeId),
    ]);

    // Transform variant templates into filter groups
    // Group templates by their "group" property for better organization
    const filterGroups: Record<string, any[]> = {};
    
    if (variantTemplatesResult?.documents) {
        variantTemplatesResult.documents.forEach((template) => {
            const groupName = template.group || "Other Options";
            
            if (!filterGroups[groupName]) {
                filterGroups[groupName] = [];
            }
            
            // Transform template to match the expected filter structure
            filterGroups[groupName].push({
                id: template.$id,
                name: template.variantTemplateName,
                description: template.description,
                inputType: template.inputType,
                isRequired: template.isRequired,
                sortOrder: template.sortOrder,
                variantOptions: template.variantOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                    colorCode: option.colorCode,
                    additionalPrice: option.additionalPrice,
                    metadata: { count: 0 }, // Can be calculated if needed
                })),
            });
        });
    }

    // Calculate min/max prices from products for slider
    let minProductPrice = 0;
    let maxProductPrice = 10000;

    if (productsResult.documents && productsResult.documents.length > 0) {
        const prices = productsResult.documents.map((p) => p.basePrice || 0);
        minProductPrice = Math.floor(Math.min(...prices));
        maxProductPrice = Math.ceil(Math.max(...prices));
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex gap-6">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-80 flex-shrink-0">
                    <ProductFilterSidebar
                        storeId={storeId}
                        filterGroups={filterGroups}
                        minPrice={minProductPrice}
                        maxPrice={maxProductPrice}
                        initialMinPrice={filters.minPrice ? parseInt(filters.minPrice) : undefined}
                        initialMaxPrice={filters.maxPrice ? parseInt(filters.maxPrice) : undefined}
                    />
                </aside>

                {/* Products Grid */}
                <div className="flex-1 min-w-0">
                    <ProductsGrid
                        storeId={storeId}
                        initialProducts={productsResult.documents}
                        initialHasMore={productsResult.hasMore}
                        totalCount={productsResult.total}
                        filters={filters}
                        filterGroups={filterGroups}
                        minPrice={minProductPrice}
                        maxPrice={maxProductPrice}
                    />
                </div>
            </div>
        </div>
    );
}