import React from 'react';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { VirtualProductsSearchParams } from '@/lib/types';
import { NoItemsCard } from '@/components/no-items-card';
import { getVirtualStoreProducts, searchVirtualStoreProducts } from '@/lib/actions/affiliate-product-actions';
import { QueryFilter } from '@/lib/core/database';

interface ProductFilterPageProps {
    params: VirtualProductsSearchParams & {
        storeId: string;
        query?: string;
        category?: string;
        minPrice?: string;
        maxPrice?: string;
        sortBy?: string;
        page?: string;
        limit?: string;
    };
}


async function ProductFilterPage({ params }: ProductFilterPageProps) {
    const {
        storeId,
        query,
        category,
        minPrice,
        maxPrice,
        sortBy,
        page = '1',
        limit = '20'
    } = params;

    // Validate required storeId
    if (!storeId) {
        return (
            <NoItemsCard
                title="Store Required"
                description="Please specify a virtual store to view products"
            />
        );
    }

    try {
        // Build filters
        const filters: QueryFilter[] = [];

        if (category) {
            filters.push({ field: "categoryId", operator: "equal", value: category });
        }

        if (minPrice) {
            filters.push({ field: "basePrice", operator: "greaterThanEqual", value: parseInt(minPrice) });
        }

        if (maxPrice) {
            filters.push({ field: "basePrice", operator: "lessThanEqual", value: parseInt(maxPrice) });
        }

        let products;

        if (query && query.trim() !== '') {
            // Use search when query exists
            products = await searchVirtualStoreProducts(storeId, {
                search: query,
                limit: parseInt(limit),
                page: parseInt(page),
                categoryId: category,
                minPrice: minPrice ? parseInt(minPrice) : undefined,
                maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            });
        } else {
            // Use filtered product retrieval
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const result = await getVirtualStoreProducts(storeId, {
                limit: parseInt(limit),
                offset,
                filters,
                orderBy: getSortField(sortBy),
                orderType: getSortOrder(sortBy)
            });

            // Transform to match expected structure
            products = {
                documents: result.documents,
                total: result.total,
                success: true
            };
        }

        if (!products.success || products.total === 0) {
            const noResultsTitle = query
                ? "No products found"
                : "No products available";

            const noResultsDescription = query
                ? `No results found for "${query}"${category ? ` in selected category` : ''}`
                : "No products match your current filters";

            return (
                <NoItemsCard
                    title={noResultsTitle}
                    description={noResultsDescription}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
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

    } catch (error) {
        console.error('Product filter error:', error);
        return (
            <NoItemsCard
                title="Error Loading Products"
                description="Something went wrong while loading products. Please try again."
            />
        );
    }
}

export default ProductFilterPage;

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