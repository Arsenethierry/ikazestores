"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { checkReviewEligibilityAction, createProductReviewAction } from '@/lib/actions/original-products-actions';

const reviewSchema = z.object({
    rating: z.number().min(1, "Please select a rating").max(5),
    title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
    comment: z.string().min(20, 'Review must be at least 20 characters').max(2000, 'Review too long'),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
    productId: string;
    virtualStoreId: string;
}

export const ReviewForm = ({ productId, virtualStoreId }: ReviewFormProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [proInput, setProInput] = useState('');
    const [conInput, setConInput] = useState('');
    const [pros, setPros] = useState<string[]>([]);
    const [cons, setCons] = useState<string[]>([]);
    const [eligibility, setEligibility] = useState<{
        canReview: boolean;
        reason?: string;
        orderDetails?: any;
    } | null>(null);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            pros: [],
            cons: [],
        },
    });

    // Check eligibility on mount
    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const result = await checkReviewEligibilityAction({
                    productId,
                    virtualStoreId,
                });

                if (result?.data) {
                    setEligibility(result.data);
                }
            } catch (error) {
                console.error('Failed to check eligibility:', error);
            } finally {
                setIsCheckingEligibility(false);
            }
        };

        checkEligibility();
    }, [productId, virtualStoreId]);

    const { execute: submitReview, status: submitStatus } = useAction(createProductReviewAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.message || 'Review submitted successfully!');
                reset();
                setRating(0);
                setPros([]);
                setCons([]);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: (error) => {
            toast.error('Failed to submit review. Please try again.');
            console.error('Submit review error:', error);
        },
    });

    const onSubmit = async (data: ReviewFormData) => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        submitReview({
            productId,
            virtualStoreId,
            rating,
            title: data.title,
            comment: data.comment,
            pros: pros.length > 0 ? pros : undefined,
            cons: cons.length > 0 ? cons : undefined,
            orderId: eligibility?.orderDetails?.orderId,
        });
    };

    const addPro = () => {
        if (proInput.trim() && pros.length < 5) {
            setPros([...pros, proInput.trim()]);
            setProInput('');
        }
    };

    const removePro = (index: number) => {
        setPros(pros.filter((_, i) => i !== index));
    };

    const addCon = () => {
        if (conInput.trim() && cons.length < 5) {
            setCons([...cons, conInput.trim()]);
            setConInput('');
        }
    };

    const removeCon = (index: number) => {
        setCons(cons.filter((_, i) => i !== index));
    };

    // Loading state
    if (isCheckingEligibility) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Checking eligibility...</span>
            </div>
        );
    }

    // Not eligible to review
    if (!eligibility?.canReview) {
        return (
            <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                    {eligibility?.reason || 'You cannot review this product at this time.'}
                </AlertDescription>
            </Alert>
        );
    }

    const isSubmitting = submitStatus === 'executing';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Eligibility Info */}
            {eligibility.orderDetails && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        You purchased this product (Order #{eligibility.orderDetails.orderNumber}).
                        Your review will be marked as a verified purchase.
                    </AlertDescription>
                </Alert>
            )}

            {/* Rating */}
            <div>
                <Label className="text-base">Your Rating *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                    How would you rate this product?
                </p>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            disabled={isSubmitting}
                        >
                            <Star
                                className={cn(
                                    'h-10 w-10 transition-colors',
                                    (hoverRating || rating) >= star
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                )}
                            />
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                        {rating === 5 && "Excellent!"}
                        {rating === 4 && "Very Good!"}
                        {rating === 3 && "Good"}
                        {rating === 2 && "Fair"}
                        {rating === 1 && "Poor"}
                    </p>
                )}
                {errors.rating && (
                    <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>
                )}
            </div>

            {/* Title */}
            <div>
                <Label htmlFor="title" className="text-base">Review Title *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                    Sum up your experience in a few words
                </p>
                <Input
                    id="title"
                    {...register('title')}
                    placeholder="e.g., 'Great quality and fast shipping'"
                    className="mt-1"
                    disabled={isSubmitting}
                />
                {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
            </div>

            {/* Comment */}
            <div>
                <Label htmlFor="comment" className="text-base">Your Review *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                    Tell us what you think about this product (minimum 20 characters)
                </p>
                <Textarea
                    id="comment"
                    {...register('comment')}
                    placeholder="Share your experience with this product. What did you like? What could be improved?"
                    rows={5}
                    className="mt-1"
                    disabled={isSubmitting}
                />
                {errors.comment && (
                    <p className="text-sm text-destructive mt-1">{errors.comment.message}</p>
                )}
            </div>

            {/* Pros */}
            <div>
                <Label className="text-base">Pros (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                    What did you like about this product?
                </p>
                <div className="flex gap-2 mb-2">
                    <Input
                        value={proInput}
                        onChange={(e) => setProInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addPro();
                            }
                        }}
                        placeholder="e.g., Great build quality"
                        disabled={isSubmitting || pros.length >= 5}
                    />
                    <Button
                        type="button"
                        onClick={addPro}
                        variant="outline"
                        size="icon"
                        disabled={isSubmitting || !proInput.trim() || pros.length >= 5}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {pros.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {pros.map((pro, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                <span className="text-green-600">+</span>
                                {pro}
                                <button
                                    type="button"
                                    onClick={() => removePro(index)}
                                    className="ml-1 hover:text-destructive"
                                    disabled={isSubmitting}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Cons */}
            <div>
                <Label className="text-base">Cons (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                    What could be improved?
                </p>
                <div className="flex gap-2 mb-2">
                    <Input
                        value={conInput}
                        onChange={(e) => setConInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addCon();
                            }
                        }}
                        placeholder="e.g., Battery life could be better"
                        disabled={isSubmitting || cons.length >= 5}
                    />
                    <Button
                        type="button"
                        onClick={addCon}
                        variant="outline"
                        size="icon"
                        disabled={isSubmitting || !conInput.trim() || cons.length >= 5}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {cons.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {cons.map((con, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                <span className="text-red-600">-</span>
                                {con}
                                <button
                                    type="button"
                                    onClick={() => removeCon(index)}
                                    className="ml-1 hover:text-destructive"
                                    disabled={isSubmitting}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full md:w-auto"
                size="lg"
                disabled={isSubmitting || rating === 0}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Review'
                )}
            </Button>

            <p className="text-xs text-muted-foreground">
                Your review will be published after moderation. This usually takes 24-48 hours.
            </p>
        </form>
    );
};