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
import { useCreatePhysicalStore } from "../mutations/use-create-physical-store";
import ErrorAlert from "@/components/error-alert";
import { Models } from "node-appwrite";
import { Loader } from "lucide-react";

const formSchema = z.object({
    "storeName": z.string().min(1).max(255),
    "desccription": z.string().max(255).optional(),
    "storeBio": z.string().max(255).optional()
});

interface CreatePhysicalStoreFormProps {
    currentUser: Models.User<Models.Preferences>
}

export function CreatePhysicalStoreForm({ currentUser }: CreatePhysicalStoreFormProps) {
    const { mutate, isPending, error } = useCreatePhysicalStore()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            storeName: "",
            desccription: "",
            storeBio: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutate({ ...values, ownerId: currentUser.$id })
    }


    return (
        <Card className="max-w-4xl">
            <CardHeader>
                <CardTitle>Create a new store</CardTitle>
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
