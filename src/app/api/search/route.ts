import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { buildTextSearch } from "@/lib/supabase-shapes";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchTerm = query.trim();

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, images, category, tags")
      .eq("is_active", true)
      .or(buildTextSearch(searchTerm, ["name", "description"]))
      .limit(10);

    if (error) {
      throw error;
    }

    const suggestions = (data || []).map((p) => ({
      _id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      images: p.images || [],
      category: p.category,
      tags: p.tags || [],
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}