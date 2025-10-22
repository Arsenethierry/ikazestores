"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, Loader2, Check, X } from "lucide-react";
import {
    CreateReturnPolicySchema,
    CreateReturnPolicyInput,
} from "@/lib/schemas/discount-schemas";
import { createReturnPolicyAction } from "@/lib/actions/discount-actions";

interface ReturnPolicyManagerProps {
    storeId: string;
    existingPolicy?: any;
    productId?: string;
    categoryId?: string;
}

export function ReturnPolicyManager({
    storeId,
    existingPolicy,
    productId,
    categoryId,
}: ReturnPolicyManagerProps) {
    const router = useRouter();

    const form = useForm<CreateReturnPolicyInput>({
        resolver: zodResolver(CreateReturnPolicySchema),
        defaultValues: existingPolicy || {
            storeId,
            productId,
            categoryId,
            isDefault: !productId && !categoryId,
            returnWindowDays: 30,
            allowReturns: true,
            allowExchanges: true,
            restockingFeePercent: 0,
            requiresOriginalPackaging: true,
            requiresReceipt: true,
            shippingCostResponsibility: "customer",
        },
    });

    const { execute: createPolicy, status } = useAction(
        createReturnPolicyAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || "Policy saved successfully");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to save policy");
            },
        }
    );

    const isPending = status === "executing";
    const allowReturns = form.watch("allowReturns");

    const onSubmit = (data: CreateReturnPolicyInput) => {
        createPolicy(data);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5" />
                    <div>
                        <CardTitle>Return & Exchange Policy</CardTitle>
                        <CardDescription>
                            Configure return and exchange rules for your products
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Settings */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="allowReturns"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Allow Returns</FormLabel>
                                            <FormDescription>
                                                Enable customers to return products
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

                            {allowReturns && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="returnWindowDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Return Window (Days)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min="0"
                                                        max="365"
                                                        onChange={(e) =>
                                                            field.onChange(parseInt(e.target.value) || 0)
                                                        }
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Number of days customers have to return items
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allowExchanges"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Allow Exchanges
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Enable product exchanges
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

                                    <FormField
                                        control={form.control}
                                        name="restockingFeePercent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Restocking Fee (%)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            onChange={(e) =>
                                                                field.onChange(parseFloat(e.target.value) || 0)
                                                            }
                                                            disabled={isPending}
                                                            className="pr-8"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            %
                                                        </span>
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Percentage of order value charged as restocking fee
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </div>

                        {allowReturns && (
                            <>
                                <Separator />

                                {/* Requirements */}
                                <div className="space-y-4">
                                    <h3 className="font-medium">Return Requirements</h3>

                                    <FormField
                                        control={form.control}
                                        name="requiresOriginalPackaging"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Original Packaging Required
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Items must be in original packaging
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

                                    <FormField
                                        control={form.control}
                                        name="requiresReceipt"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Proof of Purchase Required
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Customer must provide receipt or order confirmation
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

                                    <FormField
                                        control={form.control}
                                        name="shippingCostResponsibility"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Return Shipping Cost</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    disabled={isPending}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="customer">
                                                            Customer Pays
                                                        </SelectItem>
                                                        <SelectItem value="store">Store Pays</SelectItem>
                                                        <SelectItem value="shared">
                                                            Split Cost
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Who covers the cost of return shipping
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator />

                                {/* Additional Conditions */}
                                <div className="space-y-4">
                                    <h3 className="font-medium">Additional Conditions</h3>

                                    <FormField
                                        control={form.control}
                                        name="conditions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Policy Details (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                        placeholder="Additional conditions, exceptions, or notes about your return policy..."
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Provide detailed information about your return policy
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {/* Policy Preview */}
                        {allowReturns && (
                            <>
                                <Separator />
                                <div className="space-y-3 p-4 bg-muted rounded-lg">
                                    <h4 className="font-medium text-sm">Policy Preview</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                Return window:
                                            </span>
                                            <span className="font-medium">
                                                {form.watch("returnWindowDays")} days
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Exchanges:</span>
                                            <Badge variant={form.watch("allowExchanges") ? "default" : "secondary"}>
                                                {form.watch("allowExchanges") ? (
                                                    <>
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Allowed
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="h-3 w-3 mr-1" />
                                                        Not Allowed
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                Restocking fee:
                                            </span>
                                            <span className="font-medium">
                                                {form.watch("restockingFeePercent")}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                Return shipping:
                                            </span>
                                            <span className="font-medium capitalize">
                                                {form.watch("shippingCostResponsibility")?.replace("_", " ")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {existingPolicy ? "Update Policy" : "Create Policy"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}