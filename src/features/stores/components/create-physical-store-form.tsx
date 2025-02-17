"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePhysicalStore } from "../mutations/use-physical-store-mutations";
import ErrorAlert from "@/components/error-alert";
import { Loader } from "lucide-react";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { FileUploader } from "@/components/file-uploader";
import { createPhysicalStoreFormSchema } from "@/lib/schemas";
import { CurrentUserType } from "@/lib/types";
import { MultiImageUploader } from "@/components/multiple-images-uploader";

export function CreatePhysicalStoreForm({ currentUser }: CurrentUserType) {
    const { mutate, isPending, error } = useCreatePhysicalStore()
    const form = useForm<z.infer<typeof createPhysicalStoreFormSchema>>({
        resolver: zodResolver(createPhysicalStoreFormSchema),
        defaultValues: {
            storeName: "",
            desccription: "",
            storeBio: "",
        },
    })

    function onSubmit(values: z.infer<typeof createPhysicalStoreFormSchema>) {
        mutate({
            ...values,
            ownerId: currentUser.$id,
        })
    }


    return (
        <Card className="border-t-0 rounded-t-none">
            <CardHeader>
                <CardTitle>Create a physical store</CardTitle>
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
                                        <Input placeholder="Placeholder" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Description
                                    </FormDescription>
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
                                        <Input placeholder="Placeholder" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Description
                                    </FormDescription>
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
                                        <Input placeholder="Placeholder" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Description
                                    </FormDescription>
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
                                    <FileUploader files={field.value} onChange={field.onChange} caption="SVG, PNG, JPG or GIF (Ratio 1:1)" />
                                </FormControl>
                            )}
                        />
                        <div className="flex justify-between items-center">
                            <Button
                                type="button"
                                variant={'destructive'}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                            >
                                <Loader className={isPending ? "animate-spin" : "hidden"} /> {" "}
                                Submit
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
