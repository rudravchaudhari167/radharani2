import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  comparePassword,
  generateToken,
  setAuthCookie,
} from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

const failedAttempts = new Map<string, AttemptRecord>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

function pruneExpiredAttempts(now: number): void {
  if (failedAttempts.size < 1000) {
    return;
  }
  for (const [key, record] of failedAttempts.entries()) {
    if (
      record.lockedUntil !== null &&
      record.lockedUntil <= now
    ) {
      failedAttempts.delete(key);
    }
  }
}

function serializeAdmin(user: {
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
  const ip = getClientIp(request);

  try {
    const now = Date.now();
    pruneExpiredAttempts(now);

    const record = failedAttempts.get(ip);
    if (record?.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        }
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

    const { email, password } = body;

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !normalizedEmail ||
      !EMAIL_REGEX.test(normalizedEmail) ||
      typeof password !== "string" ||
      !password
    ) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail }).lean();

    const isValid =
      !!user &&
      user.role === "ADMIN" &&
      user.isActive &&
      (await comparePassword(password, user.passwordHash));

    if (!isValid) {
      const current = failedAttempts.get(ip);
      const count = (current?.count ?? 0) + 1;
      failedAttempts.set(ip, {
        count,
        lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null,
      });
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    failedAttempts.delete(ip);

    const token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      message: "Login successful",
      admin: serializeAdmin(user),
    });
  } catch (error) {
    console.error("Error in POST /api/admin/auth/login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}