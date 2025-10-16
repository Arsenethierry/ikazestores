"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Star } from "lucide-react";
import { getStoreReviewsAction } from "@/lib/actions/store-review-actions";
import { VirtualstoreReviews } from "@/lib/types/appwrite/appwrite";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StoreReviewCard } from "./store-review-card";

interface StoreReviewsListProps {
  storeId: string;
}

type SortOption = "newest" | "oldest" | "rating_high" | "rating_low";

export function StoreReviewsList({ storeId }: StoreReviewsListProps) {
  const [reviews, setReviews] = useState<VirtualstoreReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const fetchReviews = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await getStoreReviewsAction({
        virtualStoreId: storeId,
        page: pageNum,
        limit: 10,
        sortBy,
        rating: ratingFilter,
        verifiedOnly,
      });

      if (result?.data?.success && result.data.data) {
        const newReviews = result.data.data.documents;
        setReviews(append ? [...reviews, ...newReviews] : newReviews);
        setTotal(result.data.data.total);
        setHasMore(result.data.data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    fetchReviews(1, false);
  }, [storeId, sortBy, ratingFilter, verifiedOnly]);

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 pb-4 border-b last:border-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Customer Reviews {total > 0 && `(${total})`}
          </CardTitle>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Rating Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Rating</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[5, 4, 3, 2, 1].map((rating) => (
                  <DropdownMenuCheckboxItem
                    key={rating}
                    checked={ratingFilter === rating}
                    onCheckedChange={(checked) =>
                      setRatingFilter(checked ? rating : undefined)
                    }
                  >
                    <div className="flex items-center gap-1">
                      <span>{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={verifiedOnly}
                  onCheckedChange={setVerifiedOnly}
                >
                  Verified Customers Only
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating_high">Highest Rated</SelectItem>
                <SelectItem value="rating_low">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No reviews found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <StoreReviewCard key={review.$id} review={review} storeId={storeId} />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More Reviews"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}