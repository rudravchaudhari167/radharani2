import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { generateToken, setAuthCookie, hashPassword } from "@/lib/auth";
import { getSupabaseAdmin, isSupabaseEnabled } from "@/lib/supabase";

/**
 * GET /api/auth/supabase/callback?code=...&next=/...
 *
 * Supabase redirects here after an OAuth provider (e.g. Google) succeeds.
 * We exchange the auth code for a session, then upsert the user into MongoDB
 * (always the USER role) and set the httpOnly JWT cookie before redirecting
 * back to the app.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") || "/account";

    if (!isSupabaseEnabled()) {
      return redirectWith(
        request,
        "/login",
        "Supabase auth is not configured"
      );
    }

    if (!code) {
      return redirectWith(request, "/login", "Authentication failed");
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return redirectWith(request, "/login", "Authentication failed");
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return redirectWith(
        request,
        "/login",
        error?.message || "Authentication failed"
      );
    }

    const email = (data.user.email || "").toLowerCase();
    if (!email) {
      return redirectWith(request, "/login", "No email associated with account");
    }

    await dbConnect();

    const existing = await User.findOne({ email });
    let user;
    if (existing) {
      if (!existing.name && data.user.user_metadata?.name) {
        existing.name = String(data.user.user_metadata.name);
        await existing.save();
      }
      user = existing;
    } else {
      const metaName = String(
        data.user.user_metadata?.name || data.user.user_metadata?.full_name || ""
      );
      user = await User.create({
        name: metaName || email.split("@")[0] || "User",
        email,
        phone: "",
        passwordHash: await hashPassword(
          Math.random().toString(36).slice(2) + Date.now().toString(36)
        ),
        role: "USER", // never ADMIN
        isActive: true,
      });
    }

    if (!user.isActive) {
      return redirectWith(request, "/login", "Account has been disabled");
    }

    const token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.redirect(
      new URL(next, request.url).toString()
    );
    // Manually set the cookie on the redirect response.
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Error in GET /api/auth/supabase/callback:", error);
    return redirectWith(request, "/login", "Internal server error");
  }
}

function redirectWith(request: NextRequest, path: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("error", encodeURIComponent(message));
  return NextResponse.redirect(url.toString());
}
