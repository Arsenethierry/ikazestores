"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Info, Loader2, Percent, DollarSign, Gift, Package, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createDiscountAction } from "@/lib/actions/discount-actions";
import {
    CreateDiscountSchema,
    CreateDiscountInput,
} from "@/lib/schemas/discount-schemas";

interface CreateDiscountFormProps {
    storeId: string;
    storeType: "physical" | "virtual";
}

export function CreateDiscountForm({
    storeId,
    storeType,
}: CreateDiscountFormProps) {
    const router = useRouter();
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const form = useForm<CreateDiscountInput>({
        resolver: zodResolver(CreateDiscountSchema),
        defaultValues: {
            storeId,
            storeType,
            name: "",
            description: "",
            discountType: "percentage",
            valueType: "percentage",
            value: 0,
            applicableTo: "store_wide",
            targetIds: [],
            priority: 0,
            canCombineWithOthers: false,
            isActive: true,
            startDate: new Date().toISOString(),
        },
    });

    const { execute: createDiscount, status } = useAction(createDiscountAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Discount created successfully");
            form.reset();
            router.push(`/admin/stores/${storeId}/physical-store/marketing/discounts`)
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to create discount");
        },
    });

    const discountType = form.watch("discountType");
    const valueType = form.watch("valueType");
    const applicableTo = form.watch("applicableTo");

    const isPending = status === "executing";

    // Filter discount types based on store type
    const availableDiscountTypes = [
        { value: "percentage", label: "Percentage Off", icon: Percent, both: true },
        { value: "fixed_amount", label: "Fixed Amount Off", icon: DollarSign, both: true },
        { value: "buy_x_get_y", label: "Buy X Get Y", icon: Gift, physical: true },
        { value: "bundle", label: "Bundle Discount", icon: Package, both: true },
        { value: "bulk_pricing", label: "Bulk Pricing", icon: TrendingUp, virtual: true },
        { value: "flash_sale", label: "Flash Sale", icon: TrendingUp, both: true },
        { value: "first_time_buyer", label: "First Time Buyer", icon: Gift, both: true },
    ].filter((type) => {
        if (type.both) return true;
        if (storeType === "physical") return type.physical;
        if (storeType === "virtual") return type.virtual;
        return false;
    });

    const onSubmit = (data: CreateDiscountInput) => {
        createDiscount(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Set up the core details of your discount
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="e.g., Summer Sale 2025"
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
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Describe this discount..."
                                            rows={3}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isPending}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableDiscountTypes.map((type) => {
                                                    const Icon = type.icon;
                                                    return (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="h-4 w-4" />
                                                                {type.label}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="valueType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Value Type</FormLabel>
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
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {valueType === "percentage" ? "Percentage" : "Amount"}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                placeholder={valueType === "percentage" ? "e.g., 20" : "e.g., 5000"}
                                                disabled={isPending}
                                                className="pr-10"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {valueType === "percentage" ? "%" : "RWF"}
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        {valueType === "percentage"
                                            ? "Enter percentage value (max 100)"
                                            : "Enter fixed discount amount"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Buy X Get Y Fields */}
                        {discountType === "buy_x_get_y" && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <FormField
                                    control={form.control}
                                    name="buyXQuantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Buy Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || undefined)
                                                    }
                                                    placeholder="e.g., 2"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="getYQuantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Get Quantity Free</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || undefined)
                                                    }
                                                    placeholder="e.g., 1"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Application Scope */}
                <Card>
                    <CardHeader>
                        <CardTitle>Application Scope</CardTitle>
                        <CardDescription>
                            Choose where this discount applies
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="applicableTo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apply To</FormLabel>
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
                                            <SelectItem value="store_wide">Entire Store</SelectItem>
                                            <SelectItem value="products">Specific Products</SelectItem>
                                            <SelectItem value="categories">Product Categories</SelectItem>
                                            <SelectItem value="collections">Product Collections</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {applicableTo !== "store_wide" && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <Info className="inline h-4 w-4 mr-1" />
                                    You'll be able to select specific {applicableTo} after creating the discount
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Date Range */}
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule</CardTitle>
                        <CardDescription>
                            Set when this discount is active
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date</FormLabel>
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
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
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
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            Leave empty for no expiration
                                        </FormDescription>
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
                            <div>
                                <CardTitle>Advanced Options</CardTitle>
                                <CardDescription>
                                    Configure usage limits and conditions
                                </CardDescription>
                            </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="minPurchaseAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min Purchase Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    onChange={(e) =>
                                                        field.onChange(parseFloat(e.target.value) || undefined)
                                                    }
                                                    placeholder="Optional"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Minimum cart value required
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="minQuantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || undefined)
                                                    }
                                                    placeholder="Optional"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Minimum items required
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maxDiscountAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Discount Cap</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    onChange={(e) =>
                                                        field.onChange(parseFloat(e.target.value) || undefined)
                                                    }
                                                    placeholder="Optional"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Maximum discount amount
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority (0-100)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || 0)
                                                    }
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Higher priority applies first
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
                                            <FormLabel>Total Usage Limit</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || undefined)
                                                    }
                                                    placeholder="Unlimited"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Max total redemptions
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="usageLimitPerCustomer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Per Customer Limit</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || undefined)
                                                    }
                                                    placeholder="Unlimited"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Max per customer
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="canCombineWithOthers"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Allow Stacking
                                                </FormLabel>
                                                <FormDescription>
                                                    Can be combined with other discounts
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
                                                    Enable this discount immediately
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
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4">
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
                        Create Discount
                    </Button>
                </div>
            </form>
        </Form>
    );
}