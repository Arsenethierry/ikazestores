"use client";

import { FilterState, VirtualProductTypes } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductFilterSidebar } from "./products-filter-sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "react-use";
import { ArrowUpDown, Filter, Grid3X3, List, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualProductCard } from "../product-cards/virtual-product-card";
import { VariantTemplate } from "@/lib/types/catalog-types";
import { getVariantTemplates } from "@/features/variants management/ecommerce-catalog";

interface SortOption {
    value: string;
    label: string;
    description?: string;
}
interface ProductListWithFiltersProps {
    storeId?: string;
    productType?: string;
    category?: string;
    initialProducts?: VirtualProductTypes[];
    className?: string;
}

type ViewMode = "grid" | "list";

const VIEW_MODES = [
    { value: "grid", icon: Grid3X3, label: "Grid View" },
    { value: "list", icon: List, label: "List View" },
] as const;

const SORT_OPTIONS: SortOption[] = [
    { value: "newest", label: "Newest First", description: "Recently added products" },
    { value: "price_asc", label: "Price: Low to High", description: "Cheapest first" },
    { value: "price_desc", label: "Price: High to Low", description: "Most expensive first" },
    { value: "popular", label: "Most Popular", description: "Based on views and purchases" },
    { value: "rating", label: "Highest Rated", description: "Best customer reviews" },
    { value: "discount", label: "Best Deals", description: "Highest discounts" },
];

const MemoizedProductCard = React.memo(
    ({ product, viewMode }: { product: VirtualProductTypes; viewMode: ViewMode }) => (
        <VirtualProductCard key={product.$id} product={product} viewMode={viewMode} />
    )
);

MemoizedProductCard.displayName = "MemoizedProductCard";

