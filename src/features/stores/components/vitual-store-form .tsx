"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorAlert from "@/components/error-alert";
import { Loader } from "lucide-react";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { SingleImageUploader } from "@/components/file-uploader";
import { createVirtualStoreFormSchema } from "@/lib/schemas";
import { CurrentUserType, DocumentType } from "@/lib/types";
import { MultiImageUploader } from "@/components/multiple-images-uploader";
import { useCreateVirtualStore } from "../mutations/use-virtual-store-mutations";
import { MAIN_DOMAIN } from "@/lib/env-config";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { updateVirtualStore } from "@/lib/actions/vitual-store.action";
import { useAction } from "next-safe-action/hooks";
import { Textarea } from "@/components/ui/textarea";

export function VirtualStoreForm({ currentUser, initialValues = null }: { currentUser: CurrentUserType, initialValues?: DocumentType | null }) {
    const isEditMode = !!initialValues;
    const router = useRouter();

    const {
        execute,
        isPending:
        isUpdating
    } = useAction(updateVirtualStore, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                router.push(`/admin/stores/${initialValues?.$id}`)
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const [CancelDialog, confirmCancelProduct] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const { mutate: createStore, isPending, error } = useCreateVirtualStore();

    const form = useForm<z.infer<typeof createVirtualStoreFormSchema>>({
        resolver: zodResolver(createVirtualStoreFormSchema),
        defaultValues: {
            storeName: initialValues?.storeName ?? "",
            desccription: initialValues?.desccription ?? "",
            storeBio: initialValues?.storeBio ?? "",
            storeDomain: initialValues?.subDomain ?? "",
            storeBanner: initialValues?.bannerUrls ?? undefined,
            storeLogo: initialValues?.storeLogoUrl ?? undefined,
        },
    });
    const { watch, setValue, formState: { dirtyFields } } = form;
    const storeName = watch('storeName');

    useEffect(() => {
        if (storeName) {
            const sanitizedName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
            setValue('storeDomain', `${sanitizedName}.${MAIN_DOMAIN}`);
        }
    }, [storeName, setValue]);

    function onSubmit(values: z.infer<typeof createVirtualStoreFormSchema>) {
        const sanitizedDomain = values.storeDomain.split('.')[0];
        try {
            if (!currentUser) {
                toast.error("Something went wrong, try again");
                return;
            }
            if (isEditMode && initialValues) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updatedValues: Record<string, any> = {};

                if (dirtyFields.storeName) updatedValues.storeName = values.storeName;
                if (dirtyFields.desccription) updatedValues.desccription = values.desccription;
                if (dirtyFields.storeBio) updatedValues.storeBio = values.storeBio;
                if (dirtyFields.storeDomain) updatedValues.storeDomain = sanitizedDomain;
                if (dirtyFields.storeBanner) updatedValues.storeBanner = values.storeBanner;
                if (dirtyFields.storeLogo) {
                    updatedValues.storeLogo = values.storeLogo;
                    updatedValues.oldFileId = initialValues?.storeLogoId ?? null;
                }

                if (Object.keys(updatedValues).length > 0) {
                    const formData = {
                        ...updatedValues,
                        storeId: initialValues.$id,
                    }
                    execute(formData);
                } else {
                    toast.info("No changes detected");
                }
            } else {
                createStore({
                    ...values,
                    ownerId: currentUser.$id,
                    subDomain: sanitizedDomain
                })
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleCancel = async () => {
        const ok = await confirmCancelProduct()
        if (!ok) return;
        router.back()
    }

    console.log("store logo: ", initialValues)

    return (
        <Card className="border-t-0 rounded-t-none max-w-5xl">
            <CancelDialog />
            <CardHeader>
                <CardTitle>{initialValues ? 'Edit' : 'Create'} a virtual store</CardTitle>
            </CardHeader>
            <CardContent>
                {error && <ErrorAlert errorMessage={error?.message} />}
                <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        <FormField
                            control={form.control}
                            name="storeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your store name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="storeDomain"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>website url</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="example.ikazestores.com"
                                            type="text"
                                            {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="desccription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Desccription</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="short description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="storeBio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Bio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="store bio" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="storeBanner"
                            label="Store banner Ratio 4:1 (2000 x 500 px)"
                            renderSkeleton={(field) => (
                                <FormControl>
                                    <MultiImageUploader
                                        isEditMode={isEditMode}
                                        files={field.value}
                                        onChange={field.onChange}
                                        caption="SVG, PNG, JPG or GIF (max. 2000 x 500 px)"
                                        maxFiles={5}
                                    />
                                </FormControl>
                            )}
                        />

                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="storeLogo"
                            label="Shop logo(Ratio 1:1)"
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
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || isUpdating}
                            >
                                <Loader className={isPending || isUpdating ? "animate-spin" : "hidden"} /> {" "}
                                {isEditMode ? 'Save changes' : 'Create store'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
