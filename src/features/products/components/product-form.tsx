"use client";

import Tiptap from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProductSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function ProductForm() {
    const form = useForm<z.infer<typeof ProductSchema>>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
        },
        mode: "onChange",
    });

    const searchParams = useSearchParams();
    const editMode = searchParams.get("id");

    function onSubmit(values: z.infer<typeof ProductSchema>) {
        console.log("onSubmit", values);
    }

    return (
        <Card className="max-w-5xl">
            <CardHeader>
                <CardTitle>{editMode ? "Edit Product" : "Create Product"}</CardTitle>
                <CardDescription>
                    {editMode
                        ? "Make changes to existing product"
                        : "Add new product"
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Price</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <DollarSign
                                                size={36}
                                                className="p-2 bg-muted  rounded-md"
                                            />
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="Your price in USD"
                                                step="0.1"
                                                min={0}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Tiptap val={field.value} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            className="w-full"
                            disabled={
                                // status === "executing" ||
                                !form.formState.isValid ||
                                !form.formState.isDirty
                            }
                            type="submit"
                        >
                            {editMode ? "Save Changes" : "Create Product"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}