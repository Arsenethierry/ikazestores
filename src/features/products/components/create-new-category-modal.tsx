
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
import { Input } from "@/components/ui/input"
import { ResponsiveModal } from "@/components/responsive-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
const formSchema = z.object({ "categoryName": z.string().min(1).max(255) })

export const NewCategoryFormModal = ({ open }: { open: boolean }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            categoryName: "",
        },
    });

    function closeModal() {
        const params = new URLSearchParams(searchParams);
        params.delete("createnew");
        router.replace(`/dashboard/products/categories?${params.toString()}`, { scroll: false });
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }

    return (
        <ResponsiveModal open={open} onOpenChange={closeModal}>
            <Card className="p-5">
                <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="my-5 space-y-3">
                        <FormField
                            control={form.control}
                            name="categoryName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Category name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </Card>
        </ResponsiveModal>
    )
}
