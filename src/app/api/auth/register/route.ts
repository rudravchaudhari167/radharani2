import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { userFromRow, type UserRow } from "@/lib/supabase-shapes";
import {
  hashPassword,
  generateToken,
  setAuthCookie,
} from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PublicUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

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
}): PublicUser {
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

    const { name, email, phone, password, confirmPassword } = body;
    const errors: Record<string, string> = {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      errors.name = "Name is required";
    } else if (trimmedName.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (trimmedName.length > 100) {
      errors.name = "Name cannot exceed 100 characters";
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      errors.email = "Please provide a valid email";
    }

    if (typeof phone !== "string" || !phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (typeof password !== "string" || !password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (password.length > 72) {
      errors.password = "Password cannot exceed 72 characters";
    }

    if (typeof confirmPassword !== "string" || !confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (
      typeof password === "string" &&
      confirmPassword !== password
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: errors },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone as string);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error: "Please provide a valid 10-digit Indian phone number",
          fields: { phone: "Please provide a valid 10-digit Indian phone number" },
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const { data: existingPhone } = await supabase
      .from("users")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password as string);
    const id = randomUUID();

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id,
        name: trimmedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password_hash: passwordHash,
        role: "USER",
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    const mapped = userFromRow(user as UserRow);

    const token = generateToken({
      _id: mapped._id,
      email: mapped.email,
      role: mapped.role,
    });
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: serializeUser(mapped),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth/register:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}