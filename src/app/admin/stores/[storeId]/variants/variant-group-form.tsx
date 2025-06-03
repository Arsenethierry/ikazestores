// app/admin/stores/[storeId]/variants/variant-group-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Save, X, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { VariantGroupSchema } from "@/lib/schemas/product-variants-schema";
import { createVariantGroup, updateVariantGroup } from "@/features/products/actions/variants management/product-types-actions";
import { getVariantTemplatesByProductType } from "@/features/products/actions/variants management/products-variant-templates-action";

interface VariantTemplateItem {
    $id: string;
    name: string;
    type: string;
    description?: string;
    isRequired: boolean;
}

interface VariantGroupFormProps {
    storeId?: string;
    userId: string;
    productTypes: { $id: string; name: string }[];
    editMode?: boolean;
    preSelectedProductType?: string;
    initialData?: z.infer<typeof VariantGroupSchema> & { groupId?: string };
}

export default function VariantGroupForm({
    storeId,
    userId,
    productTypes,
    editMode = false,
    preSelectedProductType,
    initialData,
}: VariantGroupFormProps) {
    const router = useRouter();
    const [availableTemplates, setAvailableTemplates] = useState<VariantTemplateItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof VariantGroupSchema> & { groupId?: string }>({
        resolver: zodResolver(
            editMode
                ? VariantGroupSchema.extend({ groupId: z.string() })
                : VariantGroupSchema
        ),
        defaultValues: initialData || {
            name: "",
            description: "",
            productType: preSelectedProductType || "",
            variants: [],
            createdBy: userId,
            storeId: storeId || null,
        },
    });

    const { execute: executeCreate, isPending: isCreating } = useAction(createVariantGroup, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success);
                router.push(`/admin/stores/${storeId}/variants`);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: (error) => {
            console.error("Group creation error:", error);
            toast.error("Failed to create variant group");
        },
    });

    const { execute: executeUpdate, isPending: isUpdating } = useAction(updateVariantGroup, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success);
                router.push(`/admin/stores/${storeId}/variants`);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: (error) => {
            console.error("Group update error:", error);
            toast.error("Failed to update variant group");
        },
    });

    // Watch for product type changes to load appropriate variant templates
    const selectedProductType = form.watch("productType");

    useEffect(() => {
        const loadVariantTemplates = async (productTypeId: string) => {
            setIsLoading(true);
            try {
                const response = await getVariantTemplatesByProductType(productTypeId, storeId);
                if (response && "documents" in response) {
                    setAvailableTemplates(response.documents);
                } else {
                    setAvailableTemplates([]);
                }
            } catch (error) {
                console.error("Error loading variant templates:", error);
                toast.error("Failed to load variant templates");
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedProductType) {
            loadVariantTemplates(selectedProductType);
        } else {
            setAvailableTemplates([]);
        }
    }, [selectedProductType, storeId]);

    const isPending = isCreating || isUpdating;

    function onSubmit(values: z.infer<typeof VariantGroupSchema> & { groupId?: string }) {
        if (editMode && initialData?.groupId) {
            executeUpdate(values);
        } else {
            executeCreate(values);
        }
    }

    // Get variant type badge color
    const getVariantTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            'SELECT': 'bg-blue-100 text-blue-800',
            'COLOR': 'bg-pink-100 text-pink-800',
            'BOOLEAN': 'bg-green-100 text-green-800',
            'TEXT': 'bg-purple-100 text-purple-800',
            'NUMBER': 'bg-yellow-100 text-yellow-800',
            'MULTISELECT': 'bg-indigo-100 text-indigo-800',
        };

        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{editMode ? "Edit Variant Group" : "Create Variant Group"}</CardTitle>
                <CardDescription>
                    {editMode
                        ? "Make changes to existing variant group"
                        : "Group related variants together to simplify product setup"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Clothing Basics, Device Specifications" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        A descriptive name for this group of variants
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this variant group is for"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Help other team members understand when to use this group
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="productType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={editMode} // Don't allow changing product type in edit mode
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a product type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {productTypes.map((type) => (
                                                <SelectItem key={type.$id} value={type.$id}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Product type these variants apply to
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="variants"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variant Templates</FormLabel>
                                    <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                                        {isLoading ? (
                                            <div className="py-4 text-center text-muted-foreground">
                                                <div className="inline-flex items-center">
                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                                    Loading templates...
                                                </div>
                                            </div>
                                        ) : availableTemplates.length === 0 ? (
                                            <div className="py-8 text-center">
                                                {selectedProductType ? (
                                                    <div className="space-y-2">
                                                        <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                                                        <p className="text-muted-foreground">
                                                            No variant templates available for this product type
                                                        </p>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/admin/stores/${storeId}/variants/templates/new?productType=${selectedProductType}`)}
                                                        >
                                                            Create First Template
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-muted-foreground">
                                                        Select a product type to see available templates
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Select the variant templates to include in this group:
                                                </p>
                                                {availableTemplates.map((template) => (
                                                    <div key={template.$id} className="flex items-start space-x-3 hover:bg-muted/50 p-3 rounded-md border">
                                                        <Checkbox
                                                            id={template.$id}
                                                            checked={field.value.includes(template.$id)}
                                                            onCheckedChange={(checked) => {
                                                                const newValue = checked
                                                                    ? [...field.value, template.$id]
                                                                    : field.value.filter((id) => id !== template.$id);
                                                                field.onChange(newValue);
                                                            }}
                                                        />
                                                        <div className="grid gap-1.5 flex-1">
                                                            <label
                                                                htmlFor={template.$id}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                            >
                                                                {template.name}
                                                            </label>
                                                            {template.description && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {template.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs ${getVariantTypeBadge(template.type)}`}
                                                                >
                                                                    {template.type}
                                                                </Badge>
                                                                {template.isRequired && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Required
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <FormDescription>
                                        Select the variant templates to include in this group. Groups make it easier to apply multiple related variants to products.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Selected variants summary */}
                        {form.watch("variants").length > 0 && (
                            <Alert>
                                <AlertTitle>Selected Templates ({form.watch("variants").length})</AlertTitle>
                                <AlertDescription>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {form.watch("variants").map((variantId) => {
                                            const template = availableTemplates.find(t => t.$id === variantId);
                                            return template ? (
                                                <Badge key={variantId} variant="secondary" className="text-xs">
                                                    {template.name}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end space-x-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/admin/stores/${storeId}/variants`)}
                                disabled={isPending}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || form.watch("variants").length === 0}
                            >
                                {isPending ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        {editMode ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {editMode ? "Update Group" : "Create Group"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}