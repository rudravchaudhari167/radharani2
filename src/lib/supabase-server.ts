import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Returns true when the Supabase database is configured.
 */
export function isSupabaseDatabaseEnabled(): boolean {
  return Boolean(SUPABASE_URL && (SERVICE_ROLE_KEY || SUPABASE_ANON_KEY));
}

/**
 * Server-only Supabase client using the service role key. Bypasses Row Level
 * Security, so it is used for all server-side reads/writes (cart, orders,
 * admin CRUD). Never import from client components — it can leak keys.
 */
export function getSupabaseServer(): SupabaseClient {
  const key = SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error(
      "Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }
  return createClient(SUPABASE_URL, key);
}

/**
 * Public/anon Supabase client (respects RLS). Used from the server only for
 * unauthenticated storefront reads (products, coupons). Not for browsers.
 */
export function getSupabaseAnon(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables"
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Server-side Supabase client for authentication flows (OAuth, PKCE, exchangeCodeForSession).
 * Correctly reads and writes auth cookies (such as code verifiers) via Next.js `cookies()`.
 */
export async function createSupabaseAuthServerClient(pendingCookies?: PendingCookie[]) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              if (pendingCookies) {
                pendingCookies.push({ name, value, options });
              }
            });
          } catch {
            // Ignored if called in contexts where setting cookies is restricted
          }
        },
      },
    }
  );
}