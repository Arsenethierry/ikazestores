"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { cookies, headers } from "next/headers";
import { AUTH_COOKIE, PhysicalStoreStatus, UserRole } from "../constants";
import { DATABASE_ID, MAIN_DOMAIN, PHYSICAL_SELLER_APPLICATIONS, USER_DATA_ID } from "../env-config";
import { ID, OAuthProvider, Query, Models } from "node-appwrite";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";
import { authMiddleware } from "./middlewares";
import { AddNewUserLabels, applyPhysicalSellerActionSchema, CompletePasswordRecoverySchema, DeleteUserAccount, InitiatePasswordRecoverySchema, loginSchema, signupSchema, verifyEmilSchema } from "../schemas/user-schema";
import countriesData from "@/data/countries.json";
import { UserDataTypes } from "../types";
import { updateUserLabels } from "./user-labels";
import { AppwriteRollback } from "./rollback";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        return await account.get();
    } catch {
        return null;
    }
}

export const logInAction = action
    .schema(loginSchema)
    .action(async ({ parsedInput: { email, password } }) => {
        try {
            const { account } = await createAdminClient();
            const session = await account.createEmailPasswordSession(email, password);

            const cookieStore = await cookies();

            cookieStore.set(AUTH_COOKIE, session.secret, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
            });

            return { success: "You are logged in.", session };
        } catch (error) {
            console.error('signIn user action Error', error);
            return { error: error instanceof Error ? error.message : "Failed to login" };
        }
    })

export const signUpAction = action
    .schema(signupSchema)
    .action(async ({ parsedInput: { email, password, phoneNumber, fullName } }) => {
        try {
            const { account, databases, users } = await createAdminClient();
            const isExistingUser = await users.list([Query.equal("email", [email])]);

            if (isExistingUser.total > 0) {
                return { error: "User with this email already exists" };
            }

            const anonymousSession = await account.createAnonymousSession();

            const cookieStore = await cookies();
            cookieStore.set(AUTH_COOKIE, anonymousSession.secret, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 5
            });

            const newAcc = await account.create(
                ID.unique(),
                email,
                password,
                fullName
            );

            if (phoneNumber) {
                try {
                    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
                    if (cleanedPhone.startsWith('+') && cleanedPhone.length <= 16) {
                        await account.updatePhone(cleanedPhone, password);
                    } else {
                        console.warn('Invalid phone number format:', phoneNumber);
                    }
                } catch (error) {
                    console.warn('Failed to add phone number during signup:', error);
                }
            }

            await databases.createDocument(
                DATABASE_ID,
                USER_DATA_ID,
                newAcc.$id,
                {
                    fullName,
                    email,
                    phoneNumber: phoneNumber || ""
                }
            );

            try {
                await account.deleteSession(anonymousSession.$id);
            } catch (error) {
                console.warn('Failed to delete anonymous session:', error);
            }

            cookieStore.delete(AUTH_COOKIE);

            const session = await account.createEmailPasswordSession(email, password);

            cookieStore.set(AUTH_COOKIE, session.secret, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60
            });

            return {
                success: "Account created successfully.",
                user: newAcc
            };
        } catch (error) {
            console.error('create user action Error', error);
            return { error: error instanceof Error ? error.message : "Failed to create user" };
        }
    })

export const createEmailVerification = action
    .use(authMiddleware)
    .action(async ({ ctx }) => {
        const { account, user } = ctx;

        try {
            const verification = await account.createVerification(`ikazestores.com/verify-email`);
            return {
                success: "Account created. Please verify your email.",
                userId: user.$id,
                verificationId: verification.$id,
            };
        } catch (error) {
            console.error('create user action Error', error);
            return { error: error instanceof Error ? error.message : "Failed to create email verification" };
        }
    })


export const logoutCurrentUser = async () => {
    try {
        const { account } = await createSessionClient();
        const currentUser = await account.get();

        if (!currentUser) throw new Error("No current user");

        await account.deleteSession("current");

        const cookieStore = await cookies();

        cookieStore.delete(AUTH_COOKIE)

    } catch (error) {
        throw error;
    }
}

