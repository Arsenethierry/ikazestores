/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { filterProductsByVariants, getFilterableVariants } from "./variants-mngnt-actions";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFilterSidebar } from "./products-filter-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowUpDown, Filter, Grid3X3, List, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualProductCard } from "../product-cards/virtual-product-card";
import { useRouter, useSearchParams } from "next/navigation";
import { VirtualProductTypes } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "react-use";
import { cn } from "@/lib/utils";

interface ProductListWithFiltersProps {
    storeId?: string;
    productType?: string;
    category?: string;
    initialProducts?: VirtualProductTypes[];
    className?: string;
}

interface SortOption {
    value: string;
    label: string;
    description?: string;
}

const SORT_OPTIONS: SortOption[] = [
    { value: 'newest', label: 'Newest First', description: 'Recently added products' },
    { value: 'price_asc', label: 'Price: Low to High', description: 'Cheapest first' },
    { value: 'price_desc', label: 'Price: High to Low', description: 'Most expensive first' },
    { value: 'popular', label: 'Most Popular', description: 'Based on views and purchases' },
    { value: 'rating', label: 'Highest Rated', description: 'Best customer reviews' },
    { value: 'discount', label: 'Best Deals', description: 'Highest discounts' }
];

const VIEW_MODES = [
    { value: 'grid', icon: Grid3X3, label: 'Grid View' },
    { value: 'list', icon: List, label: 'List View' }
] as const;

type ViewMode = 'grid' | 'list';

const MemoizedProductCard = React.memo(({ product, viewMode }: { 
    product: VirtualProductTypes; 
    viewMode: ViewMode;
}) => (
    <VirtualProductCard
        key={product.$id}
        product={product}
        viewMode={viewMode}
    />
));

MemoizedProductCard.displayName = 'MemoizedProductCard';

