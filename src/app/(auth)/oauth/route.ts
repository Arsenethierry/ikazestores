import { createAdminClient } from "@/lib/appwrite";
import { AUTH_COOKIE } from "@/lib/constants";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get("userId");
    const secret = request.nextUrl.searchParams.get("secret");

    if (!userId || !secret) {
        return NextResponse.redirect(`${request.nextUrl.origin}/sign-in?google-auth-error=true`)
    }
    const { account } = await createAdminClient();
    const session = await account.createSession(userId, secret);
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE, session.secret, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
    });

    return NextResponse.redirect(`${request.nextUrl.origin}`);
}
