/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductVariantSchema } from '@/lib/schemas/product-variants-schema';
import { ProductCombination } from '@/lib/types';
import { AlertCircle, DollarSign, Hash, Package, Plus, RefreshCw, Trash2, Weight } from 'lucide-react';
import React from 'react';
import { Control, useFieldArray, useFormContext } from 'react-hook-form';
import { z } from 'zod';

interface ProductCombinationsProps {
    control: Control<any>;
    basePrice: number;
    baseSku: string;
    variants: z.infer<typeof ProductVariantSchema>;
    onRegenerateAll: () => void;
}
export const ProductCombinations: React.FC<ProductCombinationsProps> = ({
    control,
    basePrice,
    baseSku,
    variants,
    onRegenerateAll
}) => {
    const { setValue, watch } = useFormContext();
    const { append, remove, update } = useFieldArray({
        control,
        name: 'productCombinations'
    });

    const combinations = watch('productCombinations') || [];

    const handlePriceChange = (index: number, newPrice: number) => {
        const updatedCombination = { ...combinations[index], price: newPrice };
        update(index, updatedCombination);
    }

    const handleQuantityChange = (index: number, newQuantity: number) => {
        const updatedCombination = { ...combinations[index], quantity: newQuantity };
        update(index, updatedCombination);
    }

    const handleWeightChange = (index: number, newWeight: number) => {
        const updatedCombination = { ...combinations[index], weight: newWeight };
        update(index, updatedCombination);
    };

    const handleSkuChange = (index: number, newSku: string) => {
        const updatedCombination = { ...combinations[index], sku: newSku };
        update(index, updatedCombination);
    };

    const toggleDefault = (index: number) => {
        const updatedCombinations = combinations.map((combo: ProductCombination, i: number) => ({
            ...combo,
            isDefault: i === index
        }));
        setValue('productCombinations', updatedCombinations);
    }

    const addCustomCombination = () => {
        const newCombination: ProductCombination = {
            id: `custom-${Date.now()}`,
            variantValues: {},
            sku: `${baseSku}-CUSTOM-${Date.now()}`,
            price: basePrice,
            quantity: 0,
            weight: 0,
            isDefault: false,
            variantStrings: ['Custom']
        };
        append(newCombination);
    };

    const getTotalCombinations = () => combinations.length;
    const getTotalInventory = () => combinations.reduce((total: number, combo: ProductCombination) => total + (combo.quantity || 0), 0);
    const getAveragePrice = () => {
        if (combinations.length === 0) return 0;
        const total = combinations.reduce((sum: number, combo: ProductCombination) => sum + combo.price, 0);
        return total / combinations.length;
    };

    if (combinations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Combinations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No product combinations have been generated yet. Configure variants first, then combinations will be automatically created.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Product Combinations ({getTotalCombinations()})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage pricing, inventory, and SKUs for each variant combination
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onRegenerateAll}
                            className="flex items-center gap-1"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Regenerate All
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomCombination}
                            className="flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Add Custom
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{getTotalCombinations()} Combinations</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{getTotalInventory()} Total Inventory</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">${getAveragePrice().toFixed(2)} Avg Price</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Variant</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Weight (kg)</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {combinations.map((combination: ProductCombination, index: number) => (
                                    <TableRow key={combination.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {combination.variantStrings?.map((str, strIndex) => (
                                                        <Badge key={strIndex} variant="secondary" className="text-xs">
                                                            {str}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                {combination.isDefault && (
                                                    <Badge variant="default" className="text-xs">
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={combination.sku}
                                                onChange={(e) => handleSkuChange(index, e.target.value)}
                                                className="text-xs font-mono"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={combination.price}
                                                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={combination.quantity || 0}
                                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Weight className="h-3 w-3 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={combination.weight || 0}
                                                    onChange={(e) => handleWeightChange(index, parseFloat(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant={combination.isDefault ? "primary" : "outline"}
                                                size="sm"
                                                onClick={() => toggleDefault(index)}
                                                className="text-xs"
                                            >
                                                {combination.isDefault ? "Default" : "Set Default"}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden space-y-3">
                        {combinations.map((combination: ProductCombination, index: number) => (
                            <Card key={combination.id} className="border-l-4 border-l-blue-500">
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1">
                                                {combination.variantStrings?.map((str, strIndex) => (
                                                    <Badge key={strIndex} variant="secondary" className="text-xs">
                                                        {str}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">SKU</Label>
                                                <Input
                                                    value={combination.sku}
                                                    onChange={(e) => handleSkuChange(index, e.target.value)}
                                                    className="text-xs font-mono"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Price</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={combination.price}
                                                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    value={combination.quantity || 0}
                                                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={combination.weight || 0}
                                                    onChange={(e) => handleWeightChange(index, parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Button
                                                type="button"
                                                variant={combination.isDefault ? "primary" : "outline"}
                                                size="sm"
                                                onClick={() => toggleDefault(index)}
                                                className="text-xs"
                                            >
                                                {combination.isDefault ? "Default" : "Set Default"}
                                            </Button>
                                            {combination.isDefault && (
                                                <Badge variant="default" className="text-xs">
                                                    Default Combination
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}