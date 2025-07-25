"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories, getCategoryById, getProductTypesBySubcategory } from "@/features/variants management/ecommerce-catalog";
import { ProductFilters } from "@/lib/types";
import { ProductType } from "@/lib/types/catalog-types";
import { ChevronDown, Search, X } from "lucide-react";
import { FC, useState } from "react";

interface FiltersProps {
    filters: ProductFilters;
    onFiltersChange: (filters: ProductFilters) => void;
    isNearbyView?: boolean;
}

export const ProductsFilters: FC<FiltersProps> = ({ filters, onFiltersChange, isNearbyView = false }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const categories = getCategories();
    const subcategories = filters.categoryId ?
        getCategoryById(filters.categoryId)?.subcategories || [] : [];
    const productTypes = (filters.subcategoryId && filters.categoryId) ?
        getProductTypesBySubcategory(filters.categoryId, filters.subcategoryId) : [];

    const handleFilterChange = (key: keyof ProductFilters, value: any) => {
        const processedValue = value === "all" ? undefined : value;
        onFiltersChange({ ...filters, [key]: processedValue });
    }

    const clearFilters = () => {
        onFiltersChange({
            search: '',
            categoryId: undefined,
            subcategoryId: undefined,
            productTypeId: undefined,
            status: undefined,
            featured: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            sortBy: undefined,
            sortOrder: undefined,
        });
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Filters</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                    />
                </div>

                {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={filters.categoryId || 'all'}
                                onValueChange={(value) => handleFilterChange('categoryId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="subcategory">Subcategory</Label>
                            <Select
                                value={filters.subcategoryId || 'all'}
                                onValueChange={(value) => handleFilterChange('subcategoryId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subcategories</SelectItem>
                                    {subcategories
                                        .filter(sub => !filters.categoryId || sub.id === filters.categoryId)
                                        .map((subcategory) => (
                                            <SelectItem key={subcategory.id} value={subcategory.id}>
                                                {subcategory.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="productType">Product Type</Label>
                            <Select
                                value={filters.productTypeId || 'all'}
                                onValueChange={(value) => handleFilterChange('productTypeId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {productTypes.map((productType: ProductType) => (
                                        <SelectItem key={productType.id} value={productType.id}>
                                            {productType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="minPrice">Min Price</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={filters.minPrice || ''}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxPrice">Max Price</Label>
                            <Input
                                type="number"
                                placeholder="999999"
                                value={filters.maxPrice || ''}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="sortBy">Sort By</Label>
                            <Select
                                value={filters.sortBy || 'default'}
                                onValueChange={(value) => handleFilterChange('sortBy', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="basePrice">Price</SelectItem>
                                    <SelectItem value="createdAt">Date Created</SelectItem>
                                    <SelectItem value="updatedAt">Date Updated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Select
                                value={filters.sortOrder || 'asc'}
                                onValueChange={(value) => handleFilterChange('sortOrder', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort order" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Ascending</SelectItem>
                                    <SelectItem value="desc">Descending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isNearbyView && (
                            <>
                                <div>
                                    <Label htmlFor="radiusKm">Radius (km)</Label>
                                    <Input
                                        type="number"
                                        placeholder="50"
                                        value={filters.radiusKm || ''}
                                        onChange={(e) => handleFilterChange('radiusKm', e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {isExpanded && (
                    <div className="flex justify-end pt-4">
                        <Button variant="outline" onClick={clearFilters} size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}