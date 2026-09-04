import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Returns true when Supabase auth is configured and avilable.
 */
export function isSupabaseEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Server-side Supabase client (service role not required for email/password
 * sign-up/sign-in via the anon key).
 */
export function getSupabaseAdmin() {
  if (!isSupabaseEnabled()) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Results of a Supabase auth action, normalised to a stable shape.
 */
export interface SupabaseAuthResult {
  success: boolean;
  email: string | null;
  phone: string | null;
  userMetadata: Record<string, unknown> | null;
  error?: string;
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null;
}
