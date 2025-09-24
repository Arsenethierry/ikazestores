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
import { UpdateCatalogCategorySchema } from '@/lib/schemas/catalog-schemas';
import { useUpdateCategory } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

type FormData = z.infer<typeof UpdateCatalogCategorySchema>;

interface EditCategoryModalProps {
    category: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditCategoryModal({
    category,
    open,
    onOpenChange
}: EditCategoryModalProps) {
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(category.iconUrl || null);

    const { execute: updateCategory, isExecuting } = useUpdateCategory();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(UpdateCatalogCategorySchema),
        defaultValues: {
            $id: category.$id,
            categoryName: category.categoryName,
            slug: category.slug,
            description: category.description || '',
            isActive: category.isActive,
            sortOrder: category.sortOrder,
        }
    });

    const categoryName = watch('categoryName');

    React.useEffect(() => {
        if (categoryName && categoryName !== category.categoryName) {
            const slug = categoryName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setValue('slug', slug);
        }
    }, [categoryName, setValue, category.categoryName]);

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
            formData.oldFileId = category.iconFileId;
        }

        updateCategory(formData);
        onOpenChange(false);
    }, [updateCategory, iconFile, category.iconFileId, onOpenChange]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            reset();
            setIconFile(null);
            setIconPreview(category.iconUrl || null);
        }
    }, [onOpenChange, reset, category.iconUrl]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>
                        Update the category information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="categoryName">Category Name *</Label>
                        <Input
                            id="categoryName"
                            {...register('categoryName')}
                            placeholder="e.g., Electronics, Clothing"
                        />
                        {errors.categoryName && (
                            <p className="text-sm text-destructive">{errors.categoryName.message}</p>
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
                            placeholder="Describe this category..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Category Icon</Label>
                        <div className="flex items-center space-x-4">
                            <Input
                                id="icon"
                                type="file"
                                accept="image/*"
                                onChange={handleIconChange}
                                className="flex-1"
                            />
                            {iconPreview && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
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
                                'Update Category'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}