import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
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
  createdAt: Date;
  updatedAt: Date;
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

    const query =
      type === "email"
        ? { email: rawIdentifier.trim().toLowerCase() }
        : { phone: normalizePhone(rawIdentifier.trim()) ?? "__invalid__" };

    await dbConnect();

    const user = await User.findOne(query).lean();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated" },
        { status: 403 }
      );
    }

    const passwordMatches = await comparePassword(
      password as string,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      message: "Login successful",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Error in POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}