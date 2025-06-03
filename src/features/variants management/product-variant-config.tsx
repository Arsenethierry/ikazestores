/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantGroup, VariantOptions, VariantsCombination, VariantTemplate } from "@/lib/types";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { bulkUpdateVariantCombinations, generateVariantCombinations, getProductVariantCombinations } from "./actions/variant-management-actions";
import { ArrowLeftCircle, Plus, RefreshCw, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface VariantOption {
    $id: string;
    value: string;
    label: string;
    additionalPrice?: number;
    imageUrl?: string;
}

interface ProductVariantConfigProps {
    productId: string;
    productTypeId: string;
    storeId: string;
    basePrice: number;
    userId: string;
    existingCombinations?: VariantsCombination[];
}

export const ProductVariantConfig = ({
    basePrice,
    productId,
    storeId,
    existingCombinations
}: ProductVariantConfigProps) => {
    const router = useRouter();
    
    const [selectedVariants, setSelectedVariants] = useState<{
        templateId: string;
        isSelected: boolean;
        variantOptions: VariantOption[];
    }[]>([]);

    const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
    const [combinations, setCombinations] = useState<VariantsCombination[] | any>(existingCombinations ?? []);
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);
    const [selectedCombinations, setSelectedCombinations] = useState<string[]>([]);
    const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<number | null>(null);
    const [bulkInventoryAdjustment, setBulkInventoryAdjustment] = useState<number | null>(null);

    const { execute: executeGenerate, isPending: isGenerating } = useAction(generateVariantCombinations, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                if (data.combinations) {
                    setCombinations(data.combinations);
                }
                setShowRegenConfirm(false);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: (error) => {
            console.error("Generate combinations error:", error);
            toast.error("Failed to generate variant combinations");
        }
    });

    const { execute: executeBulkUpdate, isPending: isUpdating } = useAction(bulkUpdateVariantCombinations, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                setBulkEditMode(false);
                setBulkPriceAdjustment(null);
                setBulkInventoryAdjustment(null);
                setSelectedCombinations([]);

                // Refresh combinations data
                refreshCombinations();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: (error) => {
            console.error("Bulk update error:", error);
            toast.error("Failed to update variant combinations");
        }
    });

    const refreshCombinations = async () => {
        try {
            const response = await getProductVariantCombinations(productId);
            if (response && "documents" in response) {
                setCombinations(response.documents);
            }
        } catch (error) {
            console.error("Error refreshing combinations:", error);
            toast.error("Failed to refresh combinations data");
        }
    }

    const handleToggleVariant = (templateId: string) => {
        setSelectedVariants(prev =>
            prev.map(v =>
                v.templateId === templateId
                    ? { ...v, isSelected: !v.isSelected }
                    : v
            )
        );
    };

    const handleBulkUpdate = () => {
        if (selectedCombinations.length === 0) {
            toast.error("Please select at least one variant combination");
            return;
        }

        const updates = selectedCombinations.map(id => {
            const combination = combinations.find((c: VariantsCombination) => c.$id === id);

            if (!combination) {
                return null;
            }

            const updateData: any = {
                combinationId: id
            };

            // Apply price adjustment if set
            if (bulkPriceAdjustment !== null) {
                updateData.price = combination.price + bulkPriceAdjustment;
                if (updateData.price < 0) updateData.price = 0;
            }

            // Apply inventory adjustment if set
            if (bulkInventoryAdjustment !== null) {
                updateData.inventory = combination.inventory + bulkInventoryAdjustment;
                if (updateData.inventory < 0) updateData.inventory = 0;
            }

            return updateData;
        }).filter(Boolean);

        if (updates.length > 0) {
            executeBulkUpdate({
                combinations: updates,
                productId
            });
        }
    }

    const handleGenerateCombinations = () => {
        const activeVariants = selectedVariants.filter(v => v.isSelected);

        if (activeVariants.length === 0) {
            toast.error("Please select at least one variant");
            return;
        }

        if (combinations.length > 0) {
            setShowRegenConfirm(true);
            return;
        }

        generateCombinations();
    };

    const generateCombinations = () => {
        const activeVariants = selectedVariants.filter(v => v.isSelected);

        const variantsData = activeVariants.map(variant => ({
            variantId: variant.templateId,
            options: variant.variantOptions.map(option => ({
                optionId: option.$id,
                value: option.value,
                additionalPrice: option.additionalPrice || 0
            }))
        }));

        executeGenerate({
            productId,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            variants: variantsData
        })
    };

    const handleSelectAllCombinations = (checked: boolean) => {
        if (checked) {
            setSelectedCombinations(combinations.map((c: any) => c.$id));
        } else {
            setSelectedCombinations([]);
        }
    };

    const handleToggleCombination = (combinationId: string) => {
        setSelectedCombinations(prev => {
            if (prev.includes(combinationId)) {
                return prev.filter(id => id !== combinationId);
            } else {
                return [...prev, combinationId];
            }
        })
    };

    const formatCombinationName = (combination: VariantsCombination) => {
        return combination.variantOptions.map((vo: VariantOptions) => {
            const template = vo.template?.name || 'Unknown';
            const option = vo.option?.label || vo.option?.value || 'Unknown';
            return `${template}: ${option}`;
        }).join(' / ');
    };

    const handleUpdateCombination = (combination: VariantsCombination, field: string, value: string | number | boolean) => {
        setCombinations((prev: VariantsCombination[]) =>
            prev.map((c: VariantsCombination) =>
                c.$id === combination.$id
                    ? { ...c, [field]: value }
                    : c
            )
        );
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>Configure variant combinations for this product</CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="variants" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="variants">Select Variants</TabsTrigger>
                        <TabsTrigger value="combinations" disabled={combinations?.length === 0}>
                            Variant Combinations {combinations.length > 0 && `(${combinations.length})`}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="variants" className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Available Variant Types</h3>
                                    {variantGroups.length === 0 ? (
                                        <Alert>
                                            <AlertTitle>No variant templates found</AlertTitle>
                                            <AlertDescription>
                                                No variant templates are available for this product type. Please create variant templates first.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <>
                                            {variantGroups.map(group => (
                                                <div key={group.$id} className="border rounded-md p-4 space-y-3">
                                                    <h4 className="font-medium">{group.name}</h4>
                                                    {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}

                                                    <div className="space-y-2">
                                                        {Array.isArray(group.variants) && group.variants.map((variant: VariantTemplate) => {
                                                            const selectedVariant = selectedVariants.find(v => v.templateId === variant.$id);
                                                            return (
                                                                <div key={variant.$id} className="flex items-center space-x-2 p-2 bg-muted/30 rounded-md">
                                                                    <Checkbox
                                                                        id={variant.$id}
                                                                        checked={selectedVariant?.isSelected}
                                                                        onCheckedChange={() => handleToggleVariant(variant.$id)}
                                                                    />
                                                                    <div>
                                                                        <Label htmlFor={variant.$id} className="font-medium">
                                                                            {variant.name}
                                                                        </Label>
                                                                        {variant.variantOptions && (
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {variant.variantOptions.map((option: VariantOption) => (
                                                                                    <Badge key={option.$id} variant={'outline'} className="text-xs">
                                                                                        {option.label || option.value}
                                                                                        {option.additionalPrice && option.additionalPrice > 0 && `(+$${option.additionalPrice.toFixed(2)})`}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="pt-4">
                                                <Button
                                                    onClick={handleGenerateCombinations}
                                                    disabled={isGenerating || selectedVariants.filter(v => v.isSelected).length === 0}
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            {combinations.length > 0 ? "Regenerate Combinations" : "Generate Combinations"}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="combinations" className="space-y-4">
                        {combinations.length > 0 ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="select-all"
                                            checked={selectedCombinations.length === combinations.length}
                                            onCheckedChange={checked => handleSelectAllCombinations(!!checked)}
                                        />
                                        <Label htmlFor="select-all">Select All</Label>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            variant={'outline'}
                                            onClick={() => setBulkEditMode(!bulkEditMode)}
                                            disabled={selectedCombinations.length === 0}
                                        >
                                            {bulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}
                                        </Button>
                                        <Button>
                                            {isUpdating ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save All Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {bulkEditMode && selectedCombinations.length > 0 && (
                                    <Card className="mb-4">
                                        <CardHeader>
                                            <CardTitle>Bulk Edit ({selectedCombinations.length} items)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="bulk-price">Price Adjustment</Label>
                                                    <div className="flex items-center space-x-2">
                                                        <Select onValueChange={(value) => setBulkPriceAdjustment(value === "none" ? null : Number(value))}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select adjustment type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No change</SelectItem>
                                                                <SelectItem value="5">+$5.00</SelectItem>
                                                                <SelectItem value="10">+$10.00</SelectItem>
                                                                <SelectItem value="-5">-$5.00</SelectItem>
                                                                <SelectItem value="-10">-$10.00</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            id="bulk-price-custom"
                                                            type="number"
                                                            placeholder="Custom"
                                                            onChange={(e) => setBulkPriceAdjustment(Number(e.target.value))}
                                                            className="w-24"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="bulk-inventory">Inventory Adjustment</Label>
                                                    <div className="flex items-center space-x-2">
                                                        <Select onValueChange={(value) => setBulkInventoryAdjustment(value === "none" ? null : Number(value))}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select adjustment type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No change</SelectItem>
                                                                <SelectItem value="5">+5</SelectItem>
                                                                <SelectItem value="10">+10</SelectItem>
                                                                <SelectItem value="-5">-5</SelectItem>
                                                                <SelectItem value="-10">-10</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            id="bulk-inventory-custom"
                                                            type="number"
                                                            placeholder="Custom"
                                                            onChange={(e) => setBulkInventoryAdjustment(Number(e.target.value))}
                                                            className="w-24"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setBulkEditMode(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleBulkUpdate}
                                                disabled={isUpdating || (bulkPriceAdjustment === null && bulkInventoryAdjustment === null)}
                                            >
                                                Apply Changes
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )}

                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Variant</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Compare At</TableHead>
                                                <TableHead>Inventory</TableHead>
                                                <TableHead className="w-[100px]">Active</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {combinations.map((combination: VariantsCombination) => (
                                                <TableRow key={combination.$id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedCombinations.includes(combination.$id)}
                                                            onCheckedChange={() => handleToggleCombination(combination.$id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatCombinationName(combination)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={combination.sku || ""}
                                                            onChange={(e) => handleUpdateCombination(combination, "sku", e.target.value)}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={combination.price || basePrice}
                                                            onChange={(e) => handleUpdateCombination(combination, "price", Number(e.target.value))}
                                                            className="h-8 w-24"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={combination.compareAtPrice || ""}
                                                            onChange={(e) => handleUpdateCombination(
                                                                combination,
                                                                "compareAtPrice",
                                                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                                // @ts-ignore
                                                                e.target.value ? Number(e.target.value) : undefined
                                                            )}
                                                            className="h-8 w-24"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={combination.inventory || 0}
                                                            onChange={(e) => handleUpdateCombination(combination, "inventory", Number(e.target.value))}
                                                            className="h-8 w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={combination.isActive}
                                                            onCheckedChange={(checked) => handleUpdateCombination(combination, "isActive", checked)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <p className="text-muted-foreground mb-4">No variant combinations have been generated yet.</p>
                                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                {/* @ts-ignore */}
                                <Button onClick={() => document.querySelector('[data-value="variants"]')?.click()}>
                                    Go to Variant Selection
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/stores/${storeId}/products`)}
                >
                    <ArrowLeftCircle className="mr-2 h-4 w-4" />
                    Back to Products
                </Button>
            </CardFooter>

            <Dialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Variant Combinations?</DialogTitle>
                        <DialogDescription>
                            This will recreate all variant combinations based on your selected variants. Any price, inventory, and SKU data for existing variants will be reset.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenConfirm(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={generateCombinations}>
                            Regenerate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}