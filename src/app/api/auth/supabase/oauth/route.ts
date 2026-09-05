import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAuthServerClient,
  type PendingCookie,
} from "@/lib/supabase-server";
import { isSupabaseEnabled } from "@/lib/supabase";

function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get("host");
  if (host && !host.includes("localhost")) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (
    process.env.NEXTAUTH_URL &&
    (!process.env.NEXTAUTH_URL.includes("localhost") ||
      request.nextUrl.origin.includes("localhost"))
  ) {
    return process.env.NEXTAUTH_URL;
  }
  return request.nextUrl.origin || "http://localhost:3000";
}

/**
 * POST /api/auth/supabase/oauth
 * Body: { provider: "google" | "github" | "apple", redirectTo?: string }
 *
 * Initiates Supabase OAuth flow with PKCE, sets code verifier cookies,
 * and returns { url: string } for client-side redirection.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 400 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      /* default to empty body */
    }

    const provider = String(body.provider || "google");
    const baseUrl = getBaseUrl(request);
    const redirectTo = String(
      body.redirectTo || `${baseUrl}/api/auth/supabase/callback`
    );

    const pendingCookies: PendingCookie[] = [];
    const supabase = await createSupabaseAuthServerClient(pendingCookies);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google",
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        scopes: "openid email profile",
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { error: error?.message || "Failed to initiate OAuth" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ url: data.url });
    // Explicitly set any PKCE cookies on the outgoing response
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (error) {
    console.error("Error in POST /api/auth/supabase/oauth:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/supabase/oauth?provider=google
 * Directly redirects user to the OAuth provider URL.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.redirect(
        new URL("/login?error=Supabase+auth+is+not+configured", request.url)
      );
    }

    const provider = request.nextUrl.searchParams.get("provider") || "google";
    const next = request.nextUrl.searchParams.get("next") || "/account";
    const baseUrl = getBaseUrl(request);
    const redirectTo = `${baseUrl}/api/auth/supabase/callback?next=${encodeURIComponent(next)}`;

    const pendingCookies: PendingCookie[] = [];
    const supabase = await createSupabaseAuthServerClient(pendingCookies);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
      },
    });

    if (error || !data.url) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(
            error?.message || "Failed to initiate OAuth"
          )}`,
          request.url
        )
      );
    }

    const response = NextResponse.redirect(data.url);
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (error) {
    console.error("Error in GET /api/auth/supabase/oauth:", error);
    return NextResponse.redirect(
      new URL("/login?error=Internal+server+error", request.url)
    );
  }
}