export const getUserData = async (userId: string) => {
    try {
        const { databases } = await createSessionClient();
        const userData = await databases.getDocument<UserDataTypes>(
            DATABASE_ID,
            USER_DATA_ID,
            userId
        );

        return userData
    } catch (error) {
        console.log("getUserData: ", error);
        return null;
    }
}

export const loginWithGoogle = async () => {
    try {
        const headersList = await headers()
        const origin = headersList.get("origin") || MAIN_DOMAIN;

        const { account } = await createSessionClient();

        const authorizationUrl = await account.createOAuth2Token(
            OAuthProvider.Google,
            `${origin}/api/oauth/callback`,
            `${origin}/sign-in?google-auth-error=true`
        );

        return { url: authorizationUrl };
    } catch (error) {
        console.error("Google OAuth initiation failed:", error);
        redirect(`${MAIN_DOMAIN}/sign-in?google-auth-error=true`);
    }
};


export const verifyEmailAction = action
    .use(authMiddleware)
    .schema(verifyEmilSchema)
    .action(async ({ parsedInput: { secret, userId } }) => {
        try {
            const { account } = await createSessionClient();

            await account.updateVerification(userId, secret);

            return { success: "Email verified successfully" };
        } catch (error) {
            console.error('Email Verification Error:', error);
            return { error: error instanceof Error ? error.message : "Email verification failed" };
        }
    });

export const initiatePasswordRecovery = action
    .schema(InitiatePasswordRecoverySchema)
    .action(async ({ parsedInput: { email } }) => {
        try {
            const { account } = await createSessionClient();
            const recoveryResponse = await account.createRecovery(email, `${MAIN_DOMAIN}/forgot-password`)

            return {
                success: "Initiated password reset",
                recoveryResponse
            };
        } catch (error) {
            console.error('Failed to initiate password recovery', error);
            return { error: error instanceof Error ? error.message : "Failed to initiate password recovery" };
        }
    })

export const completePasswordRecovery = action
    .schema(CompletePasswordRecoverySchema)
    .action(async ({
        parsedInput: {
            newPassword,
            secret,
            userId
        }
    }) => {
        try {
            const { account } = await createSessionClient();
            const recoveryResponse = await account.updateRecovery(
                userId,
                secret,
                newPassword
            );
            return {
                success: "Password updated successfully",
                recoveryResponse
            };
        } catch (error) {
            console.error('Password Recovery Completion Error:', error);
            return { error: error instanceof Error ? error.message : "Email verification failed" };
        }
    })

export const getUserLocale = async () => {
    try {
        const { locale } = await createSessionClient();
        const result = await locale.get();

        if (!result.currency || result.currency.trim() === "") {
            const fallback = countriesData.find(
                (c) =>
                    c.code.toLowerCase() === result.countryCode.toLowerCase() ||
                    c.name.toLowerCase() === result.country.toLowerCase()
            );


            if (fallback?.currency) {
                result.currency = fallback.currency;
            }
        }

        return result
    } catch (error) {
        console.error("useUserLocale:", error);
        return null
    }
}

export const getCountriesLocale = async () => {
    try {
        const { locale } = await createSessionClient();
        const result = await locale.listCountries();

        return result
    } catch (error) {
        console.error("getCountriesLocale:", error);
    }
}
export const getCurrencyList = async () => {
    try {
        const { locale } = await createSessionClient();
        const result = await locale.listCurrencies();

        return result
    } catch (error) {
        console.error("getCurrencyList:", error);
    }
}

export async function getUserTeams() {
    try {
        const { teams } = await createSessionClient();

        const teamsList = await teams.list();

        return teamsList.teams || [];
    } catch (error) {
        console.error('Error fetching user teams:', error);
        return [];
    }
}

export async function getUserMemberships(): Promise<Models.Membership[]> {
    try {
        const { teams } = await createSessionClient();

        const teamList = await teams.list();
        const allMemberships: Models.Membership[] = [];

        for (const team of teamList.teams) {
            try {
                const memberships = await teams.listMemberships(team.$id);
                const enhancedMemberships = memberships.memberships.map(memberships => ({
                    ...memberships,
                    teamName: team.name,
                    teamId: team.$id
                }));

                allMemberships.push(...enhancedMemberships);
            } catch (error) {
                console.error(`Error fetching memberships for team ${team.$id}:`, error);
                // Continue with other teams even if one fails
                continue;
            }
        }

        return allMemberships;
    } catch (error) {
        console.error('Error fetching user memberships:', error);
        return [];
    }
}

