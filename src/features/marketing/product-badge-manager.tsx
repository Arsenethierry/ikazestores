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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Award,
    Plus,
    CalendarIcon,
    Trash2,
    Loader2,
    Star,
    Zap,
    TrendingUp,
    Gift,
    Sparkles,
    Clock,
    Tag,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    CreateProductBadgeSchema,
    CreateProductBadgeInput,
} from "@/lib/schemas/discount-schemas";
import {
    createProductBadgeAction,
    deleteProductBadgeAction,
} from "@/lib/actions/discount-actions";
import { ProductBadges } from "@/lib/types/appwrite/appwrite";

interface ProductBadgeManagerProps {
    productId: string;
    existingBadges?: ProductBadges[];
}

const BADGE_TYPES = [
    { value: "new", label: "New", icon: Sparkles, color: "blue" },
    { value: "sale", label: "Sale", icon: Tag, color: "red" },
    { value: "limited", label: "Limited", icon: Clock, color: "orange" },
    { value: "bestseller", label: "Bestseller", icon: Star, color: "yellow" },
    { value: "featured", label: "Featured", icon: Award, color: "purple" },
    { value: "exclusive", label: "Exclusive", icon: Zap, color: "pink" },
    { value: "trending", label: "Trending", icon: TrendingUp, color: "green" },
    { value: "low_stock", label: "Low Stock", icon: Clock, color: "amber" },
    { value: "pre_order", label: "Pre-order", icon: Gift, color: "indigo" },
    { value: "custom", label: "Custom", icon: Tag, color: "gray" },
];

const COLOR_SCHEMES = [
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "pink", label: "Pink", class: "bg-pink-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
    { value: "gray", label: "Gray", class: "bg-gray-500" },
];

export function ProductBadgeManager({
    productId,
    existingBadges = [],
}: ProductBadgeManagerProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const form = useForm<CreateProductBadgeInput>({
        resolver: zodResolver(CreateProductBadgeSchema),
        defaultValues: {
            productId,
            badgeType: "new",
            isActive: true,
            priority: 0,
        },
    });

    const { execute: createBadge, status } = useAction(
        createProductBadgeAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || "Badge created successfully");
                form.reset();
                setOpen(false);
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to create badge");
            },
        }
    );

    const { execute: deleteBadge } = useAction(deleteProductBadgeAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Badge deleted");
            router.refresh();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete badge");
        },
    });

    const isPending = status === "executing";
    const badgeType = form.watch("badgeType");

    const onSubmit = (data: CreateProductBadgeInput) => {
        createBadge(data);
    };

    const getBadgeIcon = (type: string) => {
        const badge = BADGE_TYPES.find((b) => b.value === type);
        return badge ? badge.icon : Tag;
    };

    const getBadgeColor = (colorScheme?: string) => {
        const color = COLOR_SCHEMES.find((c) => c.value === colorScheme);
        return color?.class || "bg-gray-500";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    <h3 className="font-semibold">Product Badges</h3>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Badge
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Product Badge</DialogTitle>
                            <DialogDescription>
                                Highlight this product with a custom badge
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="badgeType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Badge Type</FormLabel>
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
                                                    {BADGE_TYPES.map((badge) => {
                                                        const Icon = badge.icon;
                                                        return (
                                                            <SelectItem key={badge.value} value={badge.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className="h-4 w-4" />
                                                                    {badge.label}
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

                                {badgeType === "custom" && (
                                    <FormField
                                        control={form.control}
                                        name="label"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Custom Label</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g., Hot Deal"
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="colorScheme"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isPending}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select color" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COLOR_SCHEMES.map((color) => (
                                                        <SelectItem key={color.value} value={color.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className={cn(
                                                                        "h-4 w-4 rounded-full",
                                                                        color.class
                                                                    )}
                                                                />
                                                                {color.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Start Date (Optional)</FormLabel>
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
                                                                    <span>Pick date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                field.value ? new Date(field.value) : undefined
                                                            }
                                                            onSelect={(date) =>
                                                                field.onChange(date?.toISOString())
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
                                                                    <span>Pick date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                field.value ? new Date(field.value) : undefined
                                                            }
                                                            onSelect={(date) =>
                                                                field.onChange(date?.toISOString())
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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
                                                Higher priority badges show first
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
                                        Create Badge
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {existingBadges.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No badges added yet</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {existingBadges.map((badge) => {
                        const Icon = getBadgeIcon(badge.badgeType);
                        return (
                            <div
                                key={badge.$id}
                                className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                                style={{
                                    backgroundColor: badge.colorScheme
                                        ? `var(--${badge.colorScheme}-500)`
                                        : undefined,
                                }}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span>
                                    {badge.label ||
                                        BADGE_TYPES.find((b) => b.value === badge.badgeType)
                                            ?.label ||
                                        badge.badgeType}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteBadge({ badgeId: badge.$id })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}