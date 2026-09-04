import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { type UserRow } from "@/lib/supabase-shapes";
import {
  generateToken,
  setAuthCookie,
  hashPassword,
} from "@/lib/auth";
import {
  getSupabaseAdmin,
  isSupabaseEnabled,
  type SupabaseAuthResult,
} from "@/lib/supabase";

/**
 * POST /api/auth/supabase
 * Body: { action: "signup" | "signin", email, password, name? }
 *
 * Signs up / signs in with Supabase, then upserts the user into the Supabase
 * Postgres `users` table (always the USER role) and sets the existing httpOnly
 * JWT cookie so the rest of the app (cart, orders, admin checks) works as
 * before.
 *
 * Admin users are never created through this endpoint — admins are provisioned
 * via the admin login flow against the `users` table.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { action, email, password, name } = body;
    if (action !== "signup" && action !== "signin") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email" },
        { status: 400 }
      );
    }

    const pwd = typeof password === "string" ? password : "";
    if (pwd.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabaseAuth = getSupabaseAdmin();
    if (!supabaseAuth) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 400 }
      );
    }

    let result: SupabaseAuthResult;
    if (action === "signup") {
      const { data, error } = await supabaseAuth.auth.signUp({
        email: normalizedEmail,
        password: pwd,
        options: {
          data: { name: typeof name === "string" ? name : "" },
        },
      });

      result = {
        success: !error,
        email: data.user?.email ?? normalizedEmail,
        phone: data.user?.phone ?? null,
        userMetadata: data.user?.user_metadata ?? null,
        error: error?.message,
        session: data.session
          ? {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at ?? 0,
            }
          : null,
      };
    } else {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: normalizedEmail,
        password: pwd,
      });

      result = {
        success: !error,
        email: data.user?.email ?? normalizedEmail,
        phone: data.user?.phone ?? null,
        userMetadata: data.user?.user_metadata ?? null,
        error: error?.message,
        session: data.session
          ? {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at ?? 0,
            }
          : null,
      };
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Supabase authentication failed" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", (result.email || "").toLowerCase())
      .maybeSingle();
    let userRow = existing as UserRow | null;

    if (userRow) {
      // A user signed in through Supabase — if they were created via the
      // normal register flow they already have a password hash. Only update
      // name if it's missing.
      if (!userRow.name && typeof name === "string" && name) {
        await supabase
          .from("users")
          .update({ name: name.trim() })
          .eq("id", userRow.id);
        userRow = { ...userRow, name: name.trim() };
      }
    } else {
      const firstName = typeof name === "string" ? name.trim() : "";
      const fallbackName = ((result.email || "") as string).split("@")[0] || "User";
      const insertUser = {
        id: randomUUID(),
        name: firstName || fallbackName,
        email: (result.email || "").toLowerCase(),
        phone: "",
        password_hash: await hashPassword(pwd),
        role: "USER", // never ADMIN
        is_active: true,
      };
      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert(insertUser)
        .select("*")
        .single();
      if (insertError) {
        const duplicateEmail = insertError.code === "23505";
        if (!duplicateEmail) {
          throw insertError;
        }
        const { data: again } = await supabase
          .from("users")
          .select("*")
          .eq("email", (result.email || "").toLowerCase())
          .maybeSingle();
        userRow = (again as UserRow | null) ?? null;
        if (!userRow) {
          throw insertError;
        }
      } else {
        userRow = created as UserRow;
      }
    }

    if (!userRow) {
      throw new Error("User could not be provisioned");
    }

    if (!userRow.is_active) {
      return NextResponse.json(
        { error: "Account has been disabled" },
        { status: 403 }
      );
    }

    const token = generateToken({
      _id: userRow.id,
      email: userRow.email,
      role: userRow.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      message:
        action === "signup"
          ? "Account created successfully"
          : "Login successful",
      user: {
        _id: String(userRow.id),
        name: userRow.name,
        email: userRow.email,
        phone: userRow.phone ?? "",
        role: userRow.role,
        isActive: userRow.is_active,
      },
      supabaseSession: result.session,
    });
  } catch (error) {
    console.error("Error in POST /api/auth/supabase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
