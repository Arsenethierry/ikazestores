"use client";

import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Star, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import {
    checkStoreReviewEligibilityAction,
    createStoreReviewAction,
    updateStoreReviewAction,
    getUserStoreReviewAction,
} from "@/lib/actions/store-review-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const storeReviewSchema = z.object({
    overallRating: z.number().min(1, "Please select a rating").max(5),
    title: z.string().min(3, "Title must be at least 3 characters").max(100).optional(),
    comment: z.string().min(10, "Review must be at least 10 characters").max(2200).optional(),
    customerServiceRating: z.number().min(1).max(5).optional(),
});

type StoreReviewFormData = z.infer<typeof storeReviewSchema>;

interface StoreReviewFormProps {
    storeId: string;
}

export function StoreReviewForm({ storeId }: StoreReviewFormProps) {
    const router = useRouter();
    const [eligibility, setEligibility] = useState<any>(null);
    const [existingReview, setExistingReview] = useState<any>(null);
    const [checkingEligibility, setCheckingEligibility] = useState(true);

    const form = useForm<StoreReviewFormData>({
        resolver: zodResolver(storeReviewSchema),
        defaultValues: {
            overallRating: 0,
            title: "",
            comment: "",
            customerServiceRating: 0,
        },
    });

    const { execute: createReview, isExecuting: isCreating } = useAction(
        createStoreReviewAction,
        {
            onSuccess: (result) => {
                if (result?.data?.success) {
                    toast.success(result.data.message || "Review submitted successfully!");
                    form.reset();
                    router.refresh();
                } else {
                    toast.error(result?.data?.error || "Failed to submit review");
                }
            },
            onError: () => {
                toast.error("An error occurred while submitting your review");
            },
        }
    );

    const { execute: updateReview, isExecuting: isUpdating } = useAction(
        updateStoreReviewAction,
        {
            onSuccess: (result) => {
                if (result?.data?.success) {
                    toast.success(result.data.message || "Review updated successfully!");
                    router.refresh();
                } else {
                    toast.error(result?.data?.error || "Failed to update review");
                }
            },
            onError: () => {
                toast.error("An error occurred while updating your review");
            },
        }
    );

    // Check eligibility on mount
    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const [eligibilityResult, existingReviewResult] = await Promise.all([
                    checkStoreReviewEligibilityAction({ virtualStoreId: storeId }),
                    getUserStoreReviewAction({ virtualStoreId: storeId }),
                ]);

                if (eligibilityResult?.data?.success) {
                    setEligibility(eligibilityResult.data.data);
                }

                if (existingReviewResult?.data?.success && existingReviewResult.data.data) {
                    const review = existingReviewResult.data.data;
                    setExistingReview(review);

                    // Pre-fill form with existing review
                    form.reset({
                        overallRating: review.overallRating,
                        title: review.title || "",
                        comment: review.comment || "",
                        customerServiceRating: review.customerServiceRating || 0,
                    });
                }
            } catch (error) {
                console.error("Failed to check eligibility:", error);
            } finally {
                setCheckingEligibility(false);
            }
        };

        checkEligibility();
    }, [storeId, form]);

    const onSubmit = async (data: StoreReviewFormData) => {
        if (existingReview) {
            // Update existing review
            await updateReview({
                reviewId: existingReview.$id,
                ...data,
            });
        } else {
            // Create new review
            await createReview({
                virtualStoreId: storeId,
                ...data,
            });
        }
    };

    if (checkingEligibility) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Checking eligibility...</span>
            </div>
        );
    }

    if (!eligibility?.canReview) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {eligibility?.reason || "You are not eligible to review this store at this time."}
                </AlertDescription>
            </Alert>
        );
    }

    const isSubmitting = isCreating || isUpdating;

    return (
        <div className="space-y-4">
            {eligibility.isUpdate && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        You have already reviewed this store. You can update your review below.
                        {eligibility.orderCount > 1 && (
                            <span className="block mt-1 text-sm">
                                You've completed {eligibility.orderCount} orders from this store.
                            </span>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Overall Rating */}
                    <FormField
                        control={form.control}
                        name="overallRating"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Overall Rating *</FormLabel>
                                <FormDescription>
                                    Rate your overall experience with this store
                                </FormDescription>
                                <FormControl>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => field.onChange(rating)}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    className={`h-8 w-8 cursor-pointer transition-colors ${rating <= field.value
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Customer Service Rating */}
                    <FormField
                        control={form.control}
                        name="customerServiceRating"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer Service & Communication</FormLabel>
                                <FormDescription>
                                    Rate the store's responsiveness and communication
                                </FormDescription>
                                <FormControl>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => field.onChange(rating)}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    className={`h-6 w-6 cursor-pointer transition-colors ${rating <= (field.value || 0)
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Title */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Review Title</FormLabel>
                                <FormDescription>
                                    Summarize your experience in a few words
                                </FormDescription>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Great product selection and fast service"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Comment */}
                    <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Detailed Review</FormLabel>
                                <FormDescription>
                                    Share your experience with the store's product curation and service
                                </FormDescription>
                                <FormControl>
                                    <Textarea
                                        placeholder="Tell us about your experience with this store's product selection, communication, and overall service..."
                                        className="min-h-[120px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-3">
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {existingReview ? "Update Review" : "Submit Review"}
                        </Button>
                        {existingReview && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => form.reset()}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}