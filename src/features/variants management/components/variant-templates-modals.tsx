"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Edit, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/responsive-modal";
import { VariantTemplateSchema, VariantType } from "@/lib/schemas/product-variants-schema";
import { VariantTemplate } from "@/lib/types";
import { toast } from "sonner";
import { z } from "zod";
import { deleteVariantTemplate, updateVariantTemplate } from "@/features/categories/actions/products-variant-templates-action";
import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";

// View Variant Template Modal
interface ViewVariantTemplateModalProps {
    template: VariantTemplate;
    children: React.ReactNode;
}

export function ViewVariantTemplateModal({ template, children }: ViewVariantTemplateModalProps) {
    const [open, setOpen] = useState(false);

    const getTypeColor = (type: string) => {
        const colors = {
            'select': 'bg-blue-100 text-blue-800',
            'multiselect': 'bg-purple-100 text-purple-800',
            'color': 'bg-pink-100 text-pink-800',
            'boolean': 'bg-green-100 text-green-800',
            'text': 'bg-gray-100 text-gray-800',
            'number': 'bg-orange-100 text-orange-800',
            'range': 'bg-indigo-100 text-indigo-800'
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {children}
            </div>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <Card className="w-full max-w-3xl border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {template.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Template Name</Label>
                                <p className="text-lg">{template.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Input Type</Label>
                                <Badge className={getTypeColor(template.type)}>
                                    {template.type}
                                </Badge>
                            </div>
                        </div>

                        {template.description && (
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                                <p>{template.description}</p>
                            </div>
                        )}

                        {/* Settings */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Required</Label>
                                <Badge variant={template.isRequired ? "destructive" : "secondary"}>
                                    {template.isRequired ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Scope</Label>
                                <Badge variant={template.storeId ? "default" : "outline"}>
                                    {template.storeId ? "Store Specific" : "Global"}
                                </Badge>
                            </div>
                            {template.minSelections !== undefined && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Min Selections</Label>
                                    <p>{template.minSelections}</p>
                                </div>
                            )}
                            {template.maxSelections && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Max Selections</Label>
                                    <p>{template.maxSelections}</p>
                                </div>
                            )}
                        </div>

                        {template.defaultValue && (
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Default Value</Label>
                                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{template.defaultValue}</p>
                            </div>
                        )}

                        {/* Options */}
                        {template.options && template.options.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Options ({template.options.length})
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    {template.options.map((option, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                                            <div className="flex items-center gap-3">
                                                {option.colorCode && (
                                                    <div
                                                        className="w-6 h-6 rounded border"
                                                        style={{ backgroundColor: option.colorCode }}
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{option.label || option.value}</p>
                                                    {option.value !== option.label && (
                                                        <p className="text-xs text-muted-foreground font-mono">{option.value}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {option.additionalPrice !== 0 && (
                                                <Badge variant="outline">
                                                    {option.additionalPrice > 0 ? '+' : ''}${option.additionalPrice}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="pt-6 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                                    <p>{new Date(template.$createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                                    <p>{new Date(template.$updatedAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </ResponsiveModal>
        </>
    );
}

// Edit Variant Template Modal - FIXED VERSION
interface EditVariantTemplateModalProps {
    template: VariantTemplate;
    storeId?: string;
    productTypeId: string;
    children: React.ReactNode;
}

type FormData = z.infer<typeof VariantTemplateSchema>;

export function EditVariantTemplateModal({
    template,
    storeId,
    productTypeId,
    children
}: EditVariantTemplateModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { data: user } = useCurrentUser();

    const form = useForm<FormData>({
        resolver: zodResolver(VariantTemplateSchema),
        defaultValues: {
            name: template.name,
            description: template.description || "",
            type: template.inputType as VariantType, // Fixed: use inputType from template
            isRequired: template.isRequired,
            productTypeId: productTypeId, // Fixed: single productTypeId
            storeId: storeId,
            createdBy: user?.$id || "",
            isActive: true,
            options: template.options?.map(option => ({
                value: option.value,
                label: option.name || option.value, // Fixed: use name field
                additionalPrice: option.additionalPrice || 0,
                hex: option.colorCode || "", // Fixed: use colorCode field
                sortOrder: option.sortOrder || 0,
                isDefault: option.isDefault || false, // Added isDefault
                isActive: option.isActive ?? true // Added isActive
            })) || [],
            defaultValue: template.defaultValue || "",
            minSelections: template.minSelections || 0,
            maxSelections: template.maxSelections,
            allowCustomValues: template.allowCustomValues || false
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options"
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const result = await updateVariantTemplate({
                ...data,
                templateId: template.$id
            });

            if (result?.data?.success) {
                toast.success(result.data.success);
                setOpen(false);
                window.location.reload();
            } else if (result?.data?.error) {
                toast.error(result.data.error);
            }
        } catch {
            toast.error("Failed to update variant template");
        } finally {
            setIsLoading(false);
        }
    };

    const addOption = () => {
        append({
            value: "",
            label: "",
            additionalPrice: 0,
            sortOrder: fields.length,
            isDefault: false,
            isActive: true,
            hex: ""
        });
    };

    const selectedType = form.watch("type");
    const needsOptions = [VariantType.SELECT, VariantType.MULTISELECT, VariantType.COLOR].includes(selectedType);

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {children}
            </div>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <Card className="w-full max-w-4xl border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit Variant Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Template Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Storage, Color, Size"
                                        {...form.register("name")}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Input Type *</Label>
                                    <Select
                                        value={form.watch("type")}
                                        onValueChange={(value) => form.setValue("type", value as VariantType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={VariantType.SELECT}>Select (Dropdown)</SelectItem>
                                            <SelectItem value={VariantType.MULTISELECT}>Multi-Select</SelectItem>
                                            <SelectItem value={VariantType.COLOR}>Color Picker</SelectItem>
                                            <SelectItem value={VariantType.BOOLEAN}>Yes/No Toggle</SelectItem>
                                            <SelectItem value={VariantType.TEXT}>Text Input</SelectItem>
                                            <SelectItem value={VariantType.NUMBER}>Number Input</SelectItem>
                                            <SelectItem value={VariantType.RANGE}>Range Slider</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what this variant template represents"
                                    {...form.register("description")}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-3 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isRequired"
                                        checked={form.watch("isRequired")}
                                        onCheckedChange={(checked) => form.setValue("isRequired", checked)}
                                    />
                                    <Label htmlFor="isRequired">Required</Label>
                                </div>

                                {selectedType === VariantType.MULTISELECT && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="minSelections">Min Selections</Label>
                                            <Input
                                                id="minSelections"
                                                type="number"
                                                min="0"
                                                {...form.register("minSelections", { valueAsNumber: true })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="maxSelections">Max Selections</Label>
                                            <Input
                                                id="maxSelections"
                                                type="number"
                                                min="1"
                                                {...form.register("maxSelections", { valueAsNumber: true })}
                                            />
                                        </div>
                                    </>
                                )}

                                {[VariantType.TEXT, VariantType.SELECT].includes(selectedType) && (
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="allowCustomValues"
                                            checked={form.watch("allowCustomValues")}
                                            onCheckedChange={(checked) => form.setValue("allowCustomValues", checked)}
                                        />
                                        <Label htmlFor="allowCustomValues">Allow Custom Values</Label>
                                    </div>
                                )}
                            </div>
                            {!needsOptions && (
                                <div className="space-y-2">
                                    <Label htmlFor="defaultValue">Default Value</Label>
                                    <Input
                                        id="defaultValue"
                                        placeholder="Enter default value"
                                        {...form.register("defaultValue")}
                                    />
                                </div>
                            )}
                            {needsOptions && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Options</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Option
                                        </Button>
                                    </div>

                                    {fields.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                                            No options added yet. Click &quot;Add Option&quot; to get started.
                                        </p>
                                    )}

                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-3 p-3 border rounded">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Value</Label>
                                                        <Input
                                                            placeholder="option-value"
                                                            {...form.register(`options.${index}.value`)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Display Label</Label>
                                                        <Input
                                                            placeholder="Display Name"
                                                            {...form.register(`options.${index}.label`)}
                                                        />
                                                    </div>
                                                </div>

                                                {selectedType === VariantType.COLOR && (
                                                    <div>
                                                        <Label className="text-xs">Hex Color</Label>
                                                        <Input
                                                            type="color"
                                                            className="w-16 h-8"
                                                            {...form.register(`options.${index}.hex`)}
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <Label className="text-xs">Price +/-</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-20"
                                                        {...form.register(`options.${index}.additionalPrice`, { valueAsNumber: true })}
                                                    />
                                                </div>

                                                <div className="flex flex-col items-center space-y-1">
                                                    <Switch
                                                        checked={form.watch(`options.${index}.isDefault`)}
                                                        onCheckedChange={(checked) => {
                                                            // Only allow one default option for single-select
                                                            if (checked && selectedType === VariantType.SELECT) {
                                                                // Clear other defaults
                                                                fields.forEach((_, idx) => {
                                                                    if (idx !== index) {
                                                                        form.setValue(`options.${idx}.isDefault`, false);
                                                                    }
                                                                });
                                                            }
                                                            form.setValue(`options.${index}.isDefault`, checked);
                                                        }}
                                                    />
                                                    <Label className="text-xs">Default</Label>
                                                </div>

                                                <div className="flex flex-col items-center space-y-1">
                                                    <Switch
                                                        checked={form.watch(`options.${index}.isActive`)}
                                                        onCheckedChange={(checked) => form.setValue(`options.${index}.isActive`, checked)}
                                                    />
                                                    <Label className="text-xs">Active</Label>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => remove(index)}
                                                    className="text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    {fields.length > 0 && (
                                        <div className="p-3 bg-muted/50 rounded text-sm">
                                            <p className="font-medium">Options Summary:</p>
                                            <p>• Total: {fields.length} option(s)</p>
                                            <p>• Default: {fields.filter((_, idx) => form.watch(`options.${idx}.isDefault`)).length} option(s)</p>
                                            <p>• Active: {fields.filter((_, idx) => form.watch(`options.${idx}.isActive`)).length} option(s)</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Update Template"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </ResponsiveModal>
        </>
    );
}

interface DeleteVariantTemplateModalProps {
    template: VariantTemplate;
    storeId?: string;
    children: React.ReactNode;
}

export function DeleteVariantTemplateModal({
    template,
    children
}: DeleteVariantTemplateModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const result = await deleteVariantTemplate({
                templateId: template.$id,
            });

            if (result?.data?.success) {
                toast.success(result.data.success);
                setOpen(false);
                window.location.reload();
            } else if (result?.data?.error) {
                toast.error(result.data.error);
            }
        } catch {
            toast.error("Failed to delete variant template");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {children}
            </div>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <Card className="w-full max-w-md border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete Variant Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p>Are you sure you want to delete the variant template:</p>
                            <p className="font-medium bg-muted p-2 rounded">
                                {template.name}
                            </p>
                        </div>

                        {template.options && template.options.length > 0 && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                <p className="text-sm text-amber-800">
                                    ⚠️ This will also delete {template.options.length} variant option(s) associated with this template.
                                </p>
                            </div>
                        )}

                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                            <p className="text-sm text-destructive">
                                🚨 This action cannot be undone. Any products using this variant template may be affected.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? "Deleting..." : "Delete Template"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </ResponsiveModal>
        </>
    );
}