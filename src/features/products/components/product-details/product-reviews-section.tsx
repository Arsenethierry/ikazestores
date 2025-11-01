import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { getProductReviewsAction, getReviewStatsAction } from '@/lib/actions/original-products-actions';
import { ReviewVoteButton } from './review-vote-button';
import { ReviewForm } from './review-form';

interface ProductReviewsSectionProps {
    productId: string;
    virtualStoreId: string;
}

async function ReviewsContent({
    productId,
    virtualStoreId
}: {
    productId: string;
    virtualStoreId: string;
}) {
    // Fetch reviews using server action
    const reviewsResult = await getProductReviewsAction({
        productId,
        limit: 10,
        sortBy: 'newest',
    });

    // Fetch review statistics using server action
    const statsResult = await getReviewStatsAction({
        productId,
        virtualStoreId,
    });

    if (!reviewsResult.success || !reviewsResult.data) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Failed to load reviews. Please try again later.
            </div>
        );
    }

    const { documents: reviews } = reviewsResult.data;
    const stats = statsResult.success && statsResult.data ? statsResult.data : null;

    const avgRating = stats?.averageRating || 0;
    const totalReviews = stats?.totalReviews || 0;

    const ratingDistribution =
        stats?.ratingDistribution && stats?.ratingDistributionPercentage
            ? [1, 2, 3, 4, 5].reverse().map(stars => ({
                stars,
                count: (stats.ratingDistribution as Record<number, number>)[stars],
                percentage: (stats.ratingDistributionPercentage as Record<number, number>)[stars],
            }))
            : [];


    if (totalReviews === 0) {
        return (
            <div className="text-center py-12">
                <div className="mb-4">
                    <Star className="h-12 w-12 text-gray-300 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-4">
                    Be the first to review this product!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Rating Summary */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-6xl font-bold mb-2">{avgRating.toFixed(1)}</div>
                    <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-5 w-5 ${i < Math.floor(avgRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Based on {totalReviews.toLocaleString()} reviews
                    </p>
                </div>

                <div className="space-y-2">
                    {ratingDistribution.map(({ stars, count, percentage }) => (
                        <div key={stars} className="flex items-center gap-2">
                            <span className="text-sm w-12">{stars} star</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-muted-foreground w-16 text-right">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional Stats */}
            {stats && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>
                        <Badge variant="secondary">
                            {stats.verifiedPurchaseCount} Verified Purchases
                        </Badge>
                    </div>
                    <div>
                        <Badge variant="secondary">
                            {stats.withPhotosCount} With Photos
                        </Badge>
                    </div>
                </div>
            )}

            <Separator />

            {/* Tabs for filters */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All Reviews</TabsTrigger>
                    <TabsTrigger value="positive">Positive (4-5★)</TabsTrigger>
                    <TabsTrigger value="critical">Critical (1-3★)</TabsTrigger>
                    <TabsTrigger value="images">With Images</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-6">
                    {reviews.map((review) => (
                        <Card key={review.$id}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                                        {review.userName?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                            <div>
                                                <p className="font-semibold">{review.userName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(review.$createdAt), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            {review.isVerifiedPurchase && (
                                                <Badge variant="default" className="text-xs">
                                                    Verified Purchase
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < review.rating
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Review Title */}
                                        {review.title && (
                                            <h4 className="font-semibold mb-2">{review.title}</h4>
                                        )}

                                        {/* Review Comment */}
                                        <p className="text-sm mb-3 whitespace-pre-wrap">
                                            {review.comment}
                                        </p>

                                        {/* Pros & Cons */}
                                        {(review.pros && review.pros.length > 0) ||
                                            (review.cons && review.cons.length > 0) ? (
                                            <div className="grid md:grid-cols-2 gap-4 mb-3">
                                                {review.pros && review.pros.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-green-600 mb-1">
                                                            Pros:
                                                        </p>
                                                        <ul className="text-xs space-y-1">
                                                            {review.pros.map((pro, idx) => (
                                                                <li key={idx} className="flex gap-1">
                                                                    <span className="text-green-600">+</span>
                                                                    <span>{pro}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {review.cons && review.cons.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-red-600 mb-1">
                                                            Cons:
                                                        </p>
                                                        <ul className="text-xs space-y-1">
                                                            {review.cons.map((con, idx) => (
                                                                <li key={idx} className="flex gap-1">
                                                                    <span className="text-red-600">-</span>
                                                                    <span>{con}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Review Images */}
                                        {review.images && review.images.length > 0 && (
                                            <div className="flex gap-2 mb-3 flex-wrap">
                                                {review.images.slice(0, 4).map((img, idx) => (
                                                    <div key={idx} className="relative w-20 h-20">
                                                        <Image
                                                            src={img}
                                                            alt={`Review image ${idx + 1}`}
                                                            fill
                                                            className="rounded-md object-cover"
                                                        />
                                                    </div>
                                                ))}
                                                {review.images.length > 4 && (
                                                    <div className="w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                                                        +{review.images.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <ReviewVoteButton
                                                reviewId={review.$id}
                                                helpfulCount={review.helpfulVotes || 0}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Other tab contents would filter reviews accordingly */}
                <TabsContent value="positive" className="space-y-4 mt-6">
                    <p className="text-center text-muted-foreground py-8">
                        Filter implementation pending...
                    </p>
                </TabsContent>

                <TabsContent value="critical" className="space-y-4 mt-6">
                    <p className="text-center text-muted-foreground py-8">
                        Filter implementation pending...
                    </p>
                </TabsContent>

                <TabsContent value="images" className="space-y-4 mt-6">
                    <p className="text-center text-muted-foreground py-8">
                        Filter implementation pending...
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export const ProductReviewsSection = (props: ProductReviewsSectionProps) => {
    return (
        <Card className="my-8">
            <CardHeader>
                <CardTitle>Customer Reviews & Ratings</CardTitle>
            </CardHeader>
            <CardContent>
                <Suspense fallback={
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse space-y-4 w-full">
                            <div className="h-32 bg-gray-200 rounded" />
                            <div className="h-24 bg-gray-200 rounded" />
                            <div className="h-24 bg-gray-200 rounded" />
                        </div>
                    </div>
                }>
                    <ReviewsContent
                        productId={props.productId}
                        virtualStoreId={props.virtualStoreId}
                    />
                </Suspense>

                <Separator className="my-6" />

                <div>
                    <h3 className="font-semibold mb-4">Write a Review</h3>
                    <ReviewForm
                        productId={props.productId}
                        virtualStoreId={props.virtualStoreId}
                    />
                </div>
            </CardContent>
        </Card>
    );
};