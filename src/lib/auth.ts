import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export const TOKEN_COOKIE = "auth_token";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  phone: string;
  role: "USER" | "ADMIN";
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "";
const TOKEN_EXPIRY = "7d";

if (!JWT_SECRET) {
  throw new Error(
    "Please define the NEXTAUTH_SECRET environment variable inside .env.local"
  );
}

/**
 * Hashes a plain-text password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain-text password with a stored bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generates a signed JWT for the given user.
 */
export function generateToken(
  user: { _id: unknown; email: string; role: "USER" | "ADMIN" }
): string {
  const payload: JwtPayload = {
    userId: String(user._id),
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verifies a JWT and returns its decoded payload. Returns null if invalid/expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Reads the auth token from cookies, verifies it, loads the user, and returns
 * the session user (or null if not authenticated or user is inactive/missing).
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(TOKEN_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).lean();

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  } catch {
    return null;
  }
}

/**
 * Middleware helper that requires an authenticated user. Returns the session
 * user, otherwise throws a 401. Intended for use inside Server Components /
 * Actions where manual error handling is preferred.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) {
    const error: Error & { status?: number } = new Error(
      "Authentication required"
    );
    error.status = 401;
    throw error;
  }
  return session;
}

/**
 * Middleware helper that requires an admin user. Redirects non-admin and
 * unauthenticated users to the login page.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getServerSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return session;
}

/**
 * Sets the auth token as an httpOnly cookie on the response.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

/**
 * Clears the auth token cookie.
 */
export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}
