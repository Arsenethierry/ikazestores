"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    CalendarIcon,
    Loader2,
    Percent,
    DollarSign,
    Save,
    X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { updateDiscountAction } from "@/lib/actions/discount-actions";
import {
    UpdateDiscountSchema,
    UpdateDiscountInput,
} from "@/lib/schemas/discount-schemas";
import { Discounts } from "@/lib/types/appwrite-types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditDiscountDialogProps {
    discount: Discounts;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function EditDiscountDialog({
    discount,
    isOpen,
    onClose,
    onSuccess,
}: EditDiscountDialogProps) {
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const form = useForm<UpdateDiscountInput>({
        resolver: zodResolver(UpdateDiscountSchema),
        defaultValues: {
            name: discount.name,
            description: discount.description || "",
            discountType: discount.discountType,
            valueType: discount.valueType,
            value: discount.value,
            applicableTo: discount.applicableTo,
            targetIds: discount.targetIds || [],
            priority: discount.priority,
            canCombineWithOthers: discount.canCombineWithOthers,
            isActive: discount.isActive,
            startDate: discount.startDate,
            endDate: discount.endDate || undefined,
            minPurchaseAmount: discount.minPurchaseAmount || undefined,
            minQuantity: discount.minQuantity || undefined,
            maxDiscountAmount: discount.maxDiscountAmount || undefined,
            usageLimit: discount.usageLimit || undefined,
            usageLimitPerCustomer: discount.usageLimitPerCustomer || undefined,
            buyXQuantity: discount.buyXQuantity || undefined,
            getYQuantity: discount.getYQuantity || undefined,
        },
    });

    const { execute: updateDiscount, status } = useAction(updateDiscountAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Discount updated successfully");
            onSuccess?.();
            onClose();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to update discount");
        },
    });

    const discountType = form.watch("discountType");
    const valueType = form.watch("valueType");
    const applicableTo = form.watch("applicableTo");

    const isPending = status === "executing";

    const onSubmit = (data: UpdateDiscountInput) => {
        updateDiscount({
            discountId: discount.$id,
            data,
        });
    };

    // Reset form when dialog opens with new data
    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: discount.name,
                description: discount.description || "",
                discountType: discount.discountType,
                valueType: discount.valueType,
                value: discount.value,
                applicableTo: discount.applicableTo,
                targetIds: discount.targetIds || [],
                priority: discount.priority,
                canCombineWithOthers: discount.canCombineWithOthers,
                isActive: discount.isActive,
                startDate: discount.startDate,
                endDate: discount.endDate || undefined,
                minPurchaseAmount: discount.minPurchaseAmount || undefined,
                minQuantity: discount.minQuantity || undefined,
                maxDiscountAmount: discount.maxDiscountAmount || undefined,
                usageLimit: discount.usageLimit || undefined,
                usageLimitPerCustomer: discount.usageLimitPerCustomer || undefined,
                buyXQuantity: discount.buyXQuantity || undefined,
                getYQuantity: discount.getYQuantity || undefined,
            });
        }
    }, [isOpen, discount, form]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Discount</DialogTitle>
                    <DialogDescription>
                        Update discount settings and configurations
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., Summer Sale 2024"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
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
                                                    <Textarea
                                                        placeholder="Brief description of this discount"
                                                        rows={3}
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="valueType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Value Type *</FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={isPending}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="percentage">
                                                                <div className="flex items-center gap-2">
                                                                    <Percent className="h-4 w-4" />
                                                                    Percentage
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="fixed_amount">
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign className="h-4 w-4" />
                                                                    Fixed Amount
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="value"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Value * {valueType === "percentage" && "(%)"}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={valueType === "percentage" ? 1 : 0.01}
                                                            max={valueType === "percentage" ? 100 : undefined}
                                                            placeholder={valueType === "percentage" ? "10" : "50.00"}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="applicableTo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Applicable To *</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    disabled={isPending}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="store_wide">
                                                            Store-wide (All Products)
                                                        </SelectItem>
                                                        <SelectItem value="specific_products">
                                                            Specific Products
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    {applicableTo === "store_wide"
                                                        ? "This discount applies to all products in your store"
                                                        : "This discount applies only to selected products"}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Date Range */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Schedule</CardTitle>
                                    <CardDescription>Set when this discount is active</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Start Date *</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                    disabled={isPending}
                                                                >
                                                                    {field.value ? (
                                                                        format(new Date(field.value), "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(date) =>
                                                                    field.onChange(date?.toISOString())
                                                                }
                                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>End Date (Optional)</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                    disabled={isPending}
                                                                >
                                                                    {field.value ? (
                                                                        format(new Date(field.value), "PPP")
                                                                    ) : (
                                                                        <span>No end date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(date) =>
                                                                    field.onChange(date?.toISOString())
                                                                }
                                                                disabled={(date) => date < new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Advanced Options */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Advanced Settings</CardTitle>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                        >
                                            {showAdvancedOptions ? "Hide" : "Show"}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {showAdvancedOptions && (
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="priority"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Priority</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Higher priority discounts apply first (0-100)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="usageLimit"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Usage Limit</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder="Unlimited"
                                                                {...field}
                                                                value={field.value || ""}
                                                                onChange={(e) =>
                                                                    field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                                                }
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Maximum number of times this discount can be used
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="canCombineWithOthers"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">
                                                            Stackable
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Allow this discount to be combined with other discounts
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
                                            name="isActive"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">
                                                            Active Status
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Enable or disable this discount
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
                                    </CardContent>
                                )}
                            </Card>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isPending}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}