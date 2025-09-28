'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Edit,
    MoreHorizontal,
    DollarSign,
    Palette as PaletteIcon,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreateVariantOption, useDeleteVariantOption, useUpdateVariantOption } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { getVariantOptionsForTemplate } from '@/lib/actions/catalog-server-actions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CatalogVariantOptionSchema } from '@/lib/schemas/catalog-schemas';
import { z } from 'zod';
import { CatalogVariantTemplates } from '@/lib/types/appwrite/appwrite';

type OptionFormData = z.infer<typeof CatalogVariantOptionSchema>;

interface ManageVariantOptionsModalProps {
    template: CatalogVariantTemplates;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const VariantOptionItem = React.memo<{
    option: any;
    inputType: string;
    onEdit: (option: any) => void;
    onDelete: (optionId: string) => void;
}>(({ option, inputType, onEdit, onDelete }) => {
    return (
        <Card className="transition-all hover:shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {inputType === 'color' && option.colorCode && (
                            <div
                                className="w-6 h-6 rounded-full border border-gray-200"
                                style={{ backgroundColor: option.colorCode }}
                            />
                        )}
                        <div>
                            <CardTitle className="text-sm">{option.label}</CardTitle>
                            <p className="text-xs text-muted-foreground">Value: {option.value}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {option.additionalPrice !== 0 && (
                            <Badge variant="outline" className="text-xs">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {option.additionalPrice > 0 ? '+' : ''}{option.additionalPrice}
                            </Badge>
                        )}

                        {option.isDefault && (
                            <Badge className="text-xs">Default</Badge>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(option)}>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(option.$id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
})

VariantOptionItem.displayName = 'VariantOptionItem';

export default function ManageVariantOptionsModal({
    template,
    open,
    onOpenChange
}: ManageVariantOptionsModalProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingOption, setEditingOption] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { execute: createOption, isExecuting: isCreating } = useCreateVariantOption();
    const { execute: updateOption, isExecuting: isUpdating } = useUpdateVariantOption();
    const { execute: deleteOption } = useDeleteVariantOption();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<OptionFormData>({
        resolver: zodResolver(CatalogVariantOptionSchema),
        defaultValues: {
            variantTemplateId: template.$id,
            additionalPrice: 0,
            isDefault: false,
            sortOrder: 0,
            isActive: true,
        }
    });

    useEffect(() => {
        if (open) {
            const loadOptions = async () => {
                try {
                    setLoading(true);
                    const result = await getVariantOptionsForTemplate({ variantTemplateId: template.$id });
                    if (result.success && result.data) {
                        setOptions(result.data.documents || []);
                    }
                } catch (error) {
                    console.error('Failed to load options:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadOptions();
        }
    }, [open, template.$id]);

    const onSubmitOption = useCallback(async (data: OptionFormData) => {
        if (editingOption) {
            // Update existing option
            updateOption({
                optionId: editingOption.$id,
                ...data
            });
        } else {
            // Create new option
            createOption(data);
        }

        setShowCreateForm(false);
        setEditingOption(null);
        reset();

        // Reload options after operation
        const result = await getVariantOptionsForTemplate({ variantTemplateId: template.$id });
        if (result.success && result.data) {
            setOptions(result.data.documents || []);
        }
    }, [createOption, updateOption, reset, template.$id, editingOption]);


    const handleEdit = useCallback((option: any) => {
        setEditingOption(option);
        // Populate form with option data
        Object.keys(option).forEach(key => {
            setValue(key as keyof OptionFormData, option[key]);
        });
        setShowCreateForm(true);
    }, [setValue]);

    const handleDelete = useCallback(async (optionId: string) => {
        deleteOption({ optionId });
        setOptions(prev => prev.filter(opt => opt.$id !== optionId));
    }, [deleteOption]);

    const handleCancelCreate = useCallback(() => {
        setShowCreateForm(false);
        setEditingOption(null);
        reset();
    }, [reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <PaletteIcon className="h-5 w-5" />
                        <span>Manage Options: {template.variantTemplateName}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Configure the available options for this variant template
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {!showCreateForm ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                    Options ({options.length})
                                </h4>
                                <Button
                                    size="sm"
                                    onClick={() => setShowCreateForm(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>

                            {loading ? (
                                <div className="text-center py-4">Loading options...</div>
                            ) : options.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <PaletteIcon className="h-8 w-8 text-muted-foreground mb-3" />
                                        <h3 className="text-sm font-semibold mb-2">No options yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Add the first option for this variant template
                                        </p>
                                        <Button size="sm" onClick={() => setShowCreateForm(true)}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Option
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {options.map((option) => (
                                        <VariantOptionItem
                                            key={option.$id}
                                            option={option}
                                            inputType={template.inputType}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmitOption)} className="space-y-4">
                            <h4 className="text-sm font-medium">
                                {editingOption ? 'Edit Option' : 'Add New Option'}
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="value">Value *</Label>
                                    <Input
                                        id="value"
                                        {...register('value')}
                                        placeholder="e.g., red, large, cotton"
                                    />
                                    {errors.value && (
                                        <p className="text-sm text-destructive">{errors.value.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label">Display Label *</Label>
                                    <Input
                                        id="label"
                                        {...register('label')}
                                        placeholder="e.g., Red, Large, Cotton"
                                    />
                                    {errors.label && (
                                        <p className="text-sm text-destructive">{errors.label.message}</p>
                                    )}
                                </div>
                            </div>

                            {template.inputType === 'color' && (
                                <div className="space-y-2">
                                    <Label htmlFor="colorCode">Color Code</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="colorCode"
                                            type="color"
                                            {...register('colorCode')}
                                            className="w-16 h-10 p-1 border rounded"
                                        />
                                        <Input
                                            {...register('colorCode')}
                                            placeholder="#FF0000"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="additionalPrice">Additional Price</Label>
                                    <Input
                                        id="additionalPrice"
                                        type="number"
                                        step="0.01"
                                        {...register('additionalPrice', { valueAsNumber: true })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sortOrder">Sort Order</Label>
                                    <Input
                                        id="sortOrder"
                                        type="number"
                                        {...register('sortOrder', { valueAsNumber: true })}
                                        min="0"
                                    />
                                </div>

                                <div className="flex items-end space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            {...register('isDefault')}
                                            className="rounded"
                                        />
                                        <Label htmlFor="isDefault" className="text-sm">Default</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelCreate}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {editingOption ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        editingOption ? 'Update Option' : 'Add Option'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}