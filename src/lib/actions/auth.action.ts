/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "../constants";
import { DATABASE_ID, USER_DATA_ID } from "../env-config";
import { ID, Query } from "node-appwrite";
import { SignInParams, SignUpParams } from "../types";

export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        return await account.get();
    } catch {
        return null;
    }
}

export const logInAction = async ({ email, password }: SignInParams) => {
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

        return session
    } catch (error: any) {
        console.error('signIn user action Error', error);
        // eslint-disable-next-line prefer-const
        let errorMessage = "An unexpected error occurred";
        throw new Error(error?.message ?? errorMessage);
    }
}

export async function signUpAction(formData: SignUpParams) {
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
        console.log("getUserData: ",error);
        return null;
    }
}