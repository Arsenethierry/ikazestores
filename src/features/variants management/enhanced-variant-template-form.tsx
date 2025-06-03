/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Plus, X, ImageIcon, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

import { VariantTemplateSchema, VariantType } from "@/lib/schemas/product-variants-schema";
import Image from "next/image";
import { createVariantTemplate, updateVariantTemplate } from "../products/actions/variants management/products-variant-templates-action";

// Define proper type for options
type OptionType = {
    id: string;
    value: string;
    label: string;
    additionalPrice: number;
    image?: File;
    imagePreview?: string;
    sortOrder: number;
};

interface VariantTemplateFormProps {
    storeId?: string;
    userId: string;
    productTypes: { $id: string; name: string }[];
    editMode?: boolean;
    preSelectedProductType?: string;
    initialData?: z.infer<typeof VariantTemplateSchema> & {
        templateId?: string;
        createdBy?: string; // Add createdBy to initial data
    };
}

export default function EnhancedVariantTemplateForm({
    storeId,
    userId,
    productTypes,
    editMode = false,
    preSelectedProductType,
    initialData,
}: VariantTemplateFormProps) {
    const router = useRouter();

    const [options, setOptions] = useState<OptionType[]>(
        initialData?.options?.map((opt, index) => ({
            id: `temp-${index}`,
            value: opt.value,
            label: opt.label || opt.value,
            additionalPrice: opt.additionalPrice || 0,
            sortOrder: opt.sortOrder || index,
            imagePreview: typeof opt.image === 'string' ? opt.image : undefined
        })) || []
    );

    const form = useForm<z.infer<typeof VariantTemplateSchema> & { templateId?: string }>({
        resolver: zodResolver(
            editMode
                ? VariantTemplateSchema.extend({ templateId: z.string() })
                : VariantTemplateSchema
        ),
        defaultValues: initialData || {
            name: "",
            description: "",
            type: VariantType.SELECT,
            isRequired: false,
            options: [],
            defaultValue: "",
            priceModifier: 0,
            productType: preSelectedProductType || "",
            createdBy: userId,
            storeId: storeId || null,
        },
    });

    const { execute: executeCreate, isPending: isCreating } = useAction(createVariantTemplate, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success);
                router.push(`/admin/stores/${storeId}/variants`);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: (error) => {
            console.error("Template creation error:", error);
            toast.error("Failed to create variant template");
        },
    });

    const { execute: executeUpdate, isPending: isUpdating } = useAction(updateVariantTemplate, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success);
                router.push(`/admin/stores/${storeId}/variants`);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: (error) => {
            console.error("Template update error:", error);
            toast.error("Failed to update variant template");
        },
    });

    const isCreator = !editMode || initialData?.createdBy === userId;


    if (editMode && !isCreator) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>
                        You don&apos;t have permission to edit this variant template.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>
                            Only the creator of this variant template can make changes to it.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/stores/${storeId}/variants`)}
                        >
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const variantType = form.watch("type");
    const showOptions = [
        VariantType.SELECT,
        VariantType.COLOR,
        VariantType.MULTISELECT
    ].includes(variantType as VariantType);

    const handleAddOption = () => {
        const newOption: OptionType = {
            id: `temp-${Date.now()}`,
            value: "",
            label: "",
            additionalPrice: 0,
            sortOrder: options.length
        };
        setOptions([...options, newOption]);
    };

    // Handle removing an option
    const handleRemoveOption = (id: string) => {
        setOptions(options.filter(opt => opt.id !== id));
    };

    // Fixed handleOptionChange with proper typing
    const handleOptionChange = (id: string, field: keyof OptionType, value: string | number | File | undefined) => {
        setOptions(prevOptions => prevOptions.map(opt => {
            if (opt.id === id) {
                if (field === 'image') {
                    const file = value as File;
                    return {
                        ...opt,
                        [field]: file,
                        imagePreview: file ? URL.createObjectURL(file) : undefined
                    };
                }

                // Auto-fill label with value if label is empty
                if (field === 'value' && typeof value === 'string' && !opt.label) {
                    return { ...opt, [field]: value, label: value };
                }

                return { ...opt, [field]: value };
            }
            return opt;
        }));
    };

    // Handle moving options up/down
    const moveOption = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) ||
            (direction === 'down' && index === options.length - 1)) {
            return;
        }

        const newOptions = [...options];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap the items
        [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];

        // Update sort order
        newOptions.forEach((opt, i) => {
            opt.sortOrder = i;
        });

        setOptions(newOptions);
    };

    // Generate option values from a comma-separated list
    const generateOptions = (values: string) => {
        const trimmedValues = values.split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);

        if (trimmedValues.length === 0) {
            toast.error("Please enter comma-separated values");
            return;
        }

        const newOptions: OptionType[] = trimmedValues.map((value, index) => ({
            id: `temp-${Date.now()}-${index}`,
            value,
            label: value,
            additionalPrice: 0,
            sortOrder: index
        }));

        setOptions(newOptions);
    };

    function onSubmit(values: z.infer<typeof VariantTemplateSchema> & { templateId?: string }) {
        const formattedOptions = options.map(option => ({
            value: option.value,
            label: option.label || option.value,
            additionalPrice: option.additionalPrice,
            sortOrder: option.sortOrder,
            image: option.image
        }));

        const dataToSubmit = {
            ...values,
            options: formattedOptions,
            createdBy: userId
        };

        if (editMode && initialData && initialData.templateId) {
            executeUpdate({ ...dataToSubmit, templateId: initialData.templateId });
        } else {
            executeCreate(dataToSubmit);
        }
    }

    const isPending = isCreating || isUpdating;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{editMode ? "Edit Variant Template" : "Create Variant Template"}</CardTitle>
                <CardDescription>
                    {editMode
                        ? "Make changes to your existing variant template"
                        : "Define a new variant template that can be used across products"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variant Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Size, Color, Material" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            This is how the variant will appear to customers
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
                                        <FormLabel>Variant Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a variant type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={VariantType.SELECT}>Selection (Dropdown)</SelectItem>
                                                <SelectItem value={VariantType.COLOR}>Color Picker</SelectItem>
                                                <SelectItem value={VariantType.BOOLEAN}>Yes/No Toggle</SelectItem>
                                                <SelectItem value={VariantType.TEXT}>Text Input</SelectItem>
                                                <SelectItem value={VariantType.NUMBER}>Number Input</SelectItem>
                                                <SelectItem value={VariantType.MULTISELECT}>Multi-select</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            This determines how customers will select this variant
                                        </FormDescription>
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
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this variant is for"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="isRequired"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Required</FormLabel>
                                            <FormDescription>
                                                Is this variant mandatory for customers to select?
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
                                            Which product type this variant belongs to
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {!showOptions && (
                            <FormField
                                control={form.control}
                                name="priceModifier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price Modifier ($)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                step="0.01"
                                                {...field}
                                                value={field.value || 0}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Additional price when this variant is selected (can be 0)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Options section for SELECT, COLOR and MULTISELECT types */}
                        {showOptions && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Options</h3>
                                    <div className="flex space-x-2">
                                        <Button type="button" onClick={handleAddOption} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Option
                                        </Button>
                                    </div>
                                </div>

                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="bulk-add">
                                        <AccordionTrigger className="text-sm">
                                            Bulk Add Options
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2">
                                                <Label htmlFor="bulk-options">Enter comma-separated values</Label>
                                                <Textarea
                                                    id="bulk-options"
                                                    placeholder="Small, Medium, Large, Extra Large"
                                                    className="text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        const textarea = document.getElementById('bulk-options') as HTMLTextAreaElement;
                                                        generateOptions(textarea.value);
                                                        textarea.value = '';
                                                    }}
                                                >
                                                    Generate Options
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                {options.length === 0 && (
                                    <Alert>
                                        <AlertDescription>
                                            No options added yet. This variant type requires at least one option.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {options.map((option, index) => (
                                    <div key={option.id} className="flex flex-col gap-3 p-4 border rounded-md relative">
                                        <div className="absolute right-2 top-2 flex space-x-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => moveOption(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => moveOption(index, 'down')}
                                                disabled={index === options.length - 1}
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                                onClick={() => handleRemoveOption(option.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div>
                                                <Label className="text-sm">Value</Label>
                                                <Input
                                                    placeholder="Internal value (e.g. 'xl')"
                                                    value={option.value}
                                                    onChange={(e) => handleOptionChange(option.id, "value", e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Used internally for tracking and filters
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm">Display Label</Label>
                                                <Input
                                                    placeholder="Display label (e.g. 'Extra Large')"
                                                    value={option.label}
                                                    onChange={(e) => handleOptionChange(option.id, "label", e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Shown to customers in the store
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm">Additional Price ($)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                step="0.01"
                                                value={option.additionalPrice}
                                                onChange={(e) => handleOptionChange(option.id, "additionalPrice", Number(e.target.value))}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Extra cost when this option is selected
                                            </p>
                                        </div>

                                        {variantType === VariantType.COLOR && (
                                            <div className="space-y-2">
                                                <Label className="text-sm">Color Image (Optional)</Label>
                                                <div className="flex items-center space-x-2">
                                                    {option.imagePreview ? (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                height={100}
                                                                width={100}
                                                                src={option.imagePreview}
                                                                alt={option.label || option.value}
                                                                className="w-12 h-12 object-cover rounded-md border"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                                                                onClick={() => handleOptionChange(option.id, "image", undefined)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 border rounded-md flex items-center justify-center bg-muted">
                                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    handleOptionChange(option.id, "image", e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Upload a swatch or product image for this color
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Default value for non-option based types */}
                        {!showOptions && variantType !== VariantType.BOOLEAN && (
                            <FormField
                                control={form.control}
                                name="defaultValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default Value (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type={variantType === VariantType.NUMBER ? "number" : "text"}
                                                placeholder="Default value"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Pre-filled value when customers view this variant
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
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
                                disabled={isPending || (showOptions && options.length === 0)}
                            >
                                {isPending ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        {editMode ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {editMode ? "Update Template" : "Create Template"}
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