import { createAdminClient } from "@/lib/appwrite";
import { AUTH_COOKIE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");
    const error = searchParams.get("error");

    const redirectTo = (path: string) =>
        NextResponse.redirect(`${request.nextUrl.origin}${path}`);

    try {
        if (error) {
            throw new Error(`OAuth error: ${error}`);
        }

        if (!userId || !secret) {
            throw new Error("Missing required parameters");
        }

        const { account } = await createAdminClient();
        const session = await account.createSession(userId, secret);

        const cookieStore = await cookies();

        await cookieStore.set(AUTH_COOKIE, session.secret, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
        });

        revalidatePath("/")
        return redirectTo("/");
    } catch (error) {
        console.error("OAuth callback error:", error);
        return redirectTo("/sign-in?google-auth-error=true");
    }
}