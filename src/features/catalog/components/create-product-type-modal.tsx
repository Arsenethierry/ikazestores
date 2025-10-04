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
    DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CatalogProductTypeSchema } from '@/lib/schemas/catalog-schemas';
import { useCreateProductType } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

type FormData = z.infer<typeof CatalogProductTypeSchema>;

interface CreateProductTypeModalProps {
    subcategoryId: string;
    categoryId?: string;
    children: React.ReactNode;
}

export default function CreateProductTypeModal({
    subcategoryId,
    categoryId,
    children
}: CreateProductTypeModalProps) {
    const [open, setOpen] = useState(false);
    const { execute: createProductType, isExecuting } = useCreateProductType();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(CatalogProductTypeSchema),
        defaultValues: {
            subcategoryId,
            categoryId: categoryId || '',
            isActive: true,
            sortOrder: 0,
        }
    });

    const productTypeName = watch('productTypeName');

    React.useEffect(() => {
        if (productTypeName) {
            const slug = productTypeName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setValue('slug', slug);
        }
    }, [productTypeName, setValue]);

    const onSubmit = useCallback(async (data: FormData) => {
        createProductType(data);
        setOpen(false);
        reset();
    }, [createProductType, reset]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            reset();
        }
    }, [reset]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-auto max-w-[min(95vw,48rem)] overflow-x-hidden overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>Create New Product Type</DialogTitle>
                    <DialogDescription>
                        Add a new product type to this subcategory
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
                                defaultChecked={true}
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
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
                                'Create Product Type'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}