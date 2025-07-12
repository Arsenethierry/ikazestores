"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveModal } from "@/components/responsive-modal";
import { VariantInputType, VariantTemplateSchema } from "@/lib/schemas/product-variants-schema";
import { toast } from "sonner";
import { z } from "zod";
import { createVariantTemplate } from "@/features/categories/actions/products-variant-templates-action";
import { CurrentUserType } from "@/lib/types";

interface CreateVariantTemplateModalProps {
    productTypeId: string;
    storeId?: string;
    currentUser: CurrentUserType
}

type FormData = z.infer<typeof VariantTemplateSchema>;

export function CreateVariantTemplateModal({
    productTypeId,
    storeId,
    currentUser
}: CreateVariantTemplateModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(VariantTemplateSchema),
        defaultValues: {
            name: "",
            description: "",
            type: VariantInputType.SELECT,
            isRequired: false,
            productTypeId,
            storeId: storeId,
            createdBy: currentUser?.$id,
            isActive: true,
            options: [],
            minSelections: 0,
            allowCustomValues: false
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options"
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const result = await createVariantTemplate(data);

            if (result?.data?.success) {
                toast.success(result.data.success);
                setOpen(false);
                form.reset();
                window.location.reload();
            } else if (result?.data?.error) {
                toast.error(result.data.error);
            }
        } catch {
            toast.error("Failed to create variant template");
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
        isActive: true
    });
};

    const selectedType = form.watch("type");
    const needsOptions = [VariantInputType.SELECT, VariantInputType.MULTISELECT, VariantInputType.COLOR].includes(selectedType);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Variant Template
            </Button>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <Card className="w-full max-w-4xl border-0">
                    <CardHeader>
                        <CardTitle>Create Variant Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        onValueChange={(value) => form.setValue("type", value as VariantInputType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={VariantInputType.SELECT}>Select (Dropdown)</SelectItem>
                                            <SelectItem value={VariantInputType.MULTISELECT}>Multi-Select</SelectItem>
                                            <SelectItem value={VariantInputType.COLOR}>Color Picker</SelectItem>
                                            <SelectItem value={VariantInputType.BOOLEAN}>Yes/No Toggle</SelectItem>
                                            <SelectItem value={VariantInputType.TEXT}>Text Input</SelectItem>
                                            <SelectItem value={VariantInputType.NUMBER}>Number Input</SelectItem>
                                            <SelectItem value={VariantInputType.RANGE}>Range Slider</SelectItem>
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isRequired"
                                        checked={form.watch("isRequired")}
                                        onCheckedChange={(checked) => form.setValue("isRequired", checked)}
                                    />
                                    <Label htmlFor="isRequired">Required</Label>
                                </div>

                                {selectedType === VariantInputType.MULTISELECT && (
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

                                {[VariantInputType.TEXT, VariantInputType.SELECT].includes(selectedType) && (
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

                                                {selectedType === VariantInputType.COLOR && (
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

                                                <div className="flex items-center space-x-1">
                                                    <Switch
                                                        checked={form.watch(`options.${index}.isDefault`)}
                                                        onCheckedChange={(checked) => form.setValue(`options.${index}.isDefault`, checked)}
                                                    />
                                                    <Label className="text-xs">Default</Label>
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
                                    {isLoading ? "Creating..." : "Create Template"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </ResponsiveModal>
        </>
    );
}