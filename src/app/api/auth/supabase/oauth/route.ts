import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  isSupabaseEnabled,
} from "@/lib/supabase";

/**
 * POST /api/auth/supabase/oauth
 * Body: { provider: "google" | "github" | "apple" } (defaults to "google")
 *
 * Returns the Supabase OAuth redirect URL. The frontend redirects the user
 * there, and on return the `/api/auth/supabase/callback` route completes the
 * synchronous sign-in with Supabase and creates the MongoDB user.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 400 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      /* use default */
    }

    const provider = String(body.provider || "google");
    const redirectTo = String(
      body.redirectTo || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/supabase/callback`
    );

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Error in POST /api/auth/supabase/oauth:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
