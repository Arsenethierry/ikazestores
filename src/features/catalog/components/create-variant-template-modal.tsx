"use client";

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
    DialogTrigger,
} from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CatalogVariantTemplateSchema } from '@/lib/schemas/catalog-schemas';
import { useCreateVariantTemplate } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { Loader2, HelpCircle } from 'lucide-react';
import { z } from 'zod';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type FormData = z.infer<typeof CatalogVariantTemplateSchema>;

interface CreateVariantTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children?: React.ReactNode;
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

export default function CreateVariantTemplateModal({
    open,
    onOpenChange,
    children
}: CreateVariantTemplateModalProps) {
    const { execute: createTemplate, isExecuting } = useCreateVariantTemplate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(CatalogVariantTemplateSchema),
        defaultValues: {
            isRequired: false,
            isActive: true,
            sortOrder: 0,
            inputType: 'select',
        }
    });

    const selectedInputType = watch('inputType');

    const onSubmit = useCallback(async (data: FormData) => {
        createTemplate(data);
        onOpenChange(false);
        reset();
    }, [createTemplate, onOpenChange, reset]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            reset();
        }
    }, [onOpenChange, reset]);

    const getInputTypeDescription = useCallback((inputType: string) => {
        return inputTypeOptions.find(option => option.value === inputType)?.description || '';
    }, []);

    const modalContent = (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Variant Template</DialogTitle>
                    <DialogDescription>
                        Define a reusable variant configuration that can be applied to product types
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
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="inputType">Input Type *</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Determines how users will input variant values</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
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
                        {selectedInputType && (
                            <p className="text-sm text-muted-foreground">
                                {getInputTypeDescription(selectedInputType)}
                            </p>
                        )}
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

                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Scope Configuration</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                            Leave all fields empty to make this template available globally, or specify categories/subcategories/product types to limit its scope.
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <Label className="text-xs">Categories</Label>
                                <p className="text-muted-foreground">Configure after creation</p>
                            </div>
                            <div>
                                <Label className="text-xs">Subcategories</Label>
                                <p className="text-muted-foreground">Configure after creation</p>
                            </div>
                            <div>
                                <Label className="text-xs">Product Types</Label>
                                <p className="text-muted-foreground">Configure after creation</p>
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
                                    Creating...
                                </>
                            ) : (
                                'Create Template'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );

    if (children) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Variant Template</DialogTitle>
                        <DialogDescription>
                            Define a reusable variant configuration that can be applied to product types
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
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="inputType">Input Type *</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Determines how users will input variant values</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
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
                                        Creating...
                                    </>
                                ) : (
                                    'Create Template'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    }

    return modalContent;
}