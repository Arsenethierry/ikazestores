'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssignVariantToProductTypeSchema } from '@/lib/schemas/catalog-schemas';
import { useAssignVariantToProductType } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { getCatalogVariantTemplates } from '@/lib/actions/catalog-server-actions';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

type FormData = z.infer<typeof AssignVariantToProductTypeSchema>;

interface AssignVariantModalProps {
    productTypeId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (assignment: any) => void;
}

export default function AssignVariantModal({
    productTypeId,
    open,
    onOpenChange,
    onSuccess
}: AssignVariantModalProps) {
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { execute: assignVariant, isExecuting, result } = useAssignVariantToProductType();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<FormData>({
        resolver: zodResolver(AssignVariantToProductTypeSchema),
        defaultValues: {
            productTypeId,
            isRequired: false,
            sortOrder: 0,
        }
    });

    useEffect(() => {
        if (open) {
            const loadTemplates = async () => {
                try {
                    setLoading(true);
                    const result = await getCatalogVariantTemplates({
                        includeInactive: false,
                        limit: 100
                    });
                    if (result.success && result.data) {
                        setAvailableTemplates(result.data.documents || []);
                    }
                } catch (error) {
                    console.error('Failed to load templates:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadTemplates();
        }
    }, [open]);

    const onSubmit = useCallback(async (data: FormData) => {
        try {
            await assignVariant(data);
            if (result && onSuccess) {
                onSuccess(result);
            }
            onOpenChange(false);
            reset();
        } catch (error) {
            console.error('Assignment failed:', error);
        }
    }, [assignVariant, onSuccess, onOpenChange, reset]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            reset();
        }
    }, [onOpenChange, reset]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Variant Template</DialogTitle>
                    <DialogDescription>
                        Choose a variant template to assign to this product type
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="variantTemplateId">Variant Template *</Label>
                        <Controller
                            control={control}
                            name="variantTemplateId"
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loading ? "Loading templates..." : "Select a template"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTemplates.map((template) => (
                                            <SelectItem key={template.$id} value={template.$id}>
                                                <div>
                                                    <div className="font-medium">{template.variantTemplateName}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {template.inputType} • {template.description}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.variantTemplateId && (
                            <p className="text-sm text-destructive">{errors.variantTemplateId.message}</p>
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

                        <div className="flex items-center space-x-2 pt-7">
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
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isExecuting || loading}>
                            {isExecuting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                'Assign Template'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}