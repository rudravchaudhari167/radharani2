import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { type UserRow } from "@/lib/supabase-shapes";
import {
  comparePassword,
  generateToken,
  setAuthCookie,
} from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  let normalized: string;
  if (digits.length === 10) {
    normalized = "+91" + digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    normalized = "+" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    normalized = "+91" + digits.slice(1);
  } else if (digits.length === 13 && digits.startsWith("91")) {
    normalized = "+" + digits;
  } else {
    return null;
  }

  const local = normalized.slice(3);
  if (!/^[6-9]\d{9}$/.test(local)) {
    return null;
  }

  return normalized;
}

function serializeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, phone, identifier, password, loginType } = body;

    if (loginType !== "email" && loginType !== "phone") {
      return NextResponse.json(
        { error: "loginType must be either 'email' or 'phone'" },
        { status: 400 }
      );
    }
    const type = loginType;

    const rawIdentifier =
      typeof identifier === "string"
        ? identifier
        : type === "phone"
          ? typeof phone === "string"
            ? phone
            : ""
          : typeof email === "string"
            ? email
            : "";

    const errors: Record<string, string> = {};

    if (!rawIdentifier.trim()) {
      errors[type] = type === "email" ? "Email is required" : "Phone number is required";
    }

    if (type === "email" && rawIdentifier.trim() && !EMAIL_REGEX.test(rawIdentifier.trim())) {
      errors.email = "Please provide a valid email";
    }

    if (typeof password !== "string" || !password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: errors },
        { status: 400 }
      );
    }

    const normalized =
      type === "email"
        ? rawIdentifier.trim().toLowerCase()
        : normalizePhone(rawIdentifier.trim()) ?? "__invalid__";

    const supabase = getSupabaseServer();

    let userQuery = supabase.from("users").select("*");
    if (type === "email") {
      userQuery = userQuery.eq("email", normalized);
    } else {
      userQuery = userQuery.eq("phone", normalized);
    }

    const { data: userRow } = await userQuery.maybeSingle();
    const user = userRow as UserRow | null;

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account has been deactivated" },
        { status: 403 }
      );
    }

    const passwordMatches = await comparePassword(
      password as string,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = generateToken({
      _id: user.id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      message: "Login successful",
      user: serializeUser({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }),
    });
  } catch (error) {
    console.error("Error in POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}