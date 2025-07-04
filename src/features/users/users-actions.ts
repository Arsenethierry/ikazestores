"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { updateUserLabels } from "@/lib/actions/user-labels";
import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { PhysicalStoreStatus, UserRole } from "@/lib/constants";
import { DATABASE_ID, USER_DATA_ID } from "@/lib/env-config";
import { applyPhysicalSellerActionSchema, changeUserRoleSchema, DeleteUserAccount, reviewApplicationSchema } from "@/lib/schemas/user-schema";
import { UserDataTypes } from "@/lib/types";
import { getAuthState } from "@/lib/user-permission";
import { createSafeActionClient } from "next-safe-action";
import { Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const getAllUsersData = async ({
    limit = 25,
    page = 1,
    search = "",
    accountType = "all"
}: {
    limit?: number;
    page?: number;
    search?: string;
    accountType?: string;
}) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [];

        if (search) {
            queries.push(Query.search("fullName", search));
        }

        if (accountType && accountType !== "all") {
            queries.push(Query.equal("accountType", accountType));
        }

        queries.push(Query.offset((page - 1) * limit));
        queries.push(Query.limit(limit));
        queries.push(Query.orderDesc('$createdAt'));

        const users = await databases.listDocuments<UserDataTypes>(
            DATABASE_ID,
            USER_DATA_ID,
            queries
        );

        return users
    } catch (error) {
        console.log("getAllUsersData: ", error);
        return {
            error: error instanceof Error ? error.message : "Failed to fetch users"
        };
    }
};

export const deleteUser = action
    .schema(DeleteUserAccount)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { users } = await createAdminClient();
        try {
            const { isSystemAdmin } = await getAuthState();
            if (!isSystemAdmin) {
                return {
                    error: "Unauthorized to perform this action"
                };
            };

            await ctx.databases.deleteDocument(
                DATABASE_ID,
                USER_DATA_ID,
                parsedInput.userId
            );

            await users.delete(parsedInput.userId);

            return {
                success: "User deleted successfully"
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to delete user"
            };
        }
    });

export const applyPhysicalSeller = action
    .schema(applyPhysicalSellerActionSchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user, databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            if (user.$id !== parsedInput.userId) {
                return { error: "Unauthorized: You can only apply for your own account" };
            }

            const userData = await databases.getDocument(
                DATABASE_ID,
                USER_DATA_ID,
                parsedInput.userId
            );

            const currentLabels = user.labels || [];
            if (currentLabels.includes(UserRole.PHYSICAL_SELLER_PENDING) ||
                currentLabels.includes(UserRole.PHYSICAL_STORE_OWNER)) {
                return { error: "You already have a physical seller application or are already a physical seller" };
            }

            if (userData.applicationStatus === PhysicalStoreStatus.PENDING) {
                return { error: "You already have a pending physical seller application" };
            }

            const updatedLabels = [...currentLabels, UserRole.PHYSICAL_SELLER_PENDING];

            await databases.updateDocument(
                DATABASE_ID,
                USER_DATA_ID,
                parsedInput.userId,
                {
                    businessName: parsedInput.businessName,
                    businessAddress: parsedInput.businessAddress,
                    businessPhone: parsedInput.businessPhone,
                    applicationReason: parsedInput.reason,
                    applicationStatus: PhysicalStoreStatus.PENDING,
                    applicationReviewedAt: null,
                    applicationReviewedBy: null,
                    applicationReviewNotes: null,
                    accountType: UserRole.PHYSICAL_SELLER_PENDING
                }
            );

            await updateUserLabels(parsedInput.userId, updatedLabels);

            return {
                success: "Physical seller application submitted successfully. You will be notified once reviewed."
            };
        } catch (error) {
            console.error('applyPhysicalSeller Error:', error);
            await rollback.rollback();
            return {
                error: error instanceof Error ? error.message : "Failed to submit physical seller application"
            };
        }
    });