export async function getUserMembershipForTeam(teamId: string): Promise<Models.Membership | null> {
    try {
        const { teams, account } = await createSessionClient();
        const user = await account.get();
        const memberships = await teams.listMemberships(teamId);

        const userMembership = memberships.memberships.find(
            membership => membership.userId === user.$id
        );

        if (userMembership) {
            // Get team details to add team name
            const team = await teams.get(teamId);
            return {
                ...userMembership,
                teamName: team.name,
                teamId: team.$id,
            };
        }

        return null;
    } catch (error) {
        console.error(`Error fetching user membership for team ${teamId}:`, error);
        return null;
    }
}

export async function isUserMemberOfTeam(teamId: string): Promise<boolean> {
    try {
        const membership = await getUserMembershipForTeam(teamId);
        return membership !== null;
    } catch (error) {
        console.error(`Error checking team membership for ${teamId}:`, error);
        return false;
    }
}

export async function getUserRoleInTeam(teamId: string): Promise<string | null> {
    try {
        const membership = await getUserMembershipForTeam(teamId);
        return membership?.roles?.[0] || null;
    } catch (error) {
        console.error(`Error getting user role in team ${teamId}:`, error);
        return null;
    }
}

export async function getTeamsByPattern(pattern: RegExp): Promise<Models.Team<Models.Preferences>[]> {
    try {
        const teams = await getUserTeams();
        return teams.filter(team => pattern.test(team.name));
    } catch (error) {
        console.error('Error filtering teams by pattern:', error);
        return [];
    }
}

export const updateUserAccountType = action
    .schema(AddNewUserLabels)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user } = ctx;
        try {
            if (parsedInput.labels.length === 1 && parsedInput.labels[0] === UserRole.VIRTUAL_STORE_OWNER && user.$id === parsedInput.userId) {
                updateUserLabels(parsedInput.userId, parsedInput.labels);
                return { success: true }
            }
            return { error: "something went wrong" }
        } catch (error) {
            console.error('updateUserAccountType Error:', error);
            return { error: error instanceof Error ? error.message : "updateUserAccountType failed" };
        }
    });

export const deleteUserAccount = action
    .schema(DeleteUserAccount)
    .use(authMiddleware)
    .action(async ({ parsedInput, ctx }) => {
        const { user: currentUser } = ctx;
        const { users } = await createAdminClient();
        try {
            if (currentUser.$id !== parsedInput.userId) {
                return { error: "Action denied." }
            }
            await users.delete(parsedInput.userId);
            const cookieStore = await cookies();

            cookieStore.delete(AUTH_COOKIE)
            return { success: "Your account has been deleted." }
        } catch (error) {
            console.error('deleteUserAccount Error:', error);
            return { error: error instanceof Error ? error.message : "updateUserAccountType failed" };
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
            const currentLabels = user.labels || [];
            if (currentLabels.includes(UserRole.PHYSICAL_SELLER_PENDING) ||
                currentLabels.includes(UserRole.PHYSICAL_STORE_OWNER)) {
                return { error: "You already have a physical seller application or are already a physical seller" };
            }

            const updatedLabels = [...currentLabels, UserRole.PHYSICAL_SELLER_PENDING];

            const applicationData = {
                userId: parsedInput.userId,
                businessName: parsedInput.businessName,
                businessAddress: parsedInput.businessAddress,
                businessPhone: parsedInput.businessPhone,
                businessLicense: parsedInput.businessLicense,
                taxId: parsedInput.taxId || null,
                reason: parsedInput.reason,
                status: PhysicalStoreStatus.PENDING,
                appliedAt: new Date(),
                reviewedAt: null,
                reviewedBy: null,
                reviewNotes: null
            };

            const app = await databases.createDocument(
                DATABASE_ID,
                PHYSICAL_SELLER_APPLICATIONS,
                ID.unique(),
                applicationData
            );
            await rollback.trackDocument(PHYSICAL_SELLER_APPLICATIONS, app.$id);

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