'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CatalogVariantTemplateSchema } from '@/lib/schemas/catalog-schemas';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { CatalogVariantTemplates } from '@/lib/types/appwrite/appwrite';
import { useUpdateVariantTemplate } from '@/hooks/queries-and-mutations/use-catalog-actions';

type FormData = z.infer<typeof CatalogVariantTemplateSchema>;

interface EditVariantTemplateModalProps {
    template: CatalogVariantTemplates;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const inputTypeOptions = [
    { value: 'text', label: 'Text Input', description: 'Free text input' },
    { value: 'color', label: 'Color Picker', description: 'Color selection with preview' },
    { value: 'range', label: 'Range Slider', description: 'Numeric range with min/max' },
    { value: 'number', label: 'Number Input', description: 'Numeric input field' },
    { value: 'select', label: 'Single Select', description: 'Choose one option from list' },
    { value: 'multiselect', label: 'Multi Select', description: 'Choose multiple options' },
    { value: 'boolean', label: 'Toggle Switch', description: 'True/false toggle' },
];

export default function EditVariantTemplateModal({
    template,
    open,
    onOpenChange
}: EditVariantTemplateModalProps) {
    const { execute: updateTemplate, isExecuting } = useUpdateVariantTemplate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<FormData>({
        resolver: zodResolver(CatalogVariantTemplateSchema),
        defaultValues: {
            variantTemplateName: template.variantTemplateName,
            description: template.description || '',
            inputType: template.inputType,
            isRequired: template.isRequired,
            isActive: template.isActive,
            sortOrder: template.sortOrder,
            categoryIds: template.categoryIds || [],
            subcategoryIds: template.subcategoryIds || [],
            productTypeIds: template.productTypeIds || [],
        }
    });

    const onSubmit = useCallback(async (data: FormData) => {
        updateTemplate({
            templateId: template.$id,
            ...data
        });
        onOpenChange(false);
    }, [updateTemplate, template.$id, onOpenChange]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            reset();
        }
    }, [onOpenChange, reset]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Variant Template</DialogTitle>
                    <DialogDescription>
                        Update the variant template configuration
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="variantTemplateName">Template Name *</Label>
                        <Input
                            id="variantTemplateName"
                            {...register('variantTemplateName')}
                            placeholder="e.g., Color, Size, Material"
                        />
                        {errors.variantTemplateName && (
                            <p className="text-sm text-destructive">{errors.variantTemplateName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Describe what this variant represents..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="inputType">Input Type *</Label>
                        <Controller
                            control={control}
                            name="inputType"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select input type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inputTypeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div>
                                                    <div className="font-medium">{option.label}</div>
                                                    <div className="text-sm text-muted-foreground">{option.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.inputType && (
                            <p className="text-sm text-destructive">{errors.inputType.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Input
                                id="sortOrder"
                                type="number"
                                {...register('sortOrder', { valueAsNumber: true })}
                                min="0"
                            />
                        </div>

                        <div className="space-y-4 pt-7">
                            <div className="flex items-center space-x-2">
                                <Controller
                                    control={control}
                                    name="isRequired"
                                    render={({ field }) => (
                                        <Switch
                                            id="isRequired"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                                <Label htmlFor="isRequired">Required Field</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Controller
                                    control={control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <Switch
                                            id="isActive"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isExecuting}>
                            {isExecuting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Template'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}