/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Palette, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VariantTemplate } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ProductFilterSidebarProps {
    storeId?: string;
    filterGroups: Record<string, VariantTemplate[]>;
    minPrice?: number;
    maxPrice?: number;
    onFiltersChange?: (filters: any) => void;
    productCount?: number;
    loading?: boolean;
    className?: string;
}

interface FilterState {
    priceRange: [number, number];
    selectedVariants: Record<string, string[]>;
    searchTerm: string;
}

export const ProductFilterSidebar = ({
    // storeId,
    filterGroups,
    minPrice = 0,
    maxPrice = 10000,
    onFiltersChange,
    productCount = 0,
    loading = false,
    className
}: ProductFilterSidebarProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Initialize filter state from URL parameters
    const initialState = useMemo((): FilterState => {
        const state: FilterState = {
            priceRange: [
                parseInt(searchParams.get('minPrice') || minPrice.toString()),
                parseInt(searchParams.get('maxPrice') || maxPrice.toString())
            ],
            selectedVariants: {},
            searchTerm: searchParams.get('search') || ''
        };

        // Parse variant filters from URL
        searchParams.forEach((value, key) => {
            if (key.startsWith('variant_')) {
                const variantId = key.replace('variant_', '');
                state.selectedVariants[variantId] = value.split(',');
            }
        });

        return state;
    }, [searchParams, minPrice, maxPrice]);

    const [filterState, setFilterState] = useState<FilterState>(initialState);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Brand', 'Price', 'Color']));
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

    // Update URL with new filters
    const updateFilters = useCallback((newState: Partial<FilterState>) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams);

            // Update price range
            if (newState.priceRange) {
                if (newState.priceRange[0] > minPrice) {
                    params.set('minPrice', newState.priceRange[0].toString());
                } else {
                    params.delete('minPrice');
                }

                if (newState.priceRange[1] < maxPrice) {
                    params.set('maxPrice', newState.priceRange[1].toString());
                } else {
                    params.delete('maxPrice');
                }
            }

            // Update variant filters
            if (newState.selectedVariants) {
                // Clear existing variant parameters
                Array.from(params.keys()).forEach(key => {
                    if (key.startsWith('variant_')) {
                        params.delete(key);
                    }
                });

                // Set new variant parameters
                Object.entries(newState.selectedVariants).forEach(([variantId, values]) => {
                    if (values.length > 0) {
                        params.set(`variant_${variantId}`, values.join(','));
                    }
                });
            }

            // Update search term
            if (newState.searchTerm !== undefined) {
                if (newState.searchTerm) {
                    params.set('search', newState.searchTerm);
                } else {
                    params.delete('search');
                }
            }

            // Reset page when filters change
            params.delete('page');

            router.push(`?${params.toString()}`, { scroll: false });
            onFiltersChange?.(newState);
        });
    }, [searchParams, router, onFiltersChange, minPrice, maxPrice]);

    // Handle price range change
    const handlePriceChange = useCallback((value: number[]) => {
        const newState = { ...filterState, priceRange: value as [number, number] };
        setFilterState(newState);
        updateFilters({ priceRange: value as [number, number] });
    }, [filterState, updateFilters]);

    // Handle variant selection change
    const handleVariantChange = useCallback((variantId: string, value: string, checked: boolean) => {
        const currentValues = filterState.selectedVariants[variantId] || [];
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(v => v !== value);

        const newSelectedVariants = {
            ...filterState.selectedVariants,
            [variantId]: newValues
        };

        if (newValues.length === 0) {
            delete newSelectedVariants[variantId];
        }

        const newState = { ...filterState, selectedVariants: newSelectedVariants };
        setFilterState(newState);
        updateFilters({ selectedVariants: newSelectedVariants });
    }, [filterState, updateFilters]);

    // Handle search term change
    const handleSearchChange = useCallback((value: string) => {
        const newState = { ...filterState, searchTerm: value };
        setFilterState(newState);
        updateFilters({ searchTerm: value });
    }, [filterState, updateFilters]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        const clearedState: FilterState = {
            priceRange: [minPrice, maxPrice],
            selectedVariants: {},
            searchTerm: ''
        };
        setFilterState(clearedState);
        router.push(window.location.pathname, { scroll: false });
    }, [router, minPrice, maxPrice]);

    // Clear specific filter group
    const clearFilterGroup = useCallback((groupName: string) => {
        const groupTemplates = filterGroups[groupName] || [];
        const newSelectedVariants = { ...filterState.selectedVariants };

        groupTemplates.forEach(template => {
            delete newSelectedVariants[template.$id];
        });

        const newState = { ...filterState, selectedVariants: newSelectedVariants };
        setFilterState(newState);
        updateFilters({ selectedVariants: newSelectedVariants });
    }, [filterState, filterGroups, updateFilters]);

    // Toggle group expansion
    const toggleGroup = useCallback((groupName: string) => {
        setExpandedGroups(prev => {
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
    const getFilteredOptions = useCallback((template: VariantTemplate, searchTerm: string) => {
        if (!searchTerm) return template.variantOptions || [];

        return (template.variantOptions || []).filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, []);

    // Render color option
    const renderColorOption = useCallback((option: any, isSelected: boolean, onChange: () => void) => (
        <div
            key={option.value}
            className={cn(
                "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                isSelected && "bg-muted"
            )}
            onClick={onChange}
        >
            <div className="flex items-center space-x-2 flex-1">
                {option.metadata?.hex ? (
                    <div
                        className="w-4 h-4 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: option.metadata.hex }}
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
    ), []);

    // Render standard checkbox option
    const renderCheckboxOption = useCallback((option: any, isSelected: boolean, onChange: () => void) => (
        <div key={option.value} className="flex items-center space-x-2 py-1">
            <Checkbox
                id={`${option.variantTemplateId}-${option.value}`}
                checked={isSelected}
                onCheckedChange={onChange}
            />
            <label
                htmlFor={`${option.variantTemplateId}-${option.value}`}
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
    ), []);

    // Render range slider
    const renderRangeFilter = useCallback((template: VariantTemplate) => (
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>{template.minValue || 0}{template.unit || ''}</span>
                <span>{template.maxValue || 100}{template.unit || ''}</span>
            </div>
            <Slider
                min={template.minValue || 0}
                max={template.maxValue || 100}
                step={template.step || 1}
                value={[
                    filterState.selectedVariants[template.$id]?.[0] ?
                        parseInt(filterState.selectedVariants[template.$id][0]) :
                        template.minValue || 0
                ]}
                onValueChange={(value) => {
                    const newSelectedVariants = {
                        ...filterState.selectedVariants,
                        [template.$id]: value.map(v => v.toString())
                    };
                    setFilterState({ ...filterState, selectedVariants: newSelectedVariants });
                    updateFilters({ selectedVariants: newSelectedVariants });
                }}
                className="w-full"
            />
            <div className="flex justify-center">
                <Badge variant="outline">
                    {filterState.selectedVariants[template.$id]?.[0] || template.minValue || 0}
                    {template.unit || ''}
                </Badge>
            </div>
        </div>
    ), [filterState, updateFilters]);

    // Get active filter count for a group
    const getActiveFilterCount = useCallback((groupName: string) => {
        const groupTemplates = filterGroups[groupName] || [];
        return groupTemplates.reduce((count, template) => {
            const selectedValues = filterState.selectedVariants[template.$id];
            return count + (selectedValues?.length || 0);
        }, 0);
    }, [filterGroups, filterState.selectedVariants]);

    const totalActiveFilters = useMemo(() => {
        return Object.values(filterState.selectedVariants).reduce((total, values) => total + values.length, 0) +
            (filterState.priceRange[0] > minPrice || filterState.priceRange[1] < maxPrice ? 1 : 0) +
            (filterState.searchTerm ? 1 : 0);
    }, [filterState, minPrice, maxPrice]);

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="space-y-1">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="h-3 bg-muted rounded w-full"></div>
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
                {filterState.searchTerm !== undefined && (
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Search Products</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={filterState.searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                            />
                            {filterState.searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                    onClick={() => handleSearchChange('')}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

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
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="number"
                                    value={filterState.priceRange[0]}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || minPrice;
                                        handlePriceChange([value, filterState.priceRange[1]]);
                                    }}
                                    className="w-20 h-8 text-xs"
                                    min={minPrice}
                                    max={filterState.priceRange[1]}
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <Input
                                    type="number"
                                    value={filterState.priceRange[1]}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || maxPrice;
                                        handlePriceChange([filterState.priceRange[0], value]);
                                    }}
                                    className="w-20 h-8 text-xs"
                                    min={filterState.priceRange[0]}
                                    max={maxPrice}
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
                <Accordion type="multiple" value={Array.from(expandedGroups)} className="space-y-2">
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
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="px-4 pb-4">
                                    <div className="space-y-4">
                                        {templates.map((template) => {
                                            const selectedValues = filterState.selectedVariants[template.$id] || [];

                                            return (
                                                <div key={template.$id} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">
                                                            {template.name}
                                                        </Label>
                                                        {selectedValues.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {selectedValues.length}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Search within filter options */}
                                                    {(template.variantOptions?.length || 0) > 5 && (
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                            <Input
                                                                placeholder={`Search ${template.name.toLowerCase()}...`}
                                                                value={searchTerms[template.$id] || ''}
                                                                onChange={(e) => setSearchTerms({
                                                                    ...searchTerms,
                                                                    [template.$id]: e.target.value
                                                                })}
                                                                className="pl-8 h-8 text-xs"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Range Filter */}
                                                    {(template.type === 'range' || template.type === 'number') ? (
                                                        renderRangeFilter(template)
                                                    ) : (
                                                        /* Options List */
                                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                                            {getFilteredOptions(template, searchTerms[template.$id] || '')
                                                                .slice(0, 20) // Limit options for performance
                                                                .map((option) => {
                                                                    const isSelected = selectedValues.includes(option.value);
                                                                    const onChange = () => handleVariantChange(
                                                                        template.$id,
                                                                        option.value,
                                                                        !isSelected
                                                                    );

                                                                    // Render color options differently
                                                                    if (template.type === 'color' || groupName === 'Color') {
                                                                        return renderColorOption(option, isSelected, onChange);
                                                                    }

                                                                    return renderCheckboxOption(option, isSelected, onChange);
                                                                })}
                                                        </div>
                                                    )}

                                                    {/* Show more options button */}
                                                    {(template.variantOptions?.length || 0) > 20 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-xs"
                                                            onClick={() => {
                                                                // Implement show more functionality
                                                                console.log('Show more options for', template.name);
                                                            }}
                                                        >
                                                            Show {(template.variantOptions?.length || 0) - 20} more options
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
                            {/* These would be dynamically generated based on popular filter combinations */}
                            <Button variant="outline" size="sm" className="text-xs h-7">
                                Under $50
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7">
                                Free Shipping
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7">
                                Top Rated
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};