export const reviewPhysicalSellerApplication = action
    .schema(reviewApplicationSchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { isSystemAdmin } = await getAuthState();
            if (!isSystemAdmin) {
                return {
                    error: "Unauthorized to perform this action"
                };
            }

            const userData = await ctx.databases.getDocument(
                DATABASE_ID,
                USER_DATA_ID,
                parsedInput.userId
            );

            if (userData.applicationStatus !== PhysicalStoreStatus.PENDING) {
                return {
                    error: "No pending application found for this user"
                };
            }

            const currentLabels = userData.accountType || [];
            let newLabels = [...currentLabels];

            newLabels = newLabels.filter(label => label !== UserRole.PHYSICAL_SELLER_PENDING);
            if (parsedInput.action === 'approve') {
                if (!newLabels.includes(UserRole.PHYSICAL_STORE_OWNER)) {
                    newLabels.push(UserRole.PHYSICAL_STORE_OWNER);
                }

                await ctx.databases.updateDocument(
                    DATABASE_ID,
                    USER_DATA_ID,
                    parsedInput.userId,
                    {
                        accountType: UserRole.PHYSICAL_STORE_OWNER,
                        applicationStatus: PhysicalStoreStatus.APPROVED,
                        applicationReviewedAt: new Date(),
                        applicationReviewedBy: ctx.user.$id,
                        applicationReviewNotes: parsedInput.reviewNotes || null
                    }
                );

                await updateUserLabels(parsedInput.userId, newLabels);

                return {
                    success: "Physical seller application approved successfully"
                };
            } else {
                if (!parsedInput.reviewNotes?.trim()) {
                    return {
                        error: "Review notes are required when rejecting an application"
                    };
                }

                newLabels.push(UserRole.BUYER);

                await ctx.databases.updateDocument(
                    DATABASE_ID,
                    USER_DATA_ID,
                    parsedInput.userId,
                    {
                        accountType: UserRole.BUYER,
                        applicationStatus: PhysicalStoreStatus.REJECTED,
                        applicationReviewedAt: new Date(),
                        applicationReviewedBy: ctx.user.$id,
                        applicationReviewNotes: parsedInput.reviewNotes
                    }
                );

                await updateUserLabels(parsedInput.userId, newLabels);

                return {
                    success: "Physical seller application rejected successfully"
                };
            }

        } catch (error) {
            console.error('reviewPhysicalSellerApplication Error:', error);
            return {
                error: error instanceof Error ? error.message : "Failed to review application"
            };
        }
    });

export const changeUserRole = action
    .schema(changeUserRoleSchema)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { isSystemAdmin } = await getAuthState();
            if (!isSystemAdmin) {
                return {
                    error: "Unauthorized to perform this action"
                };
            }

            const userData = await ctx.databases.getDocument(
                DATABASE_ID,
                USER_DATA_ID,
                parsedInput.userId
            );

            const currentRole = userData.accountType || UserRole.BUYER;
            if (currentRole === UserRole.SYS_ADMIN && ctx.user.$id === parsedInput.userId && parsedInput.newRole !== UserRole.SYS_ADMIN) {
                return {
                    error: "Cannot remove system admin role from yourself"
                };
            }
            if (currentRole === parsedInput.newRole) {
                return {
                    error: "User already has this role"
                };
            }

            const validRoles = Object.values(UserRole);
            
            if (!validRoles.includes(parsedInput.newRole as UserRole)) {
                return {
                    error: "Invalid role specified"
                };
            }
            await ctx.databases.updateDocument(
                DATABASE_ID,
                USER_DATA_ID,
                parsedInput.userId,
                {
                    accountType: parsedInput.newRole,
                    roleChangedAt: new Date(),
                    roleChangedBy: ctx.user.$id,
                    roleChangeReason: parsedInput.reason || null,
                    previousRole: currentRole,
                    applicationStatus: null,
                }
            );
            await updateUserLabels(parsedInput.userId, [parsedInput.newRole]);
            return {
                success: `User role changed from ${currentRole} to ${parsedInput.newRole} successfully`
            };
        } catch (error) {
            console.error('changeUserRole Error:', error);
            return {
                error: error instanceof Error ? error.message : "Failed to change role"
            };
        }
    })