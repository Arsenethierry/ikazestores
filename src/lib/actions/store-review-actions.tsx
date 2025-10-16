"use server";

import { createSafeActionClient } from "next-safe-action";
import { StoreReviewModel } from "../models/VirtualStoreReviewModel";
import { authMiddleware } from "./middlewares";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { VoteType } from "../types/appwrite/appwrite";
import { AddReviewReplySchema, createStoreReviewSchema, UpdateStoreReviewSchema, VoteOnReviewSchema } from "../schemas/stores-schema";

const storeReviewModel = new StoreReviewModel();

const action = createSafeActionClient({
    handleServerError: (error) => {
        console.error("Store review action error:", error);
        return error instanceof Error ? error.message : "Something went wrong";
    },
});

export const checkStoreReviewEligibilityAction = action
    .schema(z.object({ virtualStoreId: z.string().min(1) }))
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { virtualStoreId } = parsedInput;

        try {
            const eligibility = await storeReviewModel.checkStoreReviewEligibility(
                virtualStoreId
            );

            return {
                success: true,
                data: eligibility,
            };
        } catch (error) {
            console.error("Check eligibility error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to check eligibility",
            };
        }
    });

export const createStoreReviewAction = action
    .schema(createStoreReviewSchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const result = await storeReviewModel.createStoreReview(parsedInput);

            if ("error" in result) {
                return {
                    success: false,
                    error: result.error,
                };
            }

            revalidatePath(`/store/${parsedInput.virtualStoreId}/details`);
            revalidatePath(`/store/${parsedInput.virtualStoreId}`);

            return {
                success: true,
                data: result,
                message: "Review submitted successfully! It will be visible after moderation.",
            };
        } catch (error) {
            console.error("Create review error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to create review",
            };
        }
    });

export const updateStoreReviewAction = action
    .schema(UpdateStoreReviewSchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user } = ctx;

        try {
            const result = await storeReviewModel.updateStoreReview(
                parsedInput.reviewId,
                parsedInput
            );

            if ("error" in result) {
                return {
                    success: false,
                    error: result.error,
                };
            }

            revalidatePath(`/store/${result.virtualStoreId}/details`);
            revalidatePath(`/store/${result.virtualStoreId}`);

            return {
                success: true,
                data: result,
                message: "Review updated successfully! Changes will be visible after moderation.",
            };
        } catch (error) {
            console.error("Update review error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to update review",
            };
        }
    });

export const getStoreReviewsAction = action
    .schema(
        z.object({
            virtualStoreId: z.string().min(1),
            page: z.number().optional(),
            limit: z.number().optional(),
            rating: z.number().min(1).max(5).optional(),
            sortBy: z
                .enum(["newest", "oldest", "rating_high", "rating_low"])
                .optional(),
            verifiedOnly: z.boolean().optional(),
        })
    )
    .action(async ({ parsedInput }) => {
        const { virtualStoreId, page = 1, limit = 10, ...filters } = parsedInput;

        try {
            const reviews = await storeReviewModel.getStoreReviews(virtualStoreId, {
                limit,
                ...filters,
            });

            return {
                success: true,
                data: reviews,
            };
        } catch (error) {
            console.error("Get reviews error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to fetch reviews",
            };
        }
    });

export const getStoreRatingStatsAction = action
    .schema(z.object({ virtualStoreId: z.string().min(1) }))
    .action(async ({ parsedInput }) => {
        const { virtualStoreId } = parsedInput;

        try {
            const stats = await storeReviewModel.getStoreRatingStats(virtualStoreId);

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            console.error("Get rating stats error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch rating stats",
            };
        }
    });

export const getUserStoreReviewAction = action
    .schema(z.object({ virtualStoreId: z.string().min(1) }))
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user } = ctx;
        const { virtualStoreId } = parsedInput;

        try {
            const review = await storeReviewModel.getUserStoreReview(
                virtualStoreId,
                user.$id
            );

            return {
                success: true,
                data: review,
            };
        } catch (error) {
            console.error("Get user review error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch user review",
            };
        }
    });

export const moderateStoreReviewAction = action
    .schema(z.object({
        reviewId: z.string().min(1),
        status: z.enum(["approved", "rejected"]),
    }))
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user } = ctx;
        const { reviewId, status } = parsedInput;

        try {
            const result = await storeReviewModel.moderateReview(
                reviewId,
                status,
                user.$id
            );

            if ("error" in result) {
                return {
                    success: false,
                    error: result.error,
                };
            }

            revalidatePath(`/store/${result.virtualStoreId}/details`);
            revalidatePath(`/admin/stores/${result.virtualStoreId}/reviews`);

            return {
                success: true,
                data: result,
                message: `Review ${status} successfully`,
            };
        } catch (error) {
            console.error("Moderate review error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to moderate review",
            };
        }
    });

export const addStoreReviewReplyAction = action
    .schema(AddReviewReplySchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user } = ctx;
        const { reviewId, comment, userType } = parsedInput;

        try {
            const userName = user.name || user.email?.split("@")[0] || "User";

            const result = await storeReviewModel.addReviewReply(
                reviewId,
                comment,
                user.$id,
                userName,
                userType
            );

            if ("error" in result) {
                return {
                    success: false,
                    error: result.error,
                };
            }

            revalidatePath(`/store/*/details`);

            return {
                success: true,
                data: result,
                message: "Reply added successfully",
            };
        } catch (error) {
            console.error("Add reply error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to add reply",
            };
        }
    });

export const getReviewRepliesAction = action
    .schema(z.object({ reviewId: z.string().min(1) }))
    .action(async ({ parsedInput }) => {
        const { reviewId } = parsedInput;

        try {
            const replies = await storeReviewModel.getReviewReplies(reviewId);

            return {
                success: true,
                data: replies,
            };
        } catch (error) {
            console.error("Get replies error:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to fetch replies",
            };
        }
    });

export const voteOnStoreReviewAction = action
    .schema(VoteOnReviewSchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { reviewId, voteType } = parsedInput;

        try {
            const result = await storeReviewModel.voteOnReview(
                reviewId,
                voteType as VoteType
            );

            if (result.error) {
                return {
                    success: false,
                    error: result.error,
                };
            }

            revalidatePath(`/store/*/details`);

            return {
                success: true,
                message: result.success || "Vote recorded",
            };
        } catch (error) {
            console.error("Vote on review error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to vote",
            };
        }
    });