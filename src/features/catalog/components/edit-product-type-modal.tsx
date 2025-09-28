'use client';

import React, { useCallback } from 'react';
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
import { UpdateCatalogProductTypeSchema } from '@/lib/schemas/catalog-schemas';
import { useUpdateProductType } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

type FormData = z.infer<typeof UpdateCatalogProductTypeSchema>;

interface EditProductTypeModalProps {
    productType: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditProductTypeModal({
    productType,
    open,
    onOpenChange
}: EditProductTypeModalProps) {
    const { execute: updateProductType, isExecuting } = useUpdateProductType();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(UpdateCatalogProductTypeSchema),
        defaultValues: {
            productTypeId: productType.$id,
            productTypeName: productType.productTypeName,
            slug: productType.slug,
            description: productType.description || '',
            isActive: productType.isActive,
            sortOrder: productType.sortOrder,
        }
    });

    const productTypeName = watch('productTypeName');

    React.useEffect(() => {
        if (productTypeName && productTypeName !== productType.productTypeName) {
            const slug = productTypeName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setValue('slug', slug);
        }
    }, [productTypeName, setValue, productType.productTypeName]);

    const onSubmit = useCallback(async (data: FormData) => {
        updateProductType(data);
        onOpenChange(false);
    }, [updateProductType, onOpenChange]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            reset();
        }
    }, [onOpenChange, reset]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Product Type</DialogTitle>
                    <DialogDescription>
                        Update the product type information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="productTypeName">Product Type Name *</Label>
                        <Input
                            id="productTypeName"
                            {...register('productTypeName')}
                            placeholder="e.g., Gaming Laptops, Running Shoes"
                        />
                        {errors.productTypeName && (
                            <p className="text-sm text-destructive">{errors.productTypeName.message}</p>
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
                            placeholder="Describe this product type..."
                            rows={3}
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
                                'Update Product Type'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}