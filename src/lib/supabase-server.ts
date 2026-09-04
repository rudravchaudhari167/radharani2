import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
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