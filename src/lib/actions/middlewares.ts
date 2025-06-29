"use server";

import { AUTH_COOKIE } from "@/lib/constants";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/lib/env-config";
import { createMiddleware } from "next-safe-action";
import { cookies } from "next/headers";
import { Account, Client, Databases, Storage, Teams } from "node-appwrite";

export const authMiddleware = createMiddleware().define(async ({ next }) => {
    const cookieStore = await cookies();

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)

    const session = await cookieStore.get(AUTH_COOKIE)

    if (!session) {
        throw new Error("Access denied");
    }

    client.setSession(session.value);

    const account = new Account(client);
    const databases = new Databases(client);
    const storage = new Storage(client);
    const teams = new Teams(client);

    const user = await account.get();
    return next({ ctx: { user, databases, storage, account, teams } });
});

export const physicalStoreOwnerMiddleware = createMiddleware()
    .define(async ({ ctx, next }) => {
        console.log("Physical store owner middleware: " + ctx)
        return next();
    });

export const virtualStoreOwnerMiddleware = createMiddleware()
    .define(async ({ ctx, next, clientInput }) => {
        const { productId } = clientInput as { productId: string }
        console.log("clientInput", productId)

        return next({ ctx })
    });
