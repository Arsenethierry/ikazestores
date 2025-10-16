"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Star,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    ShieldCheck,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { VirtualstoreReviews, ReviewReply } from "@/lib/types/appwrite/appwrite";
import { useAction } from "next-safe-action/hooks";
import {
    voteOnStoreReviewAction,
    addStoreReviewReplyAction,
    getReviewRepliesAction,
} from "@/lib/actions/store-review-actions";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import { checkStoreAccess } from "@/lib/helpers/store-permission-helper";

interface StoreReviewCardProps {
    review: VirtualstoreReviews;
    storeId: string;
}

export function StoreReviewCard({ review, storeId }: StoreReviewCardProps) {
    const { data: currentUser } = useCurrentUser();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replies, setReplies] = useState<ReviewReply[]>([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [canReply, setCanReply] = useState(false);

    // Check if current user can reply (store owner/admin)
    useEffect(() => {
        const checkReplyPermission = async () => {
            if (!currentUser) return;

            try {
                const hasAccess = await checkStoreAccess(
                    currentUser.$id,
                    storeId,
                    "respond_to_reviews"
                );
                setCanReply(hasAccess);
            } catch (error) {
                setCanReply(false);
            }
        };

        checkReplyPermission();
    }, [currentUser, storeId]);

    const { execute: voteOnReview, isExecuting: isVoting } = useAction(
        voteOnStoreReviewAction,
        {
            onSuccess: (result) => {
                if (result?.data?.success) {
                    toast.success(result.data.message);
                } else {
                    toast.error(result?.data?.error || "Failed to vote");
                }
            },
        }
    );

    const { execute: addReply, isExecuting: isAddingReply } = useAction(
        addStoreReviewReplyAction,
        {
            onSuccess: (result) => {
                if (result?.data?.success) {
                    toast.success("Reply added successfully");
                    setReplyText("");
                    setShowReplyForm(false);
                    loadReplies();
                } else {
                    toast.error(result?.data?.error || "Failed to add reply");
                }
            },
        }
    );

    const loadReplies = async () => {
        setLoadingReplies(true);
        try {
            const result = await getReviewRepliesAction({ reviewId: review.$id });
            if (result?.data?.success && result.data.data) {
                setReplies(result.data.data.documents);
            }
        } catch (error) {
            console.error("Failed to load replies:", error);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleVote = (voteType: "helpful" | "unhelpful") => {
        if (!currentUser) {
            toast.error("Please sign in to vote");
            return;
        }
        voteOnReview({ reviewId: review.$id, voteType });
    };

    const handleAddReply = () => {
        if (!replyText.trim()) {
            toast.error("Please enter a reply");
            return;
        }

        addReply({
            reviewId: review.$id,
            comment: replyText,
            userType: canReply ? "store_owner" : "customer",
        });
    };

    const toggleReplies = () => {
        if (!showReplies && replies.length === 0) {
            loadReplies();
        }
        setShowReplies(!showReplies);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-4 pb-6 border-b last:border-0">
            {/* Review Header */}
            <div className="flex items-start gap-4">
                <Avatar>
                    <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{review.userName}</span>
                            {review.isVerifiedCustomer && (
                                <Badge variant="secondary" className="text-xs">
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Verified Customer
                                </Badge>
                            )}
                            {review.orderCount && review.orderCount > 1 && (
                                <Badge variant="outline" className="text-xs">
                                    {review.orderCount} orders
                                </Badge>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {format(new Date(review.$createdAt), "MMM d, yyyy")}
                        </span>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.overallRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200"
                                        }`}
                                />
                            ))}
                        </div>
                        {review.customerServiceRating && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Service:</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-3 w-3 ${star <= review.customerServiceRating!
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "fill-gray-200 text-gray-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Review Title */}
                    {review.title && (
                        <h4 className="font-semibold text-base">{review.title}</h4>
                    )}

                    {/* Review Comment */}
                    {review.comment && (
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {review.comment}
                        </p>
                    )}

                    {/* Review Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote("helpful")}
                            disabled={isVoting || !currentUser}
                        >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Helpful
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote("unhelpful")}
                            disabled={isVoting || !currentUser}
                        >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Not Helpful
                        </Button>
                        {currentUser && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowReplyForm(!showReplyForm)}
                            >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Reply
                            </Button>
                        )}
                        {replies.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleReplies}
                                disabled={loadingReplies}
                            >
                                {loadingReplies ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        {showReplies ? "Hide" : "Show"} {replies.length} repl
                                        {replies.length === 1 ? "y" : "ies"}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {showReplyForm && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                            <Textarea
                                placeholder="Write your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAddReply}
                                    disabled={isAddingReply || !replyText.trim()}
                                >
                                    {isAddingReply && (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    )}
                                    Post Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setShowReplyForm(false);
                                        setReplyText("");
                                    }}
                                    disabled={isAddingReply}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {showReplies && replies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                            {replies.map((reply) => (
                                <div key={reply.$id} className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {getInitials(reply.userName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">
                                                    {reply.userName}
                                                </span>
                                                {reply.userType === "store_owner" && (
                                                    <Badge variant="default" className="text-xs">
                                                        Store Owner
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(reply.$createdAt), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {reply.comment}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}