"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { cookies, headers } from "next/headers";
import { AUTH_COOKIE } from "../constants";
import { DATABASE_ID, MAIN_DOMAIN, USER_DATA_ID } from "../env-config";
import { ID, OAuthProvider, Query } from "node-appwrite";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";
import { authMiddleware } from "./middlewares";
import { updateUserLabels } from "./user-labels";
import { CompletePasswordRecoverySchema, InitiatePasswordRecoverySchema, loginSchema, signupSchema, verifyEmilSchema } from "../schemas/user-schema";

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
    .action(async ({ parsedInput: { email, password, phoneNumber, fullName, role } }) => {
        try {
            const { account, databases, users } = await createAdminClient();
            const isExistingUser = await users.list([Query.equal("email", [email])]);

            if (isExistingUser.total > 0) {
                return { error: "User with this email already exists" };
            }

            const newAcc = await account.create(
                ID.unique(),
                email,
                password,
                fullName
            );

            await databases.createDocument(
                DATABASE_ID,
                USER_DATA_ID,
                newAcc.$id,
                {
                    fullName,
                    email,
                    phoneNumber
                }
            );
            
            const session = await account.createEmailPasswordSession(email, password);

            const cookieStore = await cookies();

            cookieStore.set(AUTH_COOKIE, session.secret, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60
            });

            await updateUserLabels(newAcc.$id, [role]);

            return {
                success: "Account created.",
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

        const userData = await databases.getDocument(
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