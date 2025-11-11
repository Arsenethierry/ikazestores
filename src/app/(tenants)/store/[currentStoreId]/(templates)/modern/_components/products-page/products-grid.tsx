"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { VirtualProductTypes } from "@/lib/types";
import { VirtualProductCard } from "@/features/products/components/product-cards/virtual-product-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowUpDown, Filter, Grid3X3, List, Loader2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProductFilterSidebar } from "./products-filter-sidebar";
import { loadMoreProductsAction } from "@/lib/actions/affiliate-product-actions";

type ViewMode = "grid" | "list";

const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
];

interface ProductsGridProps {
    storeId: string;
    initialProducts: VirtualProductTypes[];
    initialHasMore: boolean;
    totalCount: number;
    filters: {
        category?: string;
        productType?: string;
        search?: string;
        minPrice?: string;
        maxPrice?: string;
        sortBy?: string;
    };
    filterGroups: Record<string, any[]>;
    minPrice: number;
    maxPrice: number;
}

export function ProductsGrid({
    storeId,
    initialProducts,
    initialHasMore,
    totalCount,
    filters,
    filterGroups,
    minPrice,
    maxPrice,
}: ProductsGridProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // State
    const [products, setProducts] = useState<VirtualProductTypes[]>(initialProducts);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // Infinite scroll trigger
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
        triggerOnce: false,
    });

    // Reset products when filters change
    useEffect(() => {
        setProducts(initialProducts);
        setHasMore(initialHasMore);
        setPage(1);
    }, [initialProducts, initialHasMore]);

    // Load more products when scrolling
    useEffect(() => {
        if (inView && hasMore && !isLoadingMore) {
            loadMoreProducts();
        }
    }, [inView, hasMore, isLoadingMore]);

    const loadMoreProducts = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const result = await loadMoreProductsAction({
                storeId,
                page: nextPage,
                limit: 20,
                filters,
            });

            if (result?.data?.documents) {
                setProducts((prev) => [...prev, ...(result.data?.documents ?? [])]);
                setHasMore(result.data.hasMore);
                setPage(nextPage);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [storeId, page, hasMore, isLoadingMore, filters]);

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sortBy", value);
        startTransition(() => {
            router.push(`?${params.toString()}`, { scroll: false });
        });
    };

    const clearAllFilters = () => {
        startTransition(() => {
            router.push(window.location.pathname, { scroll: false });
        });
    };

    const hasActiveFilters =
        filters.category ||
        filters.productType ||
        filters.search ||
        filters.minPrice ||
        filters.maxPrice;

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Mobile Filter Trigger */}
                    <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="lg:hidden">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                                {hasActiveFilters && (
                                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                        !
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 overflow-y-auto">
                            <ProductFilterSidebar
                                storeId={storeId}
                                filterGroups={filterGroups}
                                minPrice={minPrice}
                                maxPrice={maxPrice}
                                initialMinPrice={filters.minPrice ? parseInt(filters.minPrice) : undefined}
                                initialMaxPrice={filters.maxPrice ? parseInt(filters.maxPrice) : undefined}
                            />
                        </SheetContent>
                    </Sheet>

                    {/* Results Count */}
                    <p className="text-sm text-muted-foreground">
                        {totalCount} {totalCount === 1 ? "product" : "products"} found
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Sort Dropdown */}
                    <Select value={filters.sortBy || "newest"} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-[180px]">
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* View Mode Toggle */}
                    <div className="hidden sm:flex items-center gap-1 border rounded-md p-1">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="h-8 w-8 p-0"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className="h-8 w-8 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {filters.category && (
                        <Badge variant="secondary" className="gap-2">
                            Category: {filters.category}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete("category");
                                    router.push(`?${params.toString()}`, { scroll: false });
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    {filters.search && (
                        <Badge variant="secondary" className="gap-2">
                            Search: {filters.search}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete("search");
                                    router.push(`?${params.toString()}`, { scroll: false });
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                        <Badge variant="secondary" className="gap-2">
                            Price: ${filters.minPrice || "0"} - ${filters.maxPrice || "∞"}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete("minPrice");
                                    params.delete("maxPrice");
                                    router.push(`?${params.toString()}`, { scroll: false });
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs h-7"
                    >
                        Clear all
                    </Button>
                </div>
            )}

            {/* Products Grid */}
            {products.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center space-y-4">
                        <div className="text-6xl">🔍</div>
                        <h3 className="text-xl font-semibold">No products found</h3>
                        <p className="text-muted-foreground">
                            Try adjusting your filters or search query
                        </p>
                        {hasActiveFilters && (
                            <Button onClick={clearAllFilters} variant="outline">
                                Clear all filters
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <>
                    <div
                        className={cn(
                            viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                : "flex flex-col gap-4"
                        )}
                    >
                        {products.map((product) => (
                            <VirtualProductCard
                                key={product.$id}
                                product={product}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>

                    {/* Infinite Scroll Trigger */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                            {isLoadingMore && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Loading more products...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* End Message */}
                    {!hasMore && products.length > 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You've reached the end of the products list</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}