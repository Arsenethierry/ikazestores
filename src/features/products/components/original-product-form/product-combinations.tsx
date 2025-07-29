import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductCombination } from '@/lib/schemas/product-variants-schema';
import { AlertCircle, DollarSign, Download, Hash, ImageDown, Package, Plus, RefreshCw, Ruler, Trash2, Upload, Weight } from 'lucide-react';
import React, { useState } from 'react';
import { Control, useFieldArray, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface ProductCombinationsProps {
    control: Control<any>;
    basePrice: number;
    baseSku: string;
    variants?: Array<{
        templateId: string;
        name: string;
        type: string;
        values: Array<{
            value: string;
            label?: string;
            additionalPrice?: number;
        }>;
    }>;
    onRegenerateAll: () => void;
}

interface CustomCombinationInput {
    variantValues: Record<string, string>;
    sku: string;
    price: number;
    quantity: number;
    weight: number;
    dimensions?: { length?: number; width?: number; height?: number };
    images?: File[];
}

export const ProductCombinations: React.FC<ProductCombinationsProps> = ({
    control,
    basePrice,
    baseSku,
    variants = [],
    onRegenerateAll
}) => {
    const { setValue, watch } = useFormContext();
    const { append, remove, update } = useFieldArray({
        control,
        name: 'productCombinations'
    });

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [customCombination, setCustomCombination] = useState<CustomCombinationInput>({
        variantValues: {},
        sku: `${baseSku}-CUSTOM-${Date.now()}`,
        price: basePrice,
        quantity: 0,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 }
    });

    const combinations = watch('productCombinations') || [];

    const handlePriceChange = (index: number, newPrice: number) => {
        if (newPrice < 0) {
            toast.error("Price cannot be negative");
            return;
        }
        const updatedCombination = { ...combinations[index], price: newPrice };
        update(index, updatedCombination);
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity < 0) {
            toast.error("Quantity cannot be negative");
            return;
        }
        const updatedCombination = { ...combinations[index], quantity: newQuantity };
        update(index, updatedCombination);
    };

    const handleWeightChange = (index: number, newWeight: number) => {
        if (newWeight < 0) {
            toast.error("Weight cannot be negative");
            return;
        }
        const updatedCombination = { ...combinations[index], weight: newWeight };
        update(index, updatedCombination);
    };

    const handleDimensionChange = (index: number, dimension: 'length' | 'width' | 'height', value: number) => {
        if (value < 0) {
            toast.error("Dimensions cannot be negative");
            return;
        }
        const currentDimensions = combinations[index].dimensions || {};

        const updatedDimensions = {
            ...currentDimensions,
            [dimension]: value
        };

        const updatedCombination = {
            ...combinations[index],
            dimensions: updatedDimensions
        };
        update(index, updatedCombination);
    };

    const handleSkuChange = (index: number, newSku: string) => {
        if (combinations.some((c: ProductCombination, i: number) => i !== index && c.sku === newSku)) {
            toast.error("SKU must be unique");
            return;
        }
        const updatedCombination = { ...combinations[index], sku: newSku };
        update(index, updatedCombination);
    };

    const handleImageChange = (index: number, files: File[]) => {
        if (files.length > 3) {
            toast.error("Maximum 3 images per combination");
            return;
        }
        const updatedCombination = {
            ...combinations[index],
            images: files
        };
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
        if (!customCombination.sku) {
            toast.error("SKU is required for custom combination");
            return;
        }
        if (combinations.some((c: ProductCombination) => c.sku === customCombination.sku)) {
            toast.error("SKU must be unique");
            return;
        }
        if (Object.keys(customCombination.variantValues).length === 0) {
            toast.error("At least one variant value is required");
            return;
        }

        const newCombination: ProductCombination = {
            id: `custom-${Date.now()}`,
            variantValues: customCombination.variantValues,
            sku: customCombination.sku,
            price: customCombination.price,
            quantity: customCombination.quantity,
            weight: customCombination.weight,
            dimensions: customCombination.dimensions,
            images: customCombination.images,
            isDefault: combinations.length === 0,
            variantStrings: Object.entries(customCombination.variantValues).map(([variantId, value]) =>
                `${variantId}-${value.toLowerCase().replace(/\s+/g, '-')}`
            )
        };
        append(newCombination);
        setCustomCombination({
            variantValues: {},
            sku: `${baseSku}-CUSTOM-${Date.now()}`,
            price: basePrice,
            quantity: 0,
            weight: 0,
            dimensions: { length: 0, width: 0, height: 0 }
        });
        setIsAddDialogOpen(false);
        toast.success("Custom combination added successfully");
    };

    const exportCombinations = () => {
        const data = JSON.stringify(combinations, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'product-combinations.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Combinations exported successfully");
    };

    const importCombinations = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                if (Array.isArray(imported)) {
                    const validCombinations = imported.filter((combo: any) => {
                        return combo.sku && !combinations.some((c: ProductCombination) => c.sku === combo.sku);
                    });
                    setValue('productCombinations', [...combinations, ...validCombinations]);
                    toast.success(`Imported ${validCombinations.length} valid combinations`);
                } else {
                    toast.error("Invalid file format");
                }
            } catch (error) {
                console.log(error)
                toast.error("Error importing combinations");
            }
        };
        reader.readAsText(file);
    };

    const batchUpdate = (field: 'price' | 'quantity' | 'weight', value: number) => {
        if (value < 0) {
            toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative`);
            return;
        }
        const updatedCombinations = combinations.map((combo: ProductCombination) => ({
            ...combo,
            [field]: value
        }));
        setValue('productCombinations', updatedCombinations);
        toast.success(`Batch updated ${field} for all combinations`);
    };

    const getTotalCombinations = () => combinations.length;
    const getTotalInventory = () => combinations.reduce((total: number, combo: ProductCombination) => total + (combo.quantity || 0), 0);
    const getAveragePrice = () => {
        if (combinations.length === 0) return 0;
        const total = combinations.reduce((sum: number, combo: ProductCombination) => sum + combo.price, 0);
        return (total / combinations.length).toFixed(2);
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
                            Manage pricing, inventory, dimensions, and images for each variant combination
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
                            onClick={exportCombinations}
                            className="flex items-center gap-1"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <label className="cursor-pointer">
                            <Input
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={importCombinations}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                <Upload className="h-4 w-4" />
                                Import
                            </Button>
                        </label>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Custom
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Custom Combination</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>SKU</Label>
                                        <Input
                                            value={customCombination.sku || ''}
                                            onChange={(e) => setCustomCombination({
                                                ...customCombination,
                                                sku: e.target.value
                                            })}
                                            placeholder="Enter unique SKU"
                                        />
                                    </div>
                                    {variants && variants.map((variant, variantIndex) => (
                                        <div key={`variant-${variant.templateId}-${variantIndex}`}>
                                            <Label>{variant.name}</Label>
                                            <Select
                                                onValueChange={(value) => setCustomCombination({
                                                    ...customCombination,
                                                    variantValues: {
                                                        ...customCombination.variantValues,
                                                        [variant.templateId]: value
                                                    }
                                                })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${variant.name}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {variant.values.map((value, valueIndex) => (
                                                        <SelectItem
                                                            key={`variant-value-${variant.templateId}-${valueIndex}`}
                                                            value={value.value}
                                                        >
                                                            {value.label || value.value}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Price</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={customCombination.price || 0}
                                                onChange={(e) => setCustomCombination({
                                                    ...customCombination,
                                                    price: parseFloat(e.target.value) || 0
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                value={customCombination.quantity || 0}
                                                onChange={(e) => setCustomCombination({
                                                    ...customCombination,
                                                    quantity: parseInt(e.target.value) || 0
                                                })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>Length (cm)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={customCombination.dimensions?.length || 0}
                                                onChange={(e) => setCustomCombination({
                                                    ...customCombination,
                                                    dimensions: {
                                                        ...customCombination.dimensions,
                                                        length: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Width (cm)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={customCombination.dimensions?.width || 0}
                                                onChange={(e) => setCustomCombination({
                                                    ...customCombination,
                                                    dimensions: {
                                                        ...customCombination.dimensions,
                                                        width: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Height (cm)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={customCombination.dimensions?.height || 0}
                                                onChange={(e) => setCustomCombination({
                                                    ...customCombination,
                                                    dimensions: {
                                                        ...customCombination.dimensions,
                                                        height: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Variant Images (up to 3)</Label>
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => setCustomCombination({
                                                ...customCombination,
                                                images: Array.from(e.target.files || [])
                                            })}
                                        />
                                    </div>
                                    <Button onClick={addCustomCombination}>Add Combination</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
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
                        <span className="text-sm font-medium">${getAveragePrice()} Avg Price</span>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Batch Update</h5>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Batch Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                onChange={(e) => batchUpdate('price', parseFloat(e.target.value) || 0)}
                                placeholder="Set all prices"
                            />
                        </div>
                        <div>
                            <Label>Batch Quantity</Label>
                            <Input
                                type="number"
                                onChange={(e) => batchUpdate('quantity', parseInt(e.target.value) || 0)}
                                placeholder="Set all quantities"
                            />
                        </div>
                        <div>
                            <Label>Batch Weight</Label>
                            <Input
                                type="number"
                                step="0.001"
                                onChange={(e) => batchUpdate('weight', parseFloat(e.target.value) || 0)}
                                placeholder="Set all weights"
                            />
                        </div>
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
                                    <TableHead>Dimensions (cm)</TableHead>
                                    <TableHead>Images</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {combinations.map((combination: ProductCombination, index: number) => {
                                    const dimensions = combination.dimensions || { length: 0, width: 0, height: 0 };

                                    return (
                                        <TableRow key={`combination-${combination.sku}-${index}`}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap gap-1">
                                                        {combination.variantStrings?.map((str, strIndex) => (
                                                            <Badge key={`variant-string-${index}-${strIndex}`} variant="secondary" className="text-xs">
                                                                {str}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={combination.sku || ''}
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
                                                        value={combination.price || 0}
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
                                                <div className="flex items-center gap-1">
                                                    <Ruler className="h-3 w-3 text-muted-foreground" />
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={dimensions?.length || 0}
                                                            onChange={(e) => handleDimensionChange(index, 'length', parseFloat(e.target.value) || 0)}
                                                            className="w-16"
                                                            placeholder="L"
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={dimensions?.width || 0}
                                                            onChange={(e) => handleDimensionChange(index, 'width', parseFloat(e.target.value) || 0)}
                                                            className="w-16"
                                                            placeholder="W"
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={dimensions?.height || 0}
                                                            onChange={(e) => handleDimensionChange(index, 'height', parseFloat(e.target.value) || 0)}
                                                            className="w-16"
                                                            placeholder="H"
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <ImageDown className="h-3 w-3 text-muted-foreground" />
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(e) => handleImageChange(index, Array.from(e.target.files || []))}
                                                        className="text-xs"
                                                    />
                                                    <Badge variant="outline" className="text-xs">
                                                        {combination.images?.length || 0}/3
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant={combination.isDefault ? "teritary" : "outline"}
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
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden space-y-3">
                        {combinations.map((combination: ProductCombination, index: number) => {
                            const dimensions = combination.dimensions || { length: 0, width: 0, height: 0 };

                            return (
                                <Card key={`mobile-combination-${combination.sku}-${index}`} className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap gap-1">
                                                    {combination.variantStrings?.map((str, strIndex) => (
                                                        <Badge key={`mobile-variant-string-${index}-${strIndex}`} variant="secondary" className="text-xs">
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
                                                        value={combination.sku || ''}
                                                        onChange={(e) => handleSkuChange(index, e.target.value)}
                                                        className="text-xs font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Price</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={combination.price || 0}
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
                                                <div className="col-span-2">
                                                    <Label className="text-xs text-muted-foreground">Dimensions (cm)</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={dimensions?.length || 0}
                                                            onChange={(e) => handleDimensionChange(index, 'length', parseFloat(e.target.value) || 0)}
                                                            placeholder="Length"
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={dimensions?.width || 0}
                                                            onChange={(e) => handleDimensionChange(index, 'width', parseFloat(e.target.value) || 0)}
                                                            placeholder="Width"
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={dimensions?.height || 0}
                                                            onChange={(e) => handleDimensionChange(index, 'height', parseFloat(e.target.value) || 0)}
                                                            placeholder="Height"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <Label className="text-xs text-muted-foreground">Variant Images</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => handleImageChange(index, Array.from(e.target.files || []))}
                                                            className="text-xs"
                                                        />
                                                        <Badge variant="outline" className="text-xs">
                                                            {combination.images?.length || 0}/3
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Button
                                                    type="button"
                                                    variant={combination.isDefault ? "teritary" : "outline"}
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
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}