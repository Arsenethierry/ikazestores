"use client";

import { VariantTemplateSchema, VariantType } from "@/lib/schemas/product-variants-schema";
import { CategoryTypes, ProductType, VariantTemplate } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { createVariantTemplate, updateVariantTemplate } from "../categories/actions/products-variant-templates-action";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Hash, List, Palette, Plus, Save, Sliders, Store, ToggleLeft, Trash2, Type, X } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { useRouter } from "next/navigation";

interface VariantTemplateFormProps {
    mode: "create" | "edit";
    initialData?: VariantTemplate;
    storeId?: string | null;
    userId: string;
    categories: CategoryTypes[];
    productTypes: ProductType[];
};

const VARIANT_TYPE_ICONS: Record<VariantType, React.ElementType> = {
    [VariantType.SELECT]: List,
    [VariantType.MULTISELECT]: List,
    [VariantType.COLOR]: Palette,
    [VariantType.BOOLEAN]: ToggleLeft,
    [VariantType.TEXT]: Type,
    [VariantType.NUMBER]: Hash,
    [VariantType.RANGE]: Sliders,
};

export default function VariantTemplateForm({
    mode,
    initialData,
    storeId,
    userId,
    categories,
    productTypes
}: VariantTemplateFormProps) {
    const router = useRouter();

    const form = useForm<z.infer<typeof VariantTemplateSchema>>({
        resolver: zodResolver(VariantTemplateSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            type: (initialData?.type as VariantType) || VariantType.SELECT,
            isRequired: initialData?.isRequired || false,
            categoryIds: initialData?.categoryIds || [],
            productTypeIds: initialData?.productTypeIds || [],
            options: initialData?.options || [],
            storeId: storeId || null,
            createdBy: userId,
            isActive: initialData?.isActive !== false,
            minSelections: initialData?.minSelections || 0,
            maxSelections: initialData?.maxSelections || undefined,
            allowCustomValues: initialData?.allowCustomValues || false,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    });

    const selectedType: VariantType = form.watch("type");
    const selectedCategories = form.watch("categoryIds");

    const filteredProductTypes = productTypes.filter(pt =>
        (selectedCategories && selectedCategories.length === 0) || (selectedCategories && selectedCategories.includes(pt.categoryId))
    );

    const { execute: executeCreate, isPending: isCreating } = useAction(createVariantTemplate, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                router.push(storeId ? `/admin/stores/${storeId}/variants` : '/admin/variants');
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: () => {
            toast.error("Failed to create variant template");
        },
    });

    const { execute: executeUpdate, isPending: isUpdating } = useAction(updateVariantTemplate, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                router.push(storeId ? `/admin/stores/${storeId}/variants` : '/admin/variants');
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: () => {
            toast.error("Failed to update variant template");
        },
    });

    const isPending = isCreating || isUpdating;

    const addOption = () => {
        append({
            value: "",
            label: "",
            additionalPrice: 0,
            sortOrder: fields.length,
            isDefault: false,
            isActive: true,
        });
    };

    const onSubmit = (values: z.infer<typeof VariantTemplateSchema>) => {
        if (mode === "create") {
            executeCreate(values);
        } else if (initialData) {
            executeUpdate({ ...values, templateId: initialData.$id });
        }
    };

    const getVariantTypeDescription = (type: VariantType) => {
        switch (type) {
            case VariantType.SELECT:
                return "Single selection from predefined options";
            case VariantType.MULTISELECT:
                return "Multiple selections from predefined options";
            case VariantType.COLOR:
                return "Color picker with predefined color options";
            case VariantType.BOOLEAN:
                return "Yes/No or True/False toggle";
            case VariantType.TEXT:
                return "Free text input";
            case VariantType.NUMBER:
                return "Numeric input with optional range";
            case VariantType.RANGE:
                return "Range slider with min/max values";
            default:
                return "";
        }
    };

    const needsOptions = [VariantType.SELECT, VariantType.MULTISELECT, VariantType.COLOR].includes(selectedType);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {React.createElement(VARIANT_TYPE_ICONS[selectedType] || List, { className: "h-5 w-5" })}
                        {mode === "create" ? "Create Variant Template" : "Edit Variant Template"}
                    </CardTitle>
                    <CardDescription>
                        {mode === "create"
                            ? "Create reusable variant templates that can be applied to multiple products"
                            : "Modify this variant template. Changes will affect all products using this template"
                        }
                    </CardDescription>
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="options" disabled={!needsOptions}>
                                Options {needsOptions && `(${fields.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Template Details</CardTitle>
                                    <div className="flex items-center gap-2">
                                        {!storeId && (
                                            <Badge variant="outline" className="text-xs">
                                                <Globe className="w-3 h-3 mr-1" />
                                                Global Template
                                            </Badge>
                                        )}
                                        {storeId && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Store className="w-3 h-3 mr-1" />
                                                Store Template
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Template Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Size, Color, Material" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        A clear, descriptive name for this variant type
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Variant Type *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select variant type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {Object.values(VariantType).map((type) => {
                                                                const Icon = VARIANT_TYPE_ICONS[type];
                                                                return (
                                                                    <SelectItem key={type} value={type}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className="w-4 h-4" />
                                                                            <div>
                                                                                <div className="font-medium capitalize">{type}</div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {getVariantTypeDescription(type)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe how this variant affects the product..."
                                                        className="min-h-[80px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Help store owners understand when to use this variant
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="isRequired"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Required Variant</FormLabel>
                                                        <FormDescription>
                                                            Customers must select this variant option
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="isActive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Active Template</FormLabel>
                                                        <FormDescription>
                                                            Available for use in products
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Category & Product Type Association</CardTitle>
                                    <CardDescription>
                                        Link this variant to specific categories or product types (optional)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="categoryIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Associated Categories</FormLabel>
                                                <FormDescription>
                                                    Leave empty to make available for all categories
                                                </FormDescription>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                                    {categories.map((category) => (
                                                        <div key={category.$id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`category-${category.$id}`}
                                                                checked={field.value?.includes(category.$id)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), category.$id]
                                                                        : (field.value || []).filter((id: string) => id !== category.$id);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`category-${category.$id}`}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {category.categoryName}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="productTypeIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Associated Product Types</FormLabel>
                                                <FormDescription>
                                                    Link to specific product types for targeted availability
                                                </FormDescription>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                                    {filteredProductTypes.map((productType) => (
                                                        <div key={productType.$id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`producttype-${productType.$id}`}
                                                                checked={field.value?.includes(productType.$id)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), productType.$id]
                                                                        : (field.value || []).filter((id: string) => id !== productType.$id);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`producttype-${productType.$id}`}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {productType.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="options" className="space-y-6">
                            {needsOptions ? (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">Variant Options</CardTitle>
                                                <CardDescription>
                                                    Define the available options for this variant
                                                </CardDescription>
                                            </div>
                                            <Button type="button" onClick={addOption} size="sm">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Option
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {fields.map((field, index) => (
                                                <Card key={field.id} className="border-dashed">
                                                    <CardContent className="pt-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <FormField
                                                                control={form.control}
                                                                name={`options.${index}.value`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Value</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="e.g., small, red" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name={`options.${index}.label`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Display Label</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="e.g., Small, Red" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name={`options.${index}.additionalPrice`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Price Modifier ($)</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                placeholder="0.00"
                                                                                {...field}
                                                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            {selectedType === VariantType.COLOR && (
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`options.${index}.hex`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Color Code</FormLabel>
                                                                            <FormControl>
                                                                                <div className="flex gap-2">
                                                                                    <Input
                                                                                        type="color"
                                                                                        className="w-12 h-10 p-1 border rounded"
                                                                                        {...field}
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="#000000"
                                                                                        className="flex-1"
                                                                                        {...field}
                                                                                    />
                                                                                </div>
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-4">
                                                            <div className="flex items-center space-x-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`options.${index}.isDefault`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex items-center space-x-2">
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="text-sm">Default</FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name={`options.${index}.isActive`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex items-center space-x-2">
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="text-sm">Active</FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => remove(index)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}

                                            {fields.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <div className="mb-4">
                                                        <List className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                                    </div>
                                                    <p>No options defined yet</p>
                                                    <p className="text-sm">Click &quot;Add Option&quot; to create variant options</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Alert>
                                    <AlertDescription>
                                        This variant type doesn&apos;t require predefined options.
                                        {selectedType === VariantType.TEXT && " Customers can enter custom text."}
                                        {selectedType === VariantType.NUMBER && " Customers can enter numeric values."}
                                        {selectedType === VariantType.BOOLEAN && " Customers can toggle this option on/off."}
                                        {selectedType === VariantType.RANGE && " Customers can select from a range of values."}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Advanced Configuration</CardTitle>
                                    <CardDescription>
                                        Additional settings for complex variant behaviors
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {selectedType === VariantType.MULTISELECT && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="minSelections"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Minimum Selections</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                {...field}
                                                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Minimum number of options customers must select
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="maxSelections"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Maximum Selections</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                {...field}
                                                                onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Maximum number of options customers can select (optional)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="allowCustomValues"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Allow Custom Values</FormLabel>
                                                    <FormDescription>
                                                        Let customers enter their own values in addition to predefined options
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Preview</CardTitle>
                                    <CardDescription>
                                        See how this variant will appear to customers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg p-4 bg-muted/50">
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{form.watch("name") || "Variant Name"}</span>
                                                {form.watch("isRequired") && (
                                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                                )}
                                            </div>
                                            {form.watch("description") && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {form.watch("description")}
                                                </p>
                                            )}
                                        </div>

                                        {selectedType === VariantType.SELECT && (
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fields.map((field, index) => {
                                                        const option = form.watch(`options.${index}`);
                                                        return (
                                                            <SelectItem key={field.id} value={option.value || ""}>
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span>{option.label || option.value}</span>
                                                                    {option.additionalPrice > 0 && (
                                                                        <Badge variant="outline" className="ml-2">
                                                                            +${option.additionalPrice}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {selectedType === VariantType.COLOR && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {fields.map((field, index) => {
                                                    const option = form.watch(`options.${index}`);
                                                    return (
                                                        <div key={field.id} className="text-center">
                                                            <div
                                                                className="w-8 h-8 rounded-full border mx-auto mb-1"
                                                                style={{ backgroundColor: option.hex || "#ccc" }}
                                                            />
                                                            <div className="text-xs">{option.label}</div>
                                                            {option.additionalPrice > 0 && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    +${option.additionalPrice}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {selectedType === VariantType.BOOLEAN && (
                                            <div className="flex items-center space-x-2">
                                                <Switch />
                                                <span className="text-sm">Enable this option</span>
                                            </div>
                                        )}

                                        {selectedType === VariantType.TEXT && (
                                            <Input placeholder="Enter custom text..." />
                                        )}

                                        {selectedType === VariantType.NUMBER && (
                                            <Input type="number" placeholder="Enter a number..." />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <Separator />

                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    {mode === "create" ? "Creating..." : "Updating..."}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {mode === "create" ? "Create Template" : "Update Template"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}