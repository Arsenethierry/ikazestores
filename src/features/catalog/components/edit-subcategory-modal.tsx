'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCatalogSubcategorySchema } from '@/lib/schemas/catalog-schemas';
import { useUpdateSubcategory } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

type FormData = z.infer<typeof UpdateCatalogSubcategorySchema>;

interface EditSubcategoryModalProps {
    subcategory: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditSubcategoryModal({
    subcategory,
    open,
    onOpenChange
}: EditSubcategoryModalProps) {
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(subcategory.iconUrl || null);

    const { execute: updateSubcategory, isExecuting } = useUpdateSubcategory();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(UpdateCatalogSubcategorySchema),
        defaultValues: {
            subcategoryId: subcategory.$id,
            $id: subcategory.$id,
            subCategoryName: subcategory.subCategoryName,
            categoryId: subcategory.categoryId,
            slug: subcategory.slug,
            description: subcategory.description || '',
            isActive: subcategory.isActive,
            sortOrder: subcategory.sortOrder,
        }
    });

    const subcategoryName = watch('subCategoryName');

    // Auto-generate slug from subcategory name when name changes
    React.useEffect(() => {
        if (subcategoryName && subcategoryName !== subcategory.subCategoryName) {
            const slug = subcategoryName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setValue('slug', slug);
        }
    }, [subcategoryName, setValue, subcategory.subCategoryName]);

    const handleIconChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIconFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setIconPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const onSubmit = useCallback(async (data: FormData) => {
        const formData = { ...data };
        if (iconFile) {
            formData.icon = iconFile;
            formData.oldFileId = subcategory.iconFileId;
        }

        updateSubcategory(formData);
        onOpenChange(false);
    }, [updateSubcategory, iconFile, subcategory.iconFileId, onOpenChange]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            reset();
            setIconFile(null);
            setIconPreview(subcategory.iconUrl || null);
        }
    }, [onOpenChange, reset, subcategory.iconUrl]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-auto max-w-[min(95vw,48rem)] overflow-x-hidden overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>Edit Subcategory</DialogTitle>
                    <DialogDescription>
                        Update the subcategory information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subCategoryName">Subcategory Name *</Label>
                        <Input
                            id="subCategoryName"
                            {...register('subCategoryName')}
                            placeholder="e.g., Smartphones, Laptops"
                        />
                        {errors.subCategoryName && (
                            <p className="text-sm text-destructive">{errors.subCategoryName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug *</Label>
                        <Input
                            id="slug"
                            {...register('slug')}
                            placeholder="auto-generated from name"
                        />
                        {errors.slug && (
                            <p className="text-sm text-destructive">{errors.slug.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Describe this subcategory..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Subcategory Icon</Label>
                        <div className="flex items-center space-x-4">
                            <Input
                                id="icon"
                                type="file"
                                accept="image/*"
                                onChange={handleIconChange}
                                className="flex-1"
                            />
                            {iconPreview && (
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                                    <img
                                        src={iconPreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
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

                        <div className="flex items-center space-x-2 pt-7">
                            <Switch
                                id="isActive"
                                {...register('isActive')}
                            />
                            <Label htmlFor="isActive">Active</Label>
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
                                'Update Subcategory'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}