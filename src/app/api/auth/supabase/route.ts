import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
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
 * Signs up / signs in with Supabase, then upserts the user into MongoDB
 * (always the USER role) and sets the existing httpOnly JWT cookie so the
 * rest of the app (cart, orders, admin checks) works as before.
 *
 * Admin users are never created through this endpoint — admins are provisioned
 * only via `npm run create-admin` or the admin login flow.
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

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 400 }
      );
    }

    let result: SupabaseAuthResult;
    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
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
      const { data, error } = await supabase.auth.signInWithPassword({
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

    await dbConnect();

    // Upsert the user into MongoDB, always with the USER role.
    const existing = await User.findOne({ email: result.email });
    let user;
    if (existing) {
      // A user signed in through Supabase — if they were created via the
      // normal register flow they already have a password hash. Only update
      // name if it's missing.
      if (!existing.name && typeof name === "string" && name) {
        existing.name = name.trim();
        await existing.save();
      }
      user = existing;
    } else {
      const firstName = typeof name === "string" ? name.trim() : "";
      const fallbackName = normalizedEmail.split("@")[0] || "User";
      const randomPhone = "";
      user = await User.create({
        name: firstName || fallbackName,
        email: normalizedEmail,
        phone: randomPhone,
        passwordHash: await hashPassword(pwd),
        role: "USER", // never ADMIN
        isActive: true,
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account has been disabled" },
        { status: 403 }
      );
    }

    const token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      message:
        action === "signup"
          ? "Account created successfully"
          : "Login successful",
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
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
