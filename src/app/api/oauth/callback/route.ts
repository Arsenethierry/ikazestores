import { createAdminClient } from "@/lib/appwrite";
import { AUTH_COOKIE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const redirectTo = (path: string) =>
    NextResponse.redirect(`${request.nextUrl.origin}${path}`);

  try {
    if (error) {
      console.error(`OAuth provider error: ${error}`);
      if (error === "access_denied") {
        return redirectTo("/sign-in?google-auth-error=cancelled");
      }

      return redirectTo("/sign-in?google-auth-error=true");
    }

    if (!userId || !secret) {
      console.error("Missing OAuth parameters:", {
        userId: !!userId,
        secret: !!secret,
      });
      return redirectTo("/sign-in?google-auth-error=true");
    }

    const { account } = await createAdminClient();
    const session = await account.createSession(userId, secret);

    if (!session || !session.secret) {
      throw new Error("Failed to create session");
    }

    const cookieStore = await cookies();

    await cookieStore.set(AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Authentication Successful</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    text-align: center;
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="spinner"></div>
                <h2>Authentication Successful</h2>
                <p>Redirecting you to your dashboard...</p>
            </div>
            <script>
                try {
                    // Check for stored redirect URL from before OAuth
                    const redirectUrl = sessionStorage.getItem('oauth_redirect');
                    
                    // Clean up sessionStorage
                    sessionStorage.removeItem('oauth_redirect');
                    
                    // Redirect to stored URL or default to home
                    const targetUrl = redirectUrl || '/';
                    
                    // Small delay to show success message
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 1500);
                } catch (error) {
                    console.error('Redirect error:', error);
                    // Fallback redirect
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            </script>
        </body>
        </html>
        `;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);

    // Determine error type for better user experience
    let errorParam = "true";
    if (error instanceof Error) {
      if (error.message.includes("session")) {
        errorParam = "session-error";
      } else if (error.message.includes("user")) {
        errorParam = "user-error";
      } else if (error.message.includes("database")) {
        errorParam = "database-error";
      }
    }

    return redirectTo("/sign-in?google-auth-error=true");
  }
}
