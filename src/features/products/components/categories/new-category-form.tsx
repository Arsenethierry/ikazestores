"use client";

import CustomFormField, { FormFieldType } from '@/components/custom-field';
import ErrorAlert from '@/components/error-alert';
import { SingleImageUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl } from '@/components/ui/form';
import { useConfirm } from '@/hooks/use-confirm';
import { CategorySchema } from '@/lib/schemas/products-schems';
import { CurrentUserType, DocumentType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const NewCategoryForm = ({
    currentUser,
    initialValues = null
}: {
    currentUser: CurrentUserType,
    initialValues?: DocumentType | null
}) => {
    const isEditMode = !!initialValues;
    const router = useRouter();

    const [CancelDialog, confirmCancelEdit] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const form = useForm<z.infer<typeof CategorySchema>>({
        resolver: zodResolver(CategorySchema),
        defaultValues: {
            categoryName: initialValues?.categoryName ?? "",
            icon: initialValues?.iconUrl ?? undefined,
        },
        mode: "onChange",
    });

    const { formState: { dirtyFields } } = form;

    function onSubmit(values: z.infer<typeof CategorySchema>) {
        console.log("formm: ", values)
        if (!currentUser) {
            toast.error("Something went wrong, try again");
            return;
        }
        if (isEditMode && initialValues) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedValues: Record<string, any> = {};

            if (dirtyFields.categoryName) updatedValues.categoryName = values.categoryName;
            if (dirtyFields.icon) {
                updatedValues.storeLogo = values.icon;
                updatedValues.oldFileId = initialValues?.iconFileId ?? null;
            }

            if (Object.keys(updatedValues).length > 0) {
                // updateCategory(formData);
            } else {
                toast.info("No changes detected");
            }
        } else {
            // createCategory(values)
        }
    }

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    const isLoading = false
    // isCreatingStore || isUpdating;

    const error = null
    // isEditMode ? updateStoreResponse.data?.error : createStoreResponse.data?.error;


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
                                {isEditMode ? 'Save changes' : 'Create store'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}