"use client";

import CustomFormField, { FormFieldType } from "@/components/custom-field";
import ErrorAlert from "@/components/error-alert";
import { SingleImageUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useConfirm } from "@/hooks/use-confirm";
import { CollectionSchema, UpdateCollectionForm } from "@/lib/schemas/products-schems";
import { CollectionTypes, CurrentUserType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createNewCollection } from "../actions/collections-actions";

const getCollectionSchema = (isEditMode: boolean) => {
    return isEditMode
        ? UpdateCollectionForm
        : CollectionSchema;
};

export const CollectionForm = ({
    currentUser,
    initialValues = null,
    storeId,
}: {
    currentUser: CurrentUserType,
    initialValues?: CollectionTypes | null,
    storeId: string | null;
}) => {
    const isEditMode = !!initialValues;
    const router = useRouter();

    const formSchema = getCollectionSchema(isEditMode);

    // const {
    //     execute: updateCollectionAction,
    //     isPending: isUpdating,
    //     result: updateCollectionResponse
    // } = useAction(updateCollection, {
    //     onSuccess: ({ data }) => {
    //         if (data?.success) {
    //             toast.success(data?.success)
    //             if (storeId) {
    //                 router.push(`/admin/stores/${storeId}/collections`)
    //             } else {
    //                 router.push(`/admin/collections`)
    //             }
    //         } else if (data?.error) {
    //             toast.error(data?.error)
    //         }
    //     },
    //     onError: ({ error }) => {
    //         toast.error(error.serverError)
    //     }
    // });

    const {
        execute: createCollectionAction,
        isPending: isCreatingCollection,
        result: createCollectionRes
    } = useAction(createNewCollection, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                if (storeId) {
                    router.push(`/admin/stores/${storeId}/collections`)
                } else {
                    router.push(`/admin/collections`)
                }
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    });

    const [CancelDialog, confirmCancelEdit] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            collectionName: initialValues?.name ?? "",
            description: initialValues?.description ?? "",
            type: initialValues?.type ?? "simple",
            featured: initialValues?.featured ?? false,
            bannerImage: undefined,
            storeId,
            createdBy: currentUser!.$id
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (isEditMode && initialValues?.bannerImageUrl) {
            form.setValue("bannerImage", initialValues?.bannerImageUrl)
        }
    }, [isEditMode, initialValues?.bannerImageUrl, form]);

    const { formState: { dirtyFields } } = form;

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentUser) {
            toast.error("Something went wrong, try again");
            return;
        }
        if (isEditMode && initialValues) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedValues: Record<string, any> = {};

            if (dirtyFields.collectionName) updatedValues.name = values.collectionName;
            if (dirtyFields.description) updatedValues.description = values.description;
            if (dirtyFields.type) updatedValues.type = values.type;
            if (dirtyFields.featured) updatedValues.featured = values.featured;
            if (dirtyFields.bannerImage) {
                updatedValues.bannerImage = values.bannerImage;
                updatedValues.oldFileId = initialValues?.bannerImageFileId ?? null;
            }

            if (Object.keys(updatedValues).length > 0) {
                const formData = {
                    ...updatedValues,
                    collectionId: initialValues.$id
                }
                console.log(formData)
                // updateCollectionAction(formData);
            } else {
                toast.info("No changes detected");
            }
        } else {
            createCollectionAction(values as z.infer<typeof CollectionSchema>)
        }
    };

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    // const isLoading = isCreatingCollection || isUpdating;
    const isLoading = isCreatingCollection;

    // const error = isEditMode ? updateCollectionResponse.data?.error : createCollectionRes.data?.error;
    const error = createCollectionRes.data?.error;

    return (
        <Card className='max-w-5xl'>
            <CancelDialog />
            <CardContent>
                {error && <ErrorAlert errorMessage={error} />}
                <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                        <CustomFormField
                            control={form.control}
                            name="collectionName"
                            label='Collection Name'
                            fieldType={FormFieldType.INPUT}
                            placeholder='Collection Name'
                        />
                        <CustomFormField
                            control={form.control}
                            name="description"
                            label='Collection Description'
                            fieldType={FormFieldType.TEXTAREA}
                            placeholder='Describe this collection'
                        />
                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="type"
                            label="Collection Type"
                            renderSkeleton={(field) => (
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="simple" id="simple" />
                                            <Label htmlFor="simple">Simple Collection (Products only)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="grouped" id="grouped" />
                                            <Label htmlFor="grouped">Grouped Collection (Products with sections)</Label>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                            )}
                        />
                        <CustomFormField
                            fieldType={FormFieldType.CHECKBOX}
                            control={form.control}
                            name="featured"
                            label="Feature this collection on homepage"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="bannerImage"
                            label="Collection Banner Image"
                            renderSkeleton={(field) => (
                                <FormControl>
                                    <SingleImageUploader
                                        file={field.value}
                                        onChange={field.onChange}
                                        caption="SVG, PNG, JPG or GIF (Recommended: 1200x300)"
                                        imageHeight={150}
                                        imageWidth={600}
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
                                {isEditMode ? 'Save changes' : 'Create collection'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}