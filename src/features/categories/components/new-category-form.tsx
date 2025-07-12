/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CustomFormField, { FormFieldType } from '@/components/custom-field';
import ErrorAlert from '@/components/error-alert';
import { SingleImageUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl } from '@/components/ui/form';
import { useConfirm } from '@/hooks/use-confirm';
import { CategorySchema, UpdateCategoryForm } from '@/lib/schemas/products-schems';
import { CurrentUserType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createNewCategory, updateCategory } from '../actions/categories-actions';
import { SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategories } from '@/features/variants management/ecommerce-catalog';

const getCategorySchema = (isEditMode: boolean) => {
    return isEditMode
        ? UpdateCategoryForm
        : CategorySchema;
};

export const CategoryForm = ({
    currentUser,
    initialValues = null,
    storeId
}: {
    currentUser: CurrentUserType,
    initialValues?: any | null,
    storeId: string | null
}) => {
    const isEditMode = !!initialValues;
    const router = useRouter();

    const formSchema = getCategorySchema(isEditMode);

    const {
        execute: updateCategoryAction,
        isPending: isUpdating,
        result: updateCategoryResponse
    } = useAction(updateCategory, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                if (storeId) {
                    router.push(`/admin/stores/${storeId}/categories`)
                } else {
                    router.push(`/admin/categories`)
                }
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    });

    const { execute: createCategoryAction,
        isPending: isCreatingCategory,
        result: createCategoryRes
    } = useAction(createNewCategory, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                if (storeId) {
                    router.push(`/admin/stores/${storeId}/categories`)
                } else {
                    router.push(`/admin/categories`)
                }
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })


    const [CancelDialog, confirmCancelEdit] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            storeId,
            categoryName: initialValues?.categoryName ?? '',
            subcategories: initialValues?.subcategoryIds?.length
                ? initialValues.subcategoryIds.map((id: string) => ({ id, name: "", slug: "" }))
                : [],
            slug: initialValues?.slug ?? "",
            icon: undefined,
            createdBy: currentUser!.$id,
            isActive: initialValues?.isActive ?? true,
            sortOrder: initialValues?.sortOrder ?? 0,
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (isEditMode && initialValues?.iconUrl) {
            form.setValue("icon", initialValues?.iconUrl)
        }
    }, [isEditMode, initialValues?.iconUrl, form])

    const { formState: { dirtyFields } } = form;

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentUser) {
            toast.error("Something went wrong, try again");
            return;
        }
        if (isEditMode && initialValues) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedValues: Record<string, any> = {};

            if (dirtyFields.categoryName) updatedValues.categoryName = values.categoryName;
            if (dirtyFields.slug) updatedValues.slug = values.slug;
            if (dirtyFields.icon) {
                updatedValues.storeLogo = values.icon;
                updatedValues.oldFileId = initialValues?.iconFileId ?? null;
            }

            if (Object.keys(updatedValues).length > 0) {
                const formData = {
                    ...updatedValues,
                    categoryId: initialValues.$id,
                    storeId
                }
                updateCategoryAction(formData);
            } else {
                toast.info("No changes detected");
            }
        } else {
            createCategoryAction(values as z.infer<typeof CategorySchema>)
        }
    }

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    const isLoading = isCreatingCategory || isUpdating;
    const error = isEditMode ? updateCategoryResponse.data?.error : createCategoryRes.data?.error;

    const addSubcategory = () => {
        const currentSubs = form.getValues("subcategories") || [];
        form.setValue("subcategories", [...currentSubs, { id: '', name: "", slug: "" }]);
    };

    const removeSubcategory = (index: number) => {
        const currentSubs = form.getValues("subcategories") || [];
        form.setValue("subcategories", currentSubs.filter((_, i) => i !== index));
    };

    return (
        <Card className='max-w-5xl'>
            <CancelDialog />
            <CardContent>
                {error && <ErrorAlert errorMessage={error} />}
                <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                        <CustomFormField
                            control={form.control}
                            name="categoryId"
                            label="Select Category"
                            fieldType={FormFieldType.SELECT}
                            placeholder="Select a category from static data"
                            disabled={isEditMode}
                        >
                            <SelectContent>
                                {getCategories().map((cat) => (
                                    <SelectTrigger key={cat.id} value={cat.id}>
                                        <SelectValue>{cat.name}</SelectValue>
                                    </SelectTrigger>
                                ))}
                            </SelectContent>
                        </CustomFormField>
                        <CustomFormField
                            control={form.control}
                            name="slug"
                            label="URL Slug"
                            fieldType={FormFieldType.INPUT}
                            placeholder="category-url-slug"
                        />
                        {form.watch("subcategories")?.map((sub, index) => (
                            <div key={index} className="flex gap-2">
                                <CustomFormField
                                    control={form.control}
                                    name={`subcategories.${index}.name`}
                                    label={`Subcategory ${index + 1} Name`}
                                    fieldType={FormFieldType.INPUT}
                                    placeholder="Enter subcategory name"
                                />
                                <CustomFormField
                                    control={form.control}
                                    name={`subcategories.${index}.slug`}
                                    label="Subcategory Slug"
                                    fieldType={FormFieldType.INPUT}
                                    placeholder="subcategory-url-slug"
                                // onChange={(value: string) => {
                                //     if (!value) {
                                //         const name = form.getValues(`subcategories.${index}.name`);
                                //         form.setValue(`subcategories.${index}.slug`, generateSlug(name));
                                //     }
                                // }}
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => removeSubcategory(index)}
                                    disabled={isLoading}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addSubcategory}
                            disabled={isLoading}
                        >
                            Add Subcategory
                        </Button>
                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="icon"
                            label="Category Thumbnail (Ratio 1:1)"
                            renderSkeleton={(field) => (
                                <FormControl>
                                    <SingleImageUploader
                                        file={field.value}
                                        onChange={field.onChange}
                                        caption="SVG, PNG, JPG or GIF (Ratio 1:1)"
                                        imageHeight={100}
                                        imageWidth={100}
                                        isEditMode={isEditMode}
                                    />
                                </FormControl>
                            )}
                        />
                        <CustomFormField
                            control={form.control}
                            name="isActive"
                            label="Is Active"
                            fieldType={FormFieldType.CHECKBOX}
                        />
                        <CustomFormField
                            control={form.control}
                            name="sortOrder"
                            label="Sort Order"
                            fieldType={FormFieldType.NUMBER_INPUT}
                            placeholder="Enter sort order"
                            min={0}
                        />
                        <div className="flex justify-between items-center">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                <Loader className={isLoading ? "animate-spin" : "hidden"} />{" "}
                                {isEditMode ? "Save Changes" : "Add to Store"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}