export const ProductListWithFilters = ({
    storeId,
    productType,
    category,
    initialProducts = [],
    className,
}: ProductListWithFiltersProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [filtersApplied, setFiltersApplied] = useState<boolean | undefined>(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allProducts, setAllProducts] = useState<VirtualProductTypes[]>(initialProducts);
    const [hasNextPage, setHasNextPage] = useState(true);
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
        rootMargin: '100px'
    });
    const [debouncedFilters, setDebouncedFilters] = useState<FilterState | null>(null);

    const currentFilters = useMemo((): FilterState => {
        const filters: FilterState = {
            storeId,
            productType,
            category,
            page: 1,
            limit: 20,
            sortBy: searchParams.get("sortBy") || "newest",
            variants: [],
            priceRange: {},
            search: searchParams.get("search") || "",
        };

        searchParams.forEach((value, key) => {
            if (key.startsWith("variant_")) {
                const variantId = key.replace("variant_", "");
                filters.variants!.push({
                    templateId: variantId,
                    values: value.split(","),
                });
            }
        });

        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        if (minPrice) filters.priceRange!.min = parseFloat(minPrice);
        if (maxPrice) filters.priceRange!.max = parseFloat(maxPrice);

        return filters;
    }, [searchParams, storeId, productType, category]);

    useDebounce(
        () => {
            setDebouncedFilters(currentFilters);
        },
        300,
        [currentFilters]
    );

    const filterProductsLocally = useCallback(
        (filters: FilterState, products: VirtualProductTypes[]): VirtualProductTypes[] => {
            let filteredProducts = [...products];

            if (filters.category) {
                filteredProducts = filteredProducts.filter(
                    (product) => product.categoryId === filters.category
                );
            }

            if (filters.productType) {
                filteredProducts = filteredProducts.filter(
                    (product) => product.productTypeId === filters.productType
                );
            }

            if (filters.priceRange?.min || filters.priceRange?.max) {
                filteredProducts = filteredProducts.filter((product) => {
                    const price = product.price || 0;
                    const min = filters.priceRange?.min ?? 0;
                    const max = filters.priceRange?.max ?? Infinity;
                    return price >= min && price <= max;
                });
            }

            if (filters.variants && filters.variants.length > 0) {
                filteredProducts = filteredProducts.filter((product) => {
                    return filters.variants!.every((variantFilter) => {
                        const variant = product.variants?.find(
                            (v: any) => v.id === variantFilter.templateId
                        );
                        if (!variant) return false;
                        return variantFilter.values.some((value) =>
                            variant.values.some((v: any) => v.value === value)
                        );
                    });
                });
            }

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredProducts = filteredProducts.filter(
                    (product) =>
                        product.name.toLowerCase().includes(searchLower) ||
                        product.tags?.some((tag: any) => tag.toLowerCase().includes(searchLower))
                );
            }

            switch (filters.sortBy) {
                case "price_asc":
                    filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                case "price_desc":
                    filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
                case "name":
                    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case "newest":
                    filteredProducts.sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    break;
                case "popular":
                    filteredProducts.sort(
                        (a, b) => (b.popularity || 0) - (a.popularity || 0)
                    );
                    break;
                case "rating":
                    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case "discount":
                    filteredProducts.sort(
                        (a, b) => (b.discount || 0) - (a.discount || 0)
                    );
                    break;
            }

            return filteredProducts;
        },
        []
    );

    const filterGroups = useMemo(() => {
        const variants = getVariantTemplates();
        const grouped: Record<string, VariantTemplate[]> = {};

        variants.forEach((variant) => {
            const groupName = variant.group || "Other";
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            grouped[groupName].push({
                id: variant.id,
                name: variant.name,
                inputType: variant.inputType as "text" | "color" | "range" | "number" | "select",
                variantOptions: variant.variantOptions.map((v) => ({
                    value: v.value,
                    label: v.label || v.value,
                    metadata: { count: 0 },
                })),
                minValue: variant.minValue,
                maxValue: variant.maxValue,
                step: variant.step,
                unit: variant.unit,
            });
        });

        return grouped;
    }, []);

    // const filteredProducts = useMemo(() => {
    //     if (!debouncedFilters) return initialProducts;
    //     const filtered = filterProductsLocally(debouncedFilters, initialProducts);
    //     const start = (debouncedFilters.page - 1) * debouncedFilters.limit;
    //     const end = start + debouncedFilters.limit;
    //     return filtered.slice(0, end);
    // }, [debouncedFilters, initialProducts, filterProductsLocally]);

    const loadMoreProducts = useCallback(async () => {
        if (!hasNextPage || isLoadingMore || !debouncedFilters) return;

        setIsLoadingMore(true);
        try {
            const nextPage = debouncedFilters.page + 1;
            const updatedFilters = { ...debouncedFilters, page: nextPage };
            const filtered = filterProductsLocally(updatedFilters, initialProducts);
            setAllProducts(filtered.slice(0, nextPage * updatedFilters.limit));
            setHasNextPage(filtered.length > nextPage * updatedFilters.limit);
            setDebouncedFilters(updatedFilters);
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasNextPage, isLoadingMore, debouncedFilters, initialProducts, filterProductsLocally]);

    useEffect(() => {
        if (inView && hasNextPage && !isLoadingMore) {
            loadMoreProducts();
        }
    }, [inView, hasNextPage, isLoadingMore, loadMoreProducts]);

    useEffect(() => {
        const hasVariants = (currentFilters.variants?.length ?? 0) > 0;
        const hasPriceRange =
            currentFilters.priceRange?.min !== undefined ||
            currentFilters.priceRange?.max !== undefined;
        const hasSearch = (currentFilters.search?.length ?? 0) > 0;
        setFiltersApplied(hasVariants || hasPriceRange || hasSearch);
    }, [currentFilters]);

    const handleFiltersChange = useCallback(
        (filters: any) => {
            setMobileFilterOpen(false);
            console.log("handleFiltersChange", filters)
        },
        []
    );

    const handleSortChange = useCallback(
        (sortValue: string) => {
            startTransition(() => {
                const params = new URLSearchParams(searchParams);
                params.set("sortBy", sortValue);
                router.push(`?${params.toString()}`, { scroll: false });
            });
        },
        [searchParams, router]
    );

    const handleViewModeChange = useCallback(
        (mode: ViewMode) => {
            setViewMode(mode);
            localStorage.setItem("productViewMode", mode);
        },
        []
    );

    const clearAllFilters = useCallback(() => {
        startTransition(() => {
            router.push(window.location.pathname, { scroll: false });
        });
    }, [router]);

    const clearSpecificFilter = useCallback(
        (filterType: string, filterValue?: string) => {
            startTransition(() => {
                const params = new URLSearchParams(searchParams);

                if (filterType === "price") {
                    params.delete("minPrice");
                    params.delete("maxPrice");
                } else if (filterType === "search") {
                    params.delete("search");
                } else if (filterType.startsWith("variant_")) {
                    if (filterValue) {
                        const currentValues = params.get(filterType)?.split(",") || [];
                        const newValues = currentValues.filter((v) => v !== filterValue);
                        if (newValues.length > 0) {
                            params.set(filterType, newValues.join(","));
                        } else {
                            params.delete(filterType);
                        }
                    } else {
                        params.delete(filterType);
                    }
                }

                router.push(`?${params.toString()}`, { scroll: false });
            })
        },
        [searchParams, router]
    );

    useEffect(() => {
        const savedViewMode = localStorage.getItem("productViewMode") as ViewMode;
        if (savedViewMode && VIEW_MODES.some((mode) => mode.value === savedViewMode)) {
            setViewMode(savedViewMode);
        }
    }, []);

    useEffect(() => {
        if (hasNextPage) {
            const nextPage = debouncedFilters ? debouncedFilters.page + 1 : 2;
            const prefetchFilters = { ...debouncedFilters, page: nextPage, limit: debouncedFilters?.limit ?? 20 };
            queryClient.prefetchQuery({
                queryKey: ["filteredProducts", prefetchFilters],
                queryFn: () => Promise.resolve({
                    data: {
                        products: filterProductsLocally(prefetchFilters, initialProducts),
                        currentPage: nextPage,
                        totalPages: Math.ceil(initialProducts.length / prefetchFilters.limit),
                        total: initialProducts.length,
                    },
                }),
                staleTime: 5 * 60 * 1000,
            });
        }
    }, [debouncedFilters, hasNextPage, initialProducts, queryClient, filterProductsLocally]);

    const renderProductSkeleton = useCallback(() => {
        const skeletonCount = viewMode === "grid" ? 12 : 6;
        return (
            <div
                className={
                    viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-4"
                }
            >
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <Card key={i} className={viewMode === "list" ? "p-4" : ""}>
                        <div className={viewMode === "list" ? "flex gap-4" : "space-y-4"}>
                            <Skeleton
                                className={viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "w-full h-48"}
                            />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-6 w-1/4" />
                                {viewMode === "list" && (
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

    const renderEmptyState = useCallback(
        () => (
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
                                : "No products are available at the moment"}
                        </p>
                    </div>
                    {filtersApplied && (
                        <Button variant="outline" onClick={clearAllFilters}>
                            Clear all filters
                        </Button>
                    )}
                </div>
            </Card>
        ),
        [filtersApplied, clearAllFilters]
    );

    const renderActiveFilters = useCallback(() => {
        const activeFilters: Array<{ key: string; label: string; value?: string }> = [];

        if (currentFilters.priceRange?.min || currentFilters.priceRange?.max) {
            const priceLabel =
                currentFilters.priceRange.min && currentFilters.priceRange.max
                    ? `$${currentFilters.priceRange.min} - $${currentFilters.priceRange.max}`
                    : currentFilters.priceRange.min
                        ? `From $${currentFilters.priceRange.min}`
                        : `Up to $${currentFilters.priceRange.max}`;
            activeFilters.push({ key: "price", label: priceLabel });
        }

        if (currentFilters.search) {
            activeFilters.push({ key: "search", label: `Search: "${currentFilters.search}"` });
        }

        currentFilters.variants?.forEach((variant) => {
            const template = Object.values(filterGroups)
                .flat()
                .find((t) => t.id === variant.templateId);
            if (template) {
                variant.values?.forEach((value) => {
                    const option = template.variantOptions?.find((o) => o.value === value);
                    activeFilters.push({
                        key: `variant_${variant.templateId}`,
                        label: `${template.name}: ${option?.label || value}`,
                        value,
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
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
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
        )
    }, [currentFilters, filterGroups, clearAllFilters, clearSpecificFilter]);

    return (
        <div className={cn("container mx-auto py-6", className)}>
            <div className="flex gap-6">
                <aside className="hidden lg:block w-80 flex-shrink-0">
                    <ProductFilterSidebar
                        storeId={storeId}
                        filterGroups={filterGroups}
                        minPrice={0}
                        maxPrice={10000}
                        onFiltersChange={handleFiltersChange}
                        productCount={allProducts.length}
                        loading={false}
                    />
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
                                        <ProductFilterSidebar
                                            storeId={storeId}
                                            filterGroups={filterGroups}
                                            minPrice={0}
                                            maxPrice={10000}
                                            onFiltersChange={handleFiltersChange}
                                            productCount={allProducts.length}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div className="text-sm text-muted-foreground">
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </div>
                                ) : (
                                    `${allProducts.length} products found`
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
                                            variant={viewMode === mode.value ? "primary" : "ghost"}
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

                    {initialProducts.length === 0 && !filtersApplied ? (
                        renderEmptyState()
                    ) : isPending && allProducts.length === 0 ? (
                        renderProductSkeleton()
                    ) : allProducts.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <>
                            <div
                                className={
                                    viewMode === "grid"
                                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                        : "space-y-4"
                                }
                            >
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
    )
}