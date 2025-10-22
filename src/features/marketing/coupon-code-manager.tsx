"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Copy,
    Plus,
    Ticket,
    Loader2,
    Check,
    ExternalLink,
} from "lucide-react";
import {
    CreateCouponCodeSchema,
    CreateCouponCodeInput,
} from "@/lib/schemas/discount-schemas";
import { createCouponCodeAction } from "@/lib/actions/discount-actions";
import { CouponCodes } from "@/lib/types/appwrite/appwrite";

interface CouponCodeManagerProps {
    discountId: string;
    discountName: string;
    storeId: string;
    existingCoupons?: CouponCodes[];
}

export function CouponCodeManager({
    discountId,
    discountName,
    storeId,
    existingCoupons = [],
}: CouponCodeManagerProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const form = useForm<CreateCouponCodeInput>({
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
            setOpen(false);
            router.refresh();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to create coupon");
        },
    });

    const isPending = status === "executing";

    const onSubmit = (data: CreateCouponCodeInput) => {
        createCoupon(data);
    };

    const copyToClipboard = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success("Coupon code copied!");
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
            toast.error("Failed to copy code");
        }
    };

    const generateRandomCode = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }
        form.setValue("code", result);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        <CardTitle>Coupon Codes</CardTitle>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Code
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Coupon Code</DialogTitle>
                                <DialogDescription>
                                    Generate a unique code for {discountName}
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Coupon Code</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="e.g., SUMMER2025"
                                                            className="uppercase font-mono"
                                                            disabled={isPending}
                                                            onChange={(e) =>
                                                                field.onChange(e.target.value.toUpperCase())
                                                            }
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={generateRandomCode}
                                                        disabled={isPending}
                                                    >
                                                        Generate
                                                    </Button>
                                                </div>
                                                <FormDescription>
                                                    Use uppercase letters, numbers, hyphens, or underscores
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOpen(false)}
                                            disabled={isPending}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isPending}>
                                            {isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Create Code
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {existingCoupons.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No coupon codes created yet</p>
                        <p className="text-sm mt-1">
                            Create codes that customers can use at checkout
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {existingCoupons.map((coupon) => (
                            <div
                                key={coupon.$id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="font-mono font-semibold text-lg">
                                        {coupon.code}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={coupon.isActive ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {coupon.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {coupon.usageCount} uses
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(coupon.code)}
                                >
                                    {copiedCode === coupon.code ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2 text-green-500" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}