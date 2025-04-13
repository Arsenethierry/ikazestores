"use client";

import CustomFormField, { FormFieldType } from '@/components/custom-field';
import ErrorAlert from '@/components/error-alert';
import { SingleImageUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormLabel } from '@/components/ui/form';
import { useConfirm } from '@/hooks/use-confirm';
import { SubCategorySchema, UpdateSubCategoryForm } from '@/lib/schemas/products-schems';
import { CurrentUserType, DocumentType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createSubCategory, updateSubCategory } from '../actions/sub-categories-actions';
import MultipleSelector, { type Option } from '@/components/ui/multiselect';

interface Props {
    currentUser: CurrentUserType,
    initialValues?: DocumentType | null,
    categoriesOptions: Option[],
    storeId: string | null
}

const getSubCategorySchema = (isEditMode: boolean) => {
    return isEditMode
        ? UpdateSubCategoryForm
        : SubCategorySchema;
};

export const SubCategoryForm = ({
    currentUser,
    initialValues = null,
    categoriesOptions,
    storeId
}: Props) => {
    const isEditMode = !!initialValues;
    const router = useRouter();

    const formSchema = getSubCategorySchema(isEditMode);

    const {
        execute: updateCategoryAction,
        isPending: isUpdating,
        result: updateSubCategoryResponse
    } = useAction(updateSubCategory, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                if (storeId) {
                    router.push(`/admin/stores/${storeId}/subcategories`)
                } else {
                    router.push(`/admin/subcategories`)
                }
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    });

    const { execute: createSubCategoryAction,
        isPending: isCreatingSubCategory,
        result: createSubCategoryRes
    } = useAction(createSubCategory, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                if (storeId) {
                    router.push(`/admin/stores/${storeId}/subcategories`)
                } else {
                    router.push(`/admin/subcategories`)
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
            subCategoryName: initialValues?.subCategoryName ?? "",
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

    const { formState: { dirtyFields } } = form;

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentUser) {
            toast.error("Something went wrong, try again");
            return;
        }
        if (isEditMode && initialValues) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedValues: Record<string, any> = {};

            if (dirtyFields.subCategoryName) updatedValues.subCategoryName = values.subCategoryName;
            if (dirtyFields.icon) {
                updatedValues.storeLogo = values.icon;
                updatedValues.oldFileId = initialValues?.iconFileId ?? null;
            }

            if (Object.keys(updatedValues).length > 0) {
                const formData = {
                    ...updatedValues,
                    subCategoryId: initialValues.$id
                }
                updateCategoryAction(formData);
            } else {
                toast.info("No changes detected");
            }
        } else {
            createSubCategoryAction(values as z.infer<typeof SubCategorySchema>)
        }
    }

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    const isLoading = isCreatingSubCategory || isUpdating;

    const error = isEditMode ? updateSubCategoryResponse.data?.error : createSubCategoryRes.data?.error;

    return (
        <>
            <Card className='max-w-5xl'>
                <CancelDialog />
                <CardContent>
                    {error && <ErrorAlert errorMessage={error} />}
                    <Form {...form}>
                        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                            <FormField
                                control={form.control}
                                name="parentCategoryIds"
                                render={({ field }) => (
                                    <>
                                        <FormLabel>Parent Categories</FormLabel>
                                        <MultipleSelector
                                            defaultOptions={categoriesOptions}
                                            placeholder="Select parent categories"
                                            emptyIndicator={
                                                <p className="text-center text-sm">No categories found</p>
                                            }
                                            maxSelected={3}
                                            hideClearAllButton
                                            value={
                                                field.value && Array.isArray(field.value)
                                                    ? field.value.map(id => {
                                                        const option = categoriesOptions.find(opt => opt.value === id);
                                                        return option || { value: id, label: id };
                                                    })
                                                    : []
                                            }
                                            onChange={(selected) => {
                                                field.onChange(selected.map(option => option.value));
                                            }}
                                        />
                                    </>
                                )}
                            />
                            <CustomFormField
                                control={form.control}
                                name="subCategoryName"
                                label='sub-Category Name'
                                fieldType={FormFieldType.INPUT}
                                placeholder='Category Name'
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
                                    {isEditMode ? 'Save changes' : 'Create sub-category'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}