export const ProductListWithFilters = ({
    storeId,
    productType,
    category,
    className
}: ProductListWithFiltersProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    
    const [isPending, startTransition] = useTransition();
    
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [filtersApplied, setFiltersApplied] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allProducts, setAllProducts] = useState<VirtualProductTypes[]>([]);
    const [hasNextPage, setHasNextPage] = useState(true);
    
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
        rootMargin: '100px'
    });

    const [debouncedFilters, setDebouncedFilters] = useState<any>(null);
    
    const currentFilters = useMemo(() => {
        const filters = {
            storeId,
            productType,
            category,
            page: 1,
            limit: 20,
            sortBy: searchParams.get('sortBy') || 'newest',
            variants: [] as any[],
            priceRange: {} as any,
            search: searchParams.get('search') || ''
        };

        searchParams.forEach((value, key) => {
            if (key.startsWith('variant_')) {
                const variantId = key.replace('variant_', '');
                filters.variants.push({
                    templateId: variantId,
                    values: value.split(',')
                });
            }
        });

        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice) filters.priceRange.min = parseFloat(minPrice);
        if (maxPrice) filters.priceRange.max = parseFloat(maxPrice);

        return filters;
    }, [searchParams, storeId, productType, category]);

    useDebounce(
        () => {
            setDebouncedFilters(currentFilters);
        },
        300,
        [currentFilters]
    );

    const {
        data: filterData,
        isLoading: filtersLoading,
        error: filtersError
    } = useQuery({
        queryKey: ['filterableVariants', storeId, productType],
        queryFn: () => getFilterableVariants(storeId),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });


    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError,
        refetch: refetchProducts
    } = useQuery({
        queryKey: ['filteredProducts', debouncedFilters],
        queryFn: async () => {
            if (!debouncedFilters) return null;
            const result = await filterProductsByVariants(debouncedFilters);
            return result;
        },
        enabled: !!filterData && !!debouncedFilters,
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const loadMoreProducts = useCallback(async () => {
        if (!hasNextPage || isLoadingMore || !debouncedFilters) return;
        
        setIsLoadingMore(true);
        
        try {
            const nextPage = Math.floor(allProducts.length / 20) + 1;
            const moreFilters = { ...debouncedFilters, page: nextPage };
            const result = await filterProductsByVariants(moreFilters);
            
            if (result?.data?.products?.length) {
                setAllProducts(prev => [...prev, ...result.data.products]);
                setHasNextPage(result.data.currentPage < result.data.totalPages);
            } else {
                setHasNextPage(false);
            }
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, debouncedFilters, allProducts.length]);

    useEffect(() => {
        if (inView && hasNextPage && !isLoadingMore) {
            loadMoreProducts();
        }
    }, [inView, hasNextPage, isLoadingMore, loadMoreProducts]);

    useEffect(() => {
        if (productsData?.data?.products) {
            setAllProducts(productsData.data.products);
            setHasNextPage(productsData.data.currentPage < productsData.data.totalPages);
        }
    }, [productsData]);

    useEffect(() => {
        const hasVariants = currentFilters.variants.length > 0;
        const hasPriceRange = currentFilters.priceRange.min !== undefined || currentFilters.priceRange.max !== undefined;
        const hasSearch = currentFilters.search.length > 0;

        setFiltersApplied(hasVariants || hasPriceRange || hasSearch);
    }, [currentFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        console.log(filters)
        setMobileFilterOpen(false);
        // URL update is handled by the ProductFilterSidebar component
    }, []);

    const handleSortChange = useCallback((sortValue: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            params.set('sortBy', sortValue);
            router.push(`?${params.toString()}`, { scroll: false });
        });
    }, [searchParams, router]);

    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('productViewMode', mode);
    }, []);

    const clearAllFilters = useCallback(() => {
        startTransition(() => {
            router.push(window.location.pathname, { scroll: false });
        });
    }, [router]);

    const clearSpecificFilter = useCallback((filterType: string, filterValue?: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            
            if (filterType === 'price') {
                params.delete('minPrice');
                params.delete('maxPrice');
            } else if (filterType === 'search') {
                params.delete('search');
            } else if (filterType.startsWith('variant_')) {
                if (filterValue) {
                    const currentValues = params.get(filterType)?.split(',') || [];
                    const newValues = currentValues.filter(v => v !== filterValue);
                    if (newValues.length > 0) {
                        params.set(filterType, newValues.join(','));
                    } else {
                        params.delete(filterType);
                    }
                } else {
                    params.delete(filterType);
                }
            }
            
            router.push(`?${params.toString()}`, { scroll: false });
        });
    }, [searchParams, router]);

    useEffect(() => {
        const savedViewMode = localStorage.getItem('productViewMode') as ViewMode;
        if (savedViewMode && VIEW_MODES.some(mode => mode.value === savedViewMode)) {
            setViewMode(savedViewMode);
        }
    }, []);

    useEffect(() => {
        if (productsData?.data && hasNextPage) {
            const nextPage = Math.floor(allProducts.length / 20) + 1;
            const prefetchFilters = { ...debouncedFilters, page: nextPage };
            
            queryClient.prefetchQuery({
                queryKey: ['filteredProducts', prefetchFilters],
                queryFn: () => filterProductsByVariants(prefetchFilters),
                staleTime: 5 * 60 * 1000,
            });
        }
    }, [productsData, hasNextPage, allProducts.length, debouncedFilters, queryClient]);

    const renderProductSkeleton = useCallback(() => {
        const skeletonCount = viewMode === 'grid' ? 12 : 6;

        return (
            <div className={viewMode === 'grid' ?
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' :
                'space-y-4'
            }>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <Card key={i} className={viewMode === 'list' ? 'p-4' : ''}>
                        <div className={viewMode === 'list' ? 'flex gap-4' : 'space-y-4'}>
                            <Skeleton className={viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'w-full h-48'} />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-6 w-1/4" />
                                {viewMode === 'list' && (
                                    <>
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-2/3" />
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }, [viewMode]);

    const renderEmptyState = useCallback(() => (
        <Card className="p-12 text-center">
            <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">No products found</h3>
                    <p className="text-muted-foreground mt-1">
                        {filtersApplied
                            ? "Try adjusting your filters to see more results"
                            : "No products are available at the moment"
                        }
                    </p>
                </div>
                {filtersApplied && (
                    <Button variant="outline" onClick={clearAllFilters}>
                        Clear all filters
                    </Button>
                )}
            </div>
        </Card>
    ), [filtersApplied, clearAllFilters]);

    const renderErrorState = useCallback(() => (
        <Alert variant="destructive">
            <AlertDescription>
                {productsError?.message || "Failed to load products. Please try again."}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchProducts()}
                    className="ml-2"
                >
                    Retry
                </Button>
            </AlertDescription>
        </Alert>
    ), [productsError, refetchProducts]);

    const renderActiveFilters = useCallback(() => {
        const activeFilters: Array<{ key: string; label: string; value?: string }> = [];

        if (currentFilters.priceRange.min || currentFilters.priceRange.max) {
            const priceLabel = currentFilters.priceRange.min && currentFilters.priceRange.max
                ? `$${currentFilters.priceRange.min} - $${currentFilters.priceRange.max}`
                : currentFilters.priceRange.min
                ? `From $${currentFilters.priceRange.min}`
                : `Up to $${currentFilters.priceRange.max}`;
            
            activeFilters.push({ key: 'price', label: priceLabel });
        }

        if (currentFilters.search) {
            activeFilters.push({ key: 'search', label: `Search: "${currentFilters.search}"` });
        }

        currentFilters.variants.forEach((variant: any) => {
            const template = filterData?.groupedVariants && 
                Object.values(filterData.groupedVariants).flat().find((t: any) => t.$id === variant.templateId);
            
            if (template) {
                variant.values?.forEach((value: string) => {
                    activeFilters.push({
                        key: `variant_${variant.templateId}`,
                        label: `${template.name}: ${value}`,
                        value
                    });
                });
            }
        });

        if (activeFilters.length === 0) return null;

        return (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active filters:</span>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear all
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                        >
                            <span className="text-xs">{filter.label}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => clearSpecificFilter(filter.key, filter.value)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                </div>
            </div>
        );
    }, [currentFilters, filterData, clearAllFilters, clearSpecificFilter]);

    return (
        <div className={cn("container mx-auto py-6", className)}>
            <div className="flex gap-6">
                <aside className="hidden lg:block w-80 flex-shrink-0">
                    <div className="sticky top-6">
                        {filtersLoading ? (
                            <Card className="p-4">
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            </Card>
                        ) : filtersError ? (
                            <Card className="p-4">
                                <Alert>
                                    <AlertDescription>
                                        Failed to load filters. Some features may be unavailable.
                                    </AlertDescription>
                                </Alert>
                            </Card>
                        ) : (
                            <ProductFilterSidebar
                                storeId={storeId}
                                filterGroups={filterData?.groupedVariants || {}}
                                minPrice={0}
                                maxPrice={10000}
                                onFiltersChange={handleFiltersChange}
                                productCount={productsData?.data?.total || 0}
                                loading={filtersLoading}
                            />
                        )}
                    </div>
                </aside>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="lg:hidden">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        Filters
                                        {filtersApplied && (
                                            <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                                                Active
                                            </Badge>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80 p-0">
                                    <div className="p-4 border-b">
                                        <h2 className="text-lg font-semibold">Filters</h2>
                                    </div>
                                    <div className="p-4">
                                        {filtersLoading ? (
                                            <div className="space-y-4">
                                                <Skeleton className="h-8 w-full" />
                                                <Skeleton className="h-32 w-full" />
                                            </div>
                                        ) : (
                                            <ProductFilterSidebar
                                                storeId={storeId}
                                                filterGroups={filterData?.groupedVariants || {}}
                                                minPrice={0}
                                                maxPrice={10000}
                                                onFiltersChange={handleFiltersChange}
                                                productCount={productsData?.data?.total || 0}
                                            />
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div className="text-sm text-muted-foreground">
                                {productsLoading || isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </div>
                                ) : (
                                    `${productsData?.data?.total || 0} products found`
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select value={currentFilters.sortBy} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-48">
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div>
                                                <div className="font-medium">{option.label}</div>
                                                {option.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="hidden sm:flex items-center border rounded-md">
                                {VIEW_MODES.map((mode) => {
                                    const Icon = mode.icon;
                                    return (
                                        <Button
                                            key={mode.value}
                                            variant={viewMode === mode.value ? 'primary' : 'ghost'}
                                            size="sm"
                                            className="rounded-none first:rounded-l-md last:rounded-r-md px-3"
                                            onClick={() => handleViewModeChange(mode.value)}
                                            title={mode.label}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {renderActiveFilters()}

                    {productsError ? (
                        renderErrorState()
                    ) : productsLoading ? (
                        renderProductSkeleton()
                    ) : !allProducts || allProducts.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <>
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                                    : 'space-y-4'
                            }>
                                {allProducts.map((product) => (
                                    <MemoizedProductCard
                                        key={product.$id}
                                        product={product}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>

                            {hasNextPage && (
                                <div ref={loadMoreRef} className="mt-8 flex justify-center">
                                    {isLoadingMore ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading more products...
                                        </div>
                                    ) : (
                                        <div className="h-4" />
                                    )}
                                </div>
                            )}

                            {!hasNextPage && allProducts.length > 0 && (
                                <div className="mt-8 text-center text-muted-foreground text-sm">
                                    You&apos;ve reached the end of the results
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};