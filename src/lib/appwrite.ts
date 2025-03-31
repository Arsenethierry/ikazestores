import 'server-only'

import {
    Account,
    Client,
    Databases,
    Locale,
    Storage,
    Teams,
    Users
} from "node-appwrite";
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from './constants';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './env-config';

export async function createSessionClient() {
    const cookieStore = await cookies()

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)

    const session = await cookieStore.get(AUTH_COOKIE)

    if (session) {
        client.setSession(session.value);
    }


    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get storage() {
            return new Storage(client);
        },
        get teams() {
            return new Teams(client);
        },
        get locale() {
            return new Locale(client);
        }
    };
}

export async function createAdminClient() {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(process.env.NEXT_APPWRITE_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get users() {
            return new Users(client);
        },
        get databases() {
            return new Databases(client);
        },
    };
}

// export async function withAuthSessionClient() {
//     const cookieStore = await cookies();
//     const session = cookieStore.get(AUTH_COOKIE);

//     if (!session) {
//         return null;
//     }

//     try {
//         const client = new Client()
//             .setEndpoint(APPWRITE_ENDPOINT)
//             .setProject(APPWRITE_PROJECT_ID)
//             .setSession(session.value);

//         const account = new Account(client);
//         const user = await account.get();

//         return { user, session: session.value };
//     } catch (error) {
//         console.error('Error validating session:', error);
//         return null;
//     }
// }