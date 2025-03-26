"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { cookies, headers } from "next/headers";
import { AUTH_COOKIE } from "../constants";
import { DATABASE_ID, MAIN_DOMAIN, USER_DATA_ID } from "../env-config";
import { ID, OAuthProvider, Query } from "node-appwrite";
import { SignUpParams } from "../types";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";
import { loginSchema } from "../schemas";

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
            return { error: error instanceof Error ? error.message : "Failed to create product" };
        }
    })

export async function signUpAction(formData: SignUpParams) {
    try {
        const { email, password, username, phoneNumber } = formData;
        const { account, databases, users } = await createAdminClient();

        const isExistingUser = await users.list(
            [
                Query.equal("email", [email])
            ]
        );

        if (isExistingUser.total > 0) throw new Error("Email already exists")

        const newAcc = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        await databases.createDocument(
            DATABASE_ID,
            USER_DATA_ID,
            newAcc.$id,
            {
                fullName: username,
                email,
                // role: 'PHYSICAL_STORE_OWNER',
                phoneNumber
            }
        )
        const session = await account.createEmailPasswordSession(email, password);

        const cookieStore = await cookies();


        cookieStore.set(AUTH_COOKIE, session.secret, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
        });

        return newAcc;
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create account" };
    }
}

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

// export const loginWithGoogle = async () => {
//     try {
//         const headersList = await headers()
//         const origin = headersList.get("origin");

//         const { account } = await createSessionClient();

//         const results = await account.createOAuth2Token(
//             OAuthProvider.Google,
//             `${origin}/oauth`,
//             `${origin}/sign-in?google-auth-error=true`,
//         );

//         console.log("loginWithGoogle results: ",results);
//     } catch (error) {
//         console.log("loginWithGoogle error: ", error);
//         redirect(`${MAIN_DOMAIN}/sign-in?google-auth-error=true`)
//     }
// }

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