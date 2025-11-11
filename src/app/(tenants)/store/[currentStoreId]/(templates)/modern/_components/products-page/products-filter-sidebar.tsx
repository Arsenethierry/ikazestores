"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, X, Loader2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductFilterSidebarProps {
    storeId?: string;
    filterGroups: Record<string, any[]>;
    minPrice: number;
    maxPrice: number;
    initialMinPrice?: number;
    initialMaxPrice?: number;
    className?: string;
}

export function ProductFilterSidebar({
    filterGroups,
    minPrice,
    maxPrice,
    initialMinPrice,
    initialMaxPrice,
    className,
}: ProductFilterSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Price range state
    const [priceRange, setPriceRange] = useState<[number, number]>([
        initialMinPrice || minPrice,
        initialMaxPrice || maxPrice,
    ]);

    // Search term state for variant options
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

    // Expanded groups state - default to first 2 groups
    const [expandedGroups] = useState<Set<string>>(
        new Set(Object.keys(filterGroups).slice(0, 2))
    );

    // Selected variants from URL
    const selectedVariants = useMemo(() => {
        const variants: Record<string, string[]> = {};
        searchParams.forEach((value, key) => {
            if (key.startsWith("variant_")) {
                const variantId = key.replace("variant_", "");
                variants[variantId] = value.split(",");
            }
        });
        return variants;
    }, [searchParams]);

    const updateUrlParams = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "") {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            });

            startTransition(() => {
                router.push(`?${params.toString()}`, { scroll: false });
            });
        },
        [router, searchParams]
    );

    const handlePriceChange = useCallback(
        (values: [number, number]) => {
            setPriceRange(values);
        },
        []
    );

    const applyPriceFilter = useCallback(() => {
        updateUrlParams({
            minPrice: priceRange[0] > minPrice ? priceRange[0].toString() : null,
            maxPrice: priceRange[1] < maxPrice ? priceRange[1].toString() : null,
        });
    }, [priceRange, minPrice, maxPrice, updateUrlParams]);

    const handleVariantToggle = useCallback(
        (templateId: string, optionValue: string) => {
            const currentSelected = selectedVariants[templateId] || [];
            const newSelected = currentSelected.includes(optionValue)
                ? currentSelected.filter((v) => v !== optionValue)
                : [...currentSelected, optionValue];

            updateUrlParams({
                [`variant_${templateId}`]: newSelected.length > 0 ? newSelected.join(",") : null,
            });
        },
        [selectedVariants, updateUrlParams]
    );

    const clearAllFilters = useCallback(() => {
        setPriceRange([minPrice, maxPrice]);
        startTransition(() => {
            router.push(window.location.pathname, { scroll: false });
        });
    }, [router, minPrice, maxPrice]);

    const clearFilterGroup = useCallback(
        (groupName: string) => {
            const groupTemplates = filterGroups[groupName] || [];
            const updates: Record<string, null> = {};

            groupTemplates.forEach((template) => {
                updates[`variant_${template.id}`] = null;
            });

            updateUrlParams(updates);
        },
        [filterGroups, updateUrlParams]
    );

    const hasActiveFilters = useMemo(() => {
        return (
            searchParams.has("minPrice") ||
            searchParams.has("maxPrice") ||
            Object.keys(selectedVariants).length > 0
        );
    }, [searchParams, selectedVariants]);

    const getActiveFilterCount = (groupName: string) => {
        const groupTemplates = filterGroups[groupName] || [];
        return groupTemplates.reduce((count, template) => {
            const selected = selectedVariants[template.id];
            return count + (selected ? selected.length : 0);
        }, 0);
    };

    return (
        <Card className={cn("sticky top-4", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Filters
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    </CardTitle>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-xs"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Price Range Filter */}
                <div className="space-y-4">
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="space-y-4">
                        <Slider
                            value={priceRange}
                            onValueChange={handlePriceChange}
                            min={minPrice}
                            max={maxPrice}
                            step={Math.max(1, Math.floor((maxPrice - minPrice) / 100))}
                            className="w-full"
                        />
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) =>
                                    setPriceRange([parseInt(e.target.value) || minPrice, priceRange[1]])
                                }
                                className="h-8"
                                placeholder="Min"
                                min={minPrice}
                                max={priceRange[1]}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) =>
                                    setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])
                                }
                                className="h-8"
                                placeholder="Max"
                                min={priceRange[0]}
                                max={maxPrice}
                            />
                        </div>
                        <Button
                            onClick={applyPriceFilter}
                            size="sm"
                            className="w-full"
                            disabled={isPending}
                        >
                            Apply Price Filter
                        </Button>
                    </div>
                </div>

                {/* Variant Filters */}
                {Object.keys(filterGroups).length > 0 && (
                    <Accordion type="multiple" className="w-full" defaultValue={Array.from(expandedGroups)}>
                        {Object.entries(filterGroups).map(([groupName, templates]) => {
                            const activeCount = getActiveFilterCount(groupName);

                            return (
                                <AccordionItem key={groupName} value={groupName}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <span className="font-medium">{groupName}</span>
                                            {activeCount > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {activeCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-4">
                                            {/* Clear Group Button - Outside Accordion Trigger */}
                                            {activeCount > 0 && (
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => clearFilterGroup(groupName)}
                                                        className="h-7 px-3 text-xs"
                                                    >
                                                        Clear {groupName}
                                                    </Button>
                                                </div>
                                            )}

                                            {templates.map((template) => {
                                                const selectedValues = selectedVariants[template.id] || [];
                                                const searchTerm = searchTerms[template.id] || "";

                                                // Filter options based on search
                                                const filteredOptions = template.variantOptions?.filter(
                                                    (option: any) =>
                                                        !searchTerm ||
                                                        option.label
                                                            ?.toLowerCase()
                                                            .includes(searchTerm.toLowerCase()) ||
                                                        option.value
                                                            ?.toLowerCase()
                                                            .includes(searchTerm.toLowerCase())
                                                ) || [];

                                                return (
                                                    <div key={template.id} className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-medium">
                                                                {template.name}
                                                                {template.isRequired && (
                                                                    <Badge variant="destructive" className="ml-2 text-xs">
                                                                        Required
                                                                    </Badge>
                                                                )}
                                                            </Label>
                                                            {selectedValues.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-xs px-2"
                                                                    onClick={() => {
                                                                        updateUrlParams({
                                                                            [`variant_${template.id}`]: null,
                                                                        });
                                                                    }}
                                                                >
                                                                    Clear
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {/* Search for options if more than 10 */}
                                                        {template.variantOptions?.length > 10 && (
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder={`Search ${template.name}...`}
                                                                    value={searchTerm}
                                                                    onChange={(e) =>
                                                                        setSearchTerms((prev) => ({
                                                                            ...prev,
                                                                            [template.id]: e.target.value,
                                                                        }))
                                                                    }
                                                                    className="pl-10 h-8 text-sm"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Options */}
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                            {filteredOptions.length === 0 ? (
                                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                                    No options found
                                                                </p>
                                                            ) : (
                                                                filteredOptions.map((option: any) => {
                                                                    const isSelected = selectedValues.includes(
                                                                        option.value
                                                                    );

                                                                    return (
                                                                        <div
                                                                            key={option.value}
                                                                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                                                            onClick={() =>
                                                                                handleVariantToggle(
                                                                                    template.id,
                                                                                    option.value
                                                                                )
                                                                            }
                                                                        >
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                onCheckedChange={() =>
                                                                                    handleVariantToggle(
                                                                                        template.id,
                                                                                        option.value
                                                                                    )
                                                                                }
                                                                            />
                                                                            {template.inputType === "color" &&
                                                                                option.colorCode && (
                                                                                    <div
                                                                                        className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                                                                        style={{
                                                                                            backgroundColor:
                                                                                                option.colorCode,
                                                                                        }}
                                                                                        title={option.label || option.value}
                                                                                    />
                                                                                )}
                                                                            <Label className="text-sm cursor-pointer flex-1">
                                                                                {option.label || option.value}
                                                                            </Label>
                                                                            {option.additionalPrice > 0 && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    +${option.additionalPrice}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}