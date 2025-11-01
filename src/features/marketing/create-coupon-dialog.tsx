"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2, RefreshCw } from "lucide-react";
import { CreateCouponCodeSchema } from "@/lib/schemas/discount-schemas";
import { createCouponCodeAction } from "@/lib/actions/discount-actions";
import z from "zod";

type CreateCouponInput = z.infer<typeof CreateCouponCodeSchema>;

interface CreateCouponDialogProps {
    discountId: string;
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateCouponDialog({
    discountId,
    storeId,
    isOpen,
    onClose,
    onSuccess,
}: CreateCouponDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const form = useForm<CreateCouponInput>({
        resolver: zodResolver(CreateCouponCodeSchema),
        defaultValues: {
            code: "",
            discountId,
            storeId,
            isActive: true,
        },
    });

    const { execute: createCoupon, status } = useAction(createCouponCodeAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Coupon created successfully");
            form.reset();
            onSuccess?.();
            onClose();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to create coupon");
        },
    });

    const isPending = status === "executing";

    const onSubmit = (data: CreateCouponInput) => {
        createCoupon(data);
    };

    // Generate random coupon code
    const generateCode = () => {
        setIsGenerating(true);

        // Generate a random code with pattern: XXXX-XXXX or SUMMER2024
        const patterns = [
            () => {
                // Pattern: XXXX-XXXX
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                const part1 = Array.from({ length: 4 }, () =>
                    chars.charAt(Math.floor(Math.random() * chars.length))
                ).join("");
                const part2 = Array.from({ length: 4 }, () =>
                    chars.charAt(Math.floor(Math.random() * chars.length))
                ).join("");
                return `${part1}-${part2}`;
            },
            () => {
                // Pattern: WORD + NUMBER
                const words = ["SAVE", "DEAL", "OFFER", "SPECIAL", "PROMO"];
                const word = words[Math.floor(Math.random() * words.length)];
                const number = Math.floor(Math.random() * 900) + 100;
                return `${word}${number}`;
            },
            () => {
                // Pattern: SAVE + PERCENTAGE
                const percentages = [10, 15, 20, 25, 30, 50];
                const percent = percentages[Math.floor(Math.random() * percentages.length)];
                return `SAVE${percent}`;
            },
        ];

        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const code = pattern();

        form.setValue("code", code);

        setTimeout(() => setIsGenerating(false), 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Coupon Code</DialogTitle>
                    <DialogDescription>
                        Generate a unique coupon code for this discount
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Coupon Code *</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input
                                                placeholder="SUMMER2024"
                                                {...field}
                                                onChange={(e) => {
                                                    // Auto-uppercase
                                                    const value = e.target.value.toUpperCase();
                                                    field.onChange(value);
                                                }}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={generateCode}
                                            disabled={isPending || isGenerating}
                                        >
                                            {isGenerating ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Wand2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <FormDescription>
                                        Must be uppercase, alphanumeric with _ or - (3-50 chars)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active</FormLabel>
                                        <FormDescription>
                                            Make this coupon active immediately
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Coupon"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}