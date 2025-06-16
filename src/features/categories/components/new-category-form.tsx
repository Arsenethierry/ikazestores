"use client";

import CustomFormField, { FormFieldType } from '@/components/custom-field';
import ErrorAlert from '@/components/error-alert';
import { SingleImageUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl } from '@/components/ui/form';
import { useConfirm } from '@/hooks/use-confirm';
import { CategorySchema, UpdateCategoryForm } from '@/lib/schemas/products-schems';
import { CategoryTypes, CurrentUserType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createNewCategory, updateCategory } from '../actions/categories-actions';

const getCategorySchema = (isEditMode: boolean) => {
    return isEditMode
        ? UpdateCategoryForm
        : CategorySchema;
};

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const CategoryForm = ({
    currentUser,
    initialValues = null,
    storeId
}: {
    currentUser: CurrentUserType,
    initialValues?: CategoryTypes | null,
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
            categoryName: initialValues?.categoryName ?? "",
            slug: initialValues?.slug ?? "",
            icon: undefined,
            storeId,
            createdBy: currentUser!.$id
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (isEditMode && initialValues?.iconUrl) {
            form.setValue("icon", initialValues?.iconUrl)
        }
    }, [isEditMode, initialValues?.iconUrl, form])

    // Auto-generate slug when category name changes (only in create mode)
    useEffect(() => {
        if (!isEditMode) {
            const subscription = form.watch((value, { name }) => {
                if (name === 'categoryName' && value.categoryName) {
                    const slug = generateSlug(value.categoryName);
                    form.setValue('slug', slug);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [form, isEditMode]);

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
                    categoryId: initialValues.$id
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
    console.log("hhhh: ", form.formState.errors)
    return (
        <Card className='max-w-5xl'>
            <CancelDialog />
            <CardContent>
                {error && <ErrorAlert errorMessage={error} />}
                <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                        <CustomFormField
                            control={form.control}
                            name="categoryName"
                            label='Category Name'
                            fieldType={FormFieldType.INPUT}
                            placeholder='Category Name'
                        />
                        <CustomFormField
                            control={form.control}
                            name="slug"
                            label='URL Slug'
                            fieldType={FormFieldType.INPUT}
                            placeholder='category-url-slug'
                        // description={!isEditMode ? "This will be auto-generated from the category name" : "URL-friendly version of the category name"}
                        />
                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="icon"
                            label="Category thumbnail(Ratio 1:1)"
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
                        <div className="flex justify-between items-center">
                            <Button
                                type="button"
                                variant={'destructive'}
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                <Loader className={isLoading ? "animate-spin" : "hidden"} /> {" "}
                                {isEditMode ? 'Save changes' : 'Create category'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}