"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Filter, Grid3X3, Heart, List, Search, Share2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Input } from "@/components/ui/input";

interface SavedProductWithDetails {
    savedItemId: string;
    product: any;
    savedAt: string;
}

interface SavedProductsListProps {
    products: SavedProductWithDetails[];
}

export function SavedProductsList({ products }: SavedProductsListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [filterBy, setFilterBy] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(item => {
            const matchesSearch = item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.product?.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterBy === 'all' ||
                (filterBy === 'available' && item.product?.status === 'active') ||
                (filterBy === 'unavailable' && item.product?.status !== 'active');

            return matchesSearch && matchesFilter;
        });

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
                case 'oldest':
                    return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
                case 'price-low':
                    return (a.product?.price || 0) - (b.product?.price || 0);
                case 'price-high':
                    return (b.product?.price || 0) - (a.product?.price || 0);
                case 'name':
                    return (a.product?.name || '').localeCompare(b.product?.name || '');
                default:
                    return 0;
            }
        });
    }, [products, searchTerm, sortBy, filterBy]);

    const handleSelectAll = () => {
        if (selectedItems.length === filteredProducts.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredProducts.map(item => item.savedItemId));
        }
    };

    const handleItemSelect = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const getAvailableCount = () => {
        return products.filter(item => item.product?.status === 'active').length;
    };

    const getTotalValue = () => {
        return filteredProducts.reduce((sum, item) => sum + (item.product?.price || 0), 0);
    };

    const handleBulkRemove = async () => {
        // Implement bulk remove logic here
        console.log('Removing items:', selectedItems);
        // After successful removal, clear selection
        setSelectedItems([]);
    };

    const handleBulkShare = async () => {
        // Implement bulk share logic here
        console.log('Sharing items:', selectedItems);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search saved products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-40">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="name">Name A-Z</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'grid' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {selectedItems.length > 0 && (
                        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border">
                            <Badge variant="secondary">{selectedItems.length} selected</Badge>
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                {selectedItems.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleBulkShare}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Selected
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleBulkRemove}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Selected
                            </Button>
                        </div>
                    )}
                </div>

            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {filteredProducts.length} of {products.length} saved items
                    </p>
                </div>

                {filteredProducts.length === 0 ? (
                    <Card className="p-12 text-center">
                        <CardContent>
                            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No items found</h3>
                            <p className="text-gray-500">
                                Try adjusting your search or filter criteria
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                            : "space-y-4"
                    }>
                        {filteredProducts.map(({ product, savedItemId, savedAt }) => (
                            <div key={savedItemId} className="relative group">
                                {/* Selection checkbox */}
                                <div className="absolute top-2 left-2 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(savedItemId)}
                                        onChange={() => handleItemSelect(savedItemId)}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                </div>

                                {/* Product Card */}
                                <div className={viewMode === 'list' ? 'flex gap-4 p-4 border rounded-lg' : ''}>
                                    <VirtualProductCard
                                        product={product}
                                        key={product.$id}
                                    />
                                </div>

                                {/* Saved date badge */}
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge variant="secondary" className="text-xs">
                                        Saved {new Date(savedAt).toLocaleDateString()}
                                    </Badge>
                                </div>

                                {/* Additional Actions */}
                                <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {filteredProducts.length > 0 && filteredProducts.length >= 20 && (
                <div className="text-center pt-8">
                    <Button variant="outline" size="lg">
                        Load More Items
                    </Button>
                </div>
            )}
        </div>
    )
}