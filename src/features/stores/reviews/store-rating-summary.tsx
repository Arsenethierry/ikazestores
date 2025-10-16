"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoreRatingStatsAction } from "@/lib/actions/store-review-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/progressive-component";

interface StoreRatingSummaryProps {
    storeId: string;
}

export function StoreRatingSummary({ storeId }: StoreRatingSummaryProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getStoreRatingStatsAction({ virtualStoreId: storeId });
                if (result?.data?.success && result.data.data) {
                    setStats(result.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch rating stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [storeId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!stats || stats.totalReviews === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">No reviews yet</p>
                        <p className="text-sm">Be the first to review this store!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Overall Rating */}
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">
                                {stats.averageRating.toFixed(1)}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= Math.round(stats.averageRating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-200 text-gray-200"
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
                            </p>
                        </div>

                        {/* Customer Service Rating */}
                        {stats.averageCustomerServiceRating > 0 && (
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">Customer Service</span>
                                    <span className="text-sm font-medium">
                                        {stats.averageCustomerServiceRating.toFixed(1)}
                                    </span>
                                </div>
                                <Progress
                                    value={(stats.averageCustomerServiceRating / 5) * 100}
                                    className="h-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                            const percentage = stats.totalReviews > 0
                                ? (count / stats.totalReviews) * 100
                                : 0;

                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-16">
                                        <span className="text-sm font-medium">{rating}</span>
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <Progress value={percentage} className="flex-1 h-2" />
                                    <span className="text-sm text-muted-foreground w-12 text-right">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}