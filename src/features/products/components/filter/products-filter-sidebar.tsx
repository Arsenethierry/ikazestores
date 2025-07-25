"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Palette, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FilterState {
    priceRange: [number, number];
    selectedVariants: Record<string, string[]>;
    searchTerm: string;
}

interface ProductFilterSidebarProps {
    storeId?: string;
    filterGroups: Record<string, any[]>;
    minPrice?: number;
    maxPrice?: number;
    onFiltersChange?: (filters: Partial<FilterState>) => void;
    productCount?: number;
    loading?: boolean;
    className?: string;
}

export const ProductFilterSidebar = ({
    filterGroups,
    minPrice = 0,
    maxPrice = 10000,
    onFiltersChange,
    productCount = 0,
    loading = false,
    className,
}: ProductFilterSidebarProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Initialize filter state from URL parameters
    const initialState = useMemo((): FilterState => {
        const state: FilterState = {
            priceRange: [
                Math.max(minPrice, parseInt(searchParams.get("minPrice") || minPrice.toString())),
                Math.min(maxPrice, parseInt(searchParams.get("maxPrice") || maxPrice.toString())),
            ],
            selectedVariants: {},
            searchTerm: searchParams.get("search") || "",
        };

        // Parse variant filters from URL
        searchParams.forEach((value, key) => {
            if (key.startsWith("variant_")) {
                const variantId = key.replace("variant_", "");
                state.selectedVariants[variantId] = value.split(",");
            }
        });

        return state;
    }, [searchParams, minPrice, maxPrice]);

    const [filterState, setFilterState] = useState<FilterState>(initialState);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(["Brand", "Price", "Color"])
    );
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
    const [showMore, setShowMore] = useState<Record<string, boolean>>({});

    // Update URL with new filters
    const updateFilters = useCallback(
        (newState: Partial<FilterState>) => {
            startTransition(() => {
                const params = new URLSearchParams(searchParams);

                // Update price range
                if (newState.priceRange) {
                    if (newState.priceRange[0] > minPrice) {
                        params.set("minPrice", newState.priceRange[0].toString());
                    } else {
                        params.delete("minPrice");
                    }

                    if (newState.priceRange[1] < maxPrice) {
                        params.set("maxPrice", newState.priceRange[1].toString());
                    } else {
                        params.delete("maxPrice");
                    }
                }

                // Update variant filters
                if (newState.selectedVariants) {
                    Array.from(params.keys()).forEach((key) => {
                        if (key.startsWith("variant_")) {
                            params.delete(key);
                        }
                    });

                    Object.entries(newState.selectedVariants).forEach(([variantId, values]) => {
                        if (values.length > 0) {
                            params.set(`variant_${variantId}`, values.join(","));
                        }
                    });
                }

                // Update search term
                if (newState.searchTerm !== undefined) {
                    if (newState.searchTerm) {
                        params.set("search", newState.searchTerm);
                    } else {
                        params.delete("search");
                    }
                }

                // Reset page when filters change
                params.delete("page");

                router.push(`?${params.toString()}`, { scroll: false });
                onFiltersChange?.(newState);
            });
        },
        [searchParams, router, onFiltersChange, minPrice, maxPrice]
    );

    // Handle price range change
    const handlePriceChange = useCallback(
        (value: number[]) => {
            const newState = { ...filterState, priceRange: value as [number, number] };
            setFilterState(newState);
            updateFilters({ priceRange: value as [number, number] });
        },
        [filterState, updateFilters]
    );

    // Handle variant selection change
    const handleVariantChange = useCallback(
        (variantId: string, value: string, checked: boolean) => {
            const currentValues = filterState.selectedVariants[variantId] || [];
            const newValues = checked
                ? [...currentValues, value]
                : currentValues.filter((v) => v !== value);

            const newSelectedVariants = {
                ...filterState.selectedVariants,
                [variantId]: newValues,
            };

            if (newValues.length === 0) {
                delete newSelectedVariants[variantId];
            }

            const newState = { ...filterState, selectedVariants: newSelectedVariants };
            setFilterState(newState);
            updateFilters({ selectedVariants: newSelectedVariants });
        },
        [filterState, updateFilters]
    );

    // Handle search term change
    const handleSearchChange = useCallback(
        (value: string) => {
            const newState = { ...filterState, searchTerm: value };
            setFilterState(newState);
            updateFilters({ searchTerm: value });
        },
        [filterState, updateFilters]
    );

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        const clearedState: FilterState = {
            priceRange: [minPrice, maxPrice],
            selectedVariants: {},
            searchTerm: "",
        };
        setFilterState(clearedState);
        setSearchTerms({});
        router.push(window.location.pathname, { scroll: false });
    }, [router, minPrice, maxPrice]);

    const clearFilterGroup = useCallback(
        (groupName: string) => {
            const groupTemplates = filterGroups[groupName] || [];
            const newSelectedVariants = { ...filterState.selectedVariants };

            groupTemplates.forEach((template) => {
                delete newSelectedVariants[template.id];
            });

            const newState = { ...filterState, selectedVariants: newSelectedVariants };
            setFilterState(newState);
            updateFilters({ selectedVariants: newSelectedVariants });
        },
        [filterState, filterGroups, updateFilters]
    );

    const toggleGroup = useCallback((groupName: string) => {
        setExpandedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) {
                newSet.delete(groupName);
            } else {
                newSet.add(groupName);
            }
            return newSet;
        });
    }, []);

    // Filter options based on search term
    const getFilteredOptions = useCallback(
        (template: any, searchTerm: string) => {
            if (!searchTerm || !template.variantOptions) return template.variantOptions;

            return template.variantOptions.filter(
                (option: any) =>
                    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    option.value.toLowerCase().includes(searchTerm.toLowerCase())
            );
        },
        []
    );

    // Render color option
    const renderColorOption = useCallback(
        (
            option: any["variantOptions"][number],
            isSelected: boolean,
            onChange: () => void,
        ) => (
            <div
                key={option.value}
                className={cn(
                    "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected && "bg-muted"
                )}
                onClick={onChange}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Select ${option.label}`}
            >
                <div className="flex items-center space-x-2 flex-1">
                    {option.colorCode ? (
                        <div
                            className="w-4 h-4 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: option.colorCode }}
                        />
                    ) : (
                        <Palette className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{option.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {option.metadata?.count || 0}
                </Badge>
            </div>
        ),
        []
    );

    // Render standard checkbox option
    const renderCheckboxOption = useCallback(
        (
            option: any["variantOptions"][number],
            isSelected: boolean,
            onChange: () => void,
            templateId: string
        ) => (
            <div key={option.value} className="flex items-center space-x-2 py-1">
                <Checkbox
                    id={`${templateId}-${option.value}`}
                    checked={isSelected}
                    onCheckedChange={onChange}
                    aria-label={`Select ${option.label}`}
                />
                <label
                    htmlFor={`${templateId}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                >
                    <div className="flex justify-between items-center">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                            {option.metadata?.count || 0}
                        </Badge>
                    </div>
                </label>
            </div>
        ),
        []
    );

    // Render range slider
    const renderRangeFilter = useCallback(
        (template: any) => {
            const currentValue = filterState.selectedVariants[template.id]?.[0]
                ? parseInt(filterState.selectedVariants[template.id][0])
                : template.minValue || 0;

            return (
                <div className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                            {template.minValue || 0}
                            {template.unit || ""}
                        </span>
                        <span>
                            {template.maxValue || 100}
                            {template.unit || ""}
                        </span>
                    </div>
                    <Slider
                        min={template.minValue || 0}
                        max={template.maxValue || 100}
                        step={template.step || 1}
                        value={[currentValue]}
                        onValueChange={(value) => {
                            const newSelectedVariants = {
                                ...filterState.selectedVariants,
                                [template.id]: value.map((v) => v.toString()),
                            };
                            setFilterState({ ...filterState, selectedVariants: newSelectedVariants });
                            updateFilters({ selectedVariants: newSelectedVariants });
                        }}
                        className="w-full"
                    />
                    <div className="flex justify-center">
                        <Badge variant="outline">
                            {currentValue}
                            {template.unit || ""}
                        </Badge>
                    </div>
                </div>
            );
        },
        [filterState, updateFilters]
    );

    // Get active filter count for a group
    const getActiveFilterCount = useCallback(
        (groupName: string) => {
            const groupTemplates = filterGroups[groupName] || [];
            return groupTemplates.reduce((count, template) => {
                const selectedValues = filterState.selectedVariants[template.id];
                return count + (selectedValues?.length || 0);
            }, 0);
        },
        [filterGroups, filterState.selectedVariants]
    );

    const totalActiveFilters = useMemo(() => {
        return (
            Object.values(filterState.selectedVariants).reduce(
                (total, values) => total + values.length,
                0
            ) +
            (filterState.priceRange[0] > minPrice || filterState.priceRange[1] < maxPrice ? 1 : 0) +
            (filterState.searchTerm ? 1 : 0)
        );
    }, [filterState, minPrice, maxPrice]);

    if (loading) {
        return (
            <Card className={cn("sticky top-6", className)}>
                <CardHeader>
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`loading-${i}`} className="space-y-2">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="space-y-1">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={`loading-option-${j}`} className="h-3 bg-muted rounded w-full"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("sticky top-6", className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                        Filters
                        {totalActiveFilters > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {totalActiveFilters}
                            </Badge>
                        )}
                    </CardTitle>
                    {totalActiveFilters > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            disabled={isPending}
                            className="text-xs"
                            aria-label="Clear all filters"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
                {productCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {productCount.toLocaleString()} products found
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Search Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Search Products</Label>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            placeholder="Search..."
                            value={filterState.searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10"
                            aria-label="Search products"
                        />
                        {filterState.searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => handleSearchChange("")}
                                aria-label="Clear search"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Price Range</Label>
                        {(filterState.priceRange[0] > minPrice || filterState.priceRange[1] < maxPrice) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePriceChange([minPrice, maxPrice])}
                                className="text-xs h-6 px-2"
                                aria-label="Reset price range"
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Slider
                            min={minPrice}
                            max={maxPrice}
                            step={10}
                            value={filterState.priceRange}
                            onValueChange={handlePriceChange}
                            className="w-full"
                            aria-label={`Price range from ${filterState.priceRange[0]} to ${filterState.priceRange[1]}`}
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    value={filterState.priceRange[0]}
                                    onChange={(e) => {
                                        const value = Math.max(minPrice, parseInt(e.target.value) || minPrice);
                                        handlePriceChange([value, filterState.priceRange[1]]);
                                    }}
                                    className="w-20 h-8 text-xs"
                                    min={minPrice}
                                    max={filterState.priceRange[1]}
                                    aria-label="Minimum price"
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <Input
                                    type="number"
                                    value={filterState.priceRange[1]}
                                    onChange={(e) => {
                                        const value = Math.min(maxPrice, parseInt(e.target.value) || maxPrice);
                                        handlePriceChange([filterState.priceRange[0], value]);
                                    }}
                                    className="w-20 h-8 text-xs"
                                    min={filterState.priceRange[0]}
                                    max={maxPrice}
                                    aria-label="Maximum price"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${minPrice.toLocaleString()}</span>
                            <span>${maxPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Dynamic Filter Groups */}
                <Accordion
                    type="multiple"
                    value={Array.from(expandedGroups)}
                    className="space-y-2"
                    onValueChange={(values) => setExpandedGroups(new Set(values))}
                >
                    {Object.entries(filterGroups).map(([groupName, templates]) => {
                        const activeCount = getActiveFilterCount(groupName);

                        return (
                            <AccordionItem key={groupName} value={groupName} className="border rounded-lg">
                                <AccordionTrigger
                                    className="px-4 py-3 hover:no-underline"
                                    onClick={() => toggleGroup(groupName)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-sm">{groupName}</span>
                                            {activeCount > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {activeCount}
                                                </Badge>
                                            )}
                                        </div>
                                        {activeCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearFilterGroup(groupName);
                                                }}
                                                className="text-xs h-6 px-2 mr-2"
                                                aria-label={`Clear ${groupName} filters`}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="px-4 pb-4">
                                    <div className="space-y-4">
                                        {templates.map((template, index) => {
                                            const selectedValues = filterState.selectedVariants[template.id] || [];
                                            const filteredOptions = getFilteredOptions(
                                                template,
                                                searchTerms[template.id] || ""
                                            );
                                            const showAll = showMore[template.id] || false;

                                            return (
                                                <div key={index} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">{template.name}</Label>
                                                        {selectedValues.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {selectedValues.length}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {(template.variantOptions?.length || 0) > 5 && (
                                                        <div className="relative">
                                                            <Search
                                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground"
                                                                aria-hidden="true"
                                                            />
                                                            <Input
                                                                placeholder={`Search ${template.name.toLowerCase()}...`}
                                                                value={searchTerms[template.id] || ""}
                                                                onChange={(e) =>
                                                                    setSearchTerms({
                                                                        ...searchTerms,
                                                                        [template.id]: e.target.value,
                                                                    })
                                                                }
                                                                className="pl-8 h-8 text-xs"
                                                                aria-label={`Search ${template.name} options`}
                                                            />
                                                        </div>
                                                    )}

                                                    {(template.type === "range" || template.type === "number") ? (
                                                        template.variantOptions?.length ? (
                                                            renderRangeFilter(template)
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground">
                                                                No range options available
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                                            {filteredOptions
                                                                .slice(0, showAll ? filteredOptions.length : 20)
                                                                .map((option: any) => {
                                                                    const isSelected = selectedValues.includes(option.value);
                                                                    const onChange = () =>
                                                                        handleVariantChange(template.id, option.value, !isSelected);

                                                                    return (
                                                                        <div key={option.value}>
                                                                            {template.type === "color" || groupName === "Color"
                                                                                ? renderColorOption(option, isSelected, onChange)
                                                                                : renderCheckboxOption(option, isSelected, onChange, template.id)}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    )}

                                                    {(template.variantOptions?.length || 0) > 20 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-xs"
                                                            onClick={() =>
                                                                setShowMore((prev) => ({
                                                                    ...prev,
                                                                    [template.id]: !prev[template.id],
                                                                }))
                                                            }
                                                            aria-label={showAll ? `Show fewer ${template.name} options` : `Show more ${template.name} options`}
                                                        >
                                                            {showAll
                                                                ? "Show fewer options"
                                                                : `Show ${(template.variantOptions?.length || 0) - 20} more options`}
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>

                {Object.keys(filterGroups).length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                        <Label className="text-sm font-medium">Popular Filters</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handlePriceChange([minPrice, 50])}
                                aria-label="Filter under $50"
                            >
                                Under $50
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7" aria-label="Filter free shipping">
                                Free Shipping
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7" aria-label="Filter top rated">
                                Top Rated
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};