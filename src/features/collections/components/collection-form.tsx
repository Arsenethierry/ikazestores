/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Eye, Loader } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createNewCollection } from "../actions/collections-actions";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { convertFileToUrl } from "@/lib/utils";

export const CollectionForm = ({
    currentUser,
    initialValues = null,
    storeId,
}: {
    currentUser: CurrentUserType,
    initialValues?: CollectionTypes | null,
    storeId: string | null;
}) => {
    const [showPreview, setShowPreview] = useState(false);

    const isEditMode = !!initialValues;
    const router = useRouter();

    const formSchema = isEditMode ? UpdateCollectionForm : CollectionSchema;

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
            createdBy: currentUser!.$id,

            heroTitle: initialValues?.heroTitle ?? "",
            heroSubtitle: initialValues?.heroSubtitle ?? "",
            heroDescription: initialValues?.heroDescription ?? "",
            heroButtonText: initialValues?.heroButtonText ?? "Shop Now",
            heroImage: undefined,
        },
        mode: "onChange",
    });

    const watchedFeatured = form.watch("featured");
    const watchedValues = form.watch();

    useEffect(() => {
        if (isEditMode && initialValues?.bannerImageUrl) {
            form.setValue("bannerImage", initialValues?.bannerImageUrl);
        }
        if (isEditMode && initialValues?.heroImageUrl) {
            form.setValue("heroImage", initialValues?.heroImageUrl);
        }
    }, [isEditMode, initialValues, form]);

    const { formState: { dirtyFields } } = form;

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentUser) {
            toast.error("Something went wrong, try again");
            return;
        }
        if (isEditMode && initialValues) {
            const updatedValues: Record<string, any> = {};

            if (dirtyFields.collectionName) updatedValues.name = values.collectionName;
            if (dirtyFields.description) updatedValues.description = values.description;
            if (dirtyFields.type) updatedValues.type = values.type;
            if (dirtyFields.featured) updatedValues.featured = values.featured;
            if (dirtyFields.bannerImage) {
                updatedValues.bannerImage = values.bannerImage;
                updatedValues.oldFileId = initialValues?.bannerImageFileId ?? null;
            }

            if (dirtyFields.heroTitle) updatedValues.heroTitle = values.heroTitle;
            if (dirtyFields.heroSubtitle) updatedValues.heroSubtitle = values.heroSubtitle;
            if (dirtyFields.heroDescription) updatedValues.heroDescription = values.heroDescription;
            if (dirtyFields.heroButtonText) updatedValues.heroButtonText = values.heroButtonText;
            if (dirtyFields.heroImage) {
                updatedValues.heroImage = values.heroImage;
                updatedValues.oldHeroImageFileId = initialValues?.heroImageFileId ?? null;
            }

            if (Object.keys(updatedValues).length > 0) {
                const formData = {
                    ...updatedValues,
                    collectionId: initialValues.$id
                };
                console.log(formData);
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

    const HeroCarouselPreview = ({ formData }: { formData: any }) => {
        console.log("formData: ", formData)
        const carouselItem = {
            id: 'preview',
            title: formData.heroTitle || 'Your Hero Title',
            subtitle: formData.heroSubtitle || 'Your Hero Subtitle',
            description: formData.heroDescription || 'Your hero description will appear here...',
            buttonText: formData.heroButtonText || 'Shop Now',
            image: formData.heroImage || 'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=800',
            imageAlt: formData.heroImageAlt || 'Hero image',
            priority: formData.heroPriority || false
        };

        return (
            <div className="w-full h-[500px] relative overflow-hidden rounded-lg">
                <div className="relative h-full w-full">
                    {isEditMode && !(carouselItem.image instanceof File) ? (
                        <Image
                            src={carouselItem.image}
                            width={100}
                            height={100}
                            alt="uploaded image"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : carouselItem.image instanceof File ? (
                        <Image
                            src={convertFileToUrl(carouselItem.image)}
                            width={100}
                            height={100}
                            alt="uploaded image"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : null}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="text-center text-white max-w-2xl">
                            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                                {carouselItem.title}
                            </h2>
                            <p className="text-xl lg:text-2xl mb-2 text-yellow-300">
                                {carouselItem.subtitle}
                            </p>
                            <p className="text-base lg:text-lg mb-8 opacity-90">
                                {carouselItem.description}
                            </p>
                            <Button
                                size="lg"
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 text-lg"
                            >
                                {carouselItem.buttonText}
                            </Button>
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <Badge variant="secondary" className="text-xs">
                            Preview Mode - This is how your collection will appear in the hero carousel
                        </Badge>
                    </div>
                </div>
            </div>
        )
    }

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

                        {watchedFeatured && (
                            <>
                                <Separator className="my-6" />
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Hero Carousel Configuration</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Configure how this collection will appear in the homepage hero carousel
                                            </p>
                                        </div>
                                        <Dialog open={showPreview} onOpenChange={setShowPreview}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Hero Carousel Preview</DialogTitle>
                                                </DialogHeader>
                                                <HeroCarouselPreview formData={watchedValues} />
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CustomFormField
                                            control={form.control}
                                            name="heroTitle"
                                            label='Hero Title'
                                            fieldType={FormFieldType.INPUT}
                                            placeholder='Summer Sale 2024'
                                        />

                                        <CustomFormField
                                            control={form.control}
                                            name="heroSubtitle"
                                            label='Hero Subtitle'
                                            fieldType={FormFieldType.INPUT}
                                            placeholder='Up to 70% Off Everything'
                                        />

                                        <CustomFormField
                                            control={form.control}
                                            name="heroDescription"
                                            label='Hero Description'
                                            fieldType={FormFieldType.TEXTAREA}
                                            placeholder={`Discover amazing deals on electronics, fashion, home goods and more. Limited time offer - shop now before it\' s gone!`}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CustomFormField
                                            control={form.control}
                                            name="heroButtonText"
                                            label='Button Text'
                                            fieldType={FormFieldType.INPUT}
                                            placeholder='Shop Now'
                                        />
                                    </div>
                                    <CustomFormField
                                        fieldType={FormFieldType.SKELETON}
                                        control={form.control}
                                        name="heroImage"
                                        label="Hero Carousel Image"
                                        renderSkeleton={(field) => (
                                            <FormControl>
                                                <SingleImageUploader
                                                    file={field.value}
                                                    onChange={field.onChange}
                                                    caption="SVG, PNG, JPG or GIF (Recommended: 1200x600 or higher)"
                                                    imageHeight={200}
                                                    imageWidth={800}
                                                    isEditMode={isEditMode}
                                                />
                                            </FormControl>
                                        )}
                                    />
                                </div>
                            </>
                        )}
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