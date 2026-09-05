import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getSupabaseServer,
  createSupabaseAuthServerClient,
  type PendingCookie,
} from "@/lib/supabase-server";
import { type UserRow } from "@/lib/supabase-shapes";
import { generateToken, hashPassword } from "@/lib/auth";
import { isSupabaseEnabled } from "@/lib/supabase";

/**
 * GET /api/auth/supabase/callback?code=...&next=/...
 *
 * Supabase redirects here after an OAuth provider (e.g. Google) succeeds.
 * We exchange the auth code for a session, then upsert the user into the
 * Supabase Postgres `users` table (always the USER role) and set the httpOnly
 * JWT cookie before redirecting back to the app.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") || "/account";

    // Handle any OAuth provider errors directly
    const errorParam = url.searchParams.get("error");
    const errorDesc = url.searchParams.get("error_description");
    if (errorParam || errorDesc) {
      return redirectWith(
        request,
        "/login",
        errorDesc || errorParam || "Authentication failed"
      );
    }

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

    const pendingCookies: PendingCookie[] = [];
    const supabaseAuth = await createSupabaseAuthServerClient(pendingCookies);

    const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
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

    const supabase = getSupabaseServer();

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    let userRow = existing as UserRow | null;

    if (userRow) {
      const updates: Record<string, unknown> = {};
      if (!userRow.name && data.user.user_metadata?.name) {
        updates.name = String(data.user.user_metadata.name);
      }
      if (!("auth_user_id" in userRow) || !(userRow as unknown as { auth_user_id?: string }).auth_user_id) {
        updates.auth_user_id = data.user.id;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("users").update(updates).eq("id", userRow.id);
        userRow = { ...userRow, ...updates };
      }
    } else {
      const metaName = String(
        data.user.user_metadata?.name || data.user.user_metadata?.full_name || ""
      );
      const insertUser = {
        id: randomUUID(),
        auth_user_id: data.user.id,
        name: metaName || email.split("@")[0] || "User",
        email,
        phone: "",
        password_hash: await hashPassword(
          Math.random().toString(36).slice(2) + Date.now().toString(36)
        ),
        role: "USER", // never ADMIN
        is_active: true,
      };
      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert(insertUser)
        .select("*")
        .single();
      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }
      userRow = (created as UserRow | null) ?? userRow;
      if (!userRow) {
        throw new Error("User could not be provisioned");
      }
    }

    if (!userRow.is_active) {
      return redirectWith(request, "/login", "Account has been disabled");
    }

    const token = generateToken({
      _id: userRow.id,
      email: userRow.email,
      role: userRow.role,
    });

    const response = NextResponse.redirect(
      new URL(next, request.url).toString()
    );
    // Attach any auth cookies set by Supabase
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    // Manually set the auth_token cookie on the redirect response.
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
  url.searchParams.set("error", message);
  return NextResponse.redirect(url.toString());
}
