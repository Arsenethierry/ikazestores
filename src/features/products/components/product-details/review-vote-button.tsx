

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { cn } from '@/lib/utils';
import { voteOnReviewAction } from '@/lib/actions/original-products-actions';

interface ReviewVoteButtonProps {
    reviewId: string;
    helpfulCount: number;
}

export const ReviewVoteButton = ({ reviewId, helpfulCount }: ReviewVoteButtonProps) => {
    const [localCount, setLocalCount] = useState(helpfulCount);
    const [hasVoted, setHasVoted] = useState(false);

    const { execute: vote, status } = useAction(voteOnReviewAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                if (data.message?.includes('removed')) {
                    setLocalCount(prev => prev - 1);
                    setHasVoted(false);
                } else {
                    setLocalCount(prev => prev + 1);
                    setHasVoted(true);
                }
                toast.success(data.message);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: () => {
            toast.error('Failed to vote. Please try again.');
        },
    });

    const handleVote = () => {
        vote({
            reviewId,
            voteType: "helpful",
        });
    };

    const isVoting = status === 'executing';

    return (
        <button
            onClick={handleVote}
            disabled={isVoting}
            className={cn(
                "flex items-center gap-1 hover:text-foreground transition-colors",
                hasVoted && "text-blue-600 hover:text-blue-700"
            )}
        >
            {isVoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <ThumbsUp className={cn("h-4 w-4", hasVoted && "fill-current")} />
            )}
            <span>Helpful ({localCount})</span>
        </button>
    );
};