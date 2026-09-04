import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  productFromRow,
  buildTextSearch,
  type ProductRow,
} from "@/lib/supabase-shapes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const size = searchParams.get("size") || "";
    const color = searchParams.get("color") || "";
    const sort = searchParams.get("sort") || "popular";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10))
    );
    const featured = searchParams.get("featured");
    const isNewArrival = searchParams.get("isNewArrival");

    const supabase = getSupabaseServer();

    let q = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    if (search) {
      q = q.or(buildTextSearch(search, ["name", "description", "tags::text"]));
    }

    if (category) {
      const validCategories = ["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"];
      if (validCategories.includes(category.toUpperCase())) {
        q = q.eq("category", category.toUpperCase());
      }
    }

    if (minPrice) {
      q = q.gte("price", Math.max(0, parseFloat(minPrice)));
    }

    if (maxPrice) {
      q = q.lte("price", Math.max(0, parseFloat(maxPrice)));
    }

    if (size) {
      q = q.contains("sizes", [size.toUpperCase()]);
    }

    if (color) {
      q = q.contains("colors", [{ name: color }]);
    }

    if (featured === "true") {
      q = q.eq("featured", true);
    }

    if (isNewArrival === "true") {
      q = q.eq("is_new_arrival", true);
    }

    switch (sort) {
      case "popular":
        q = q
          .order("review_count", { ascending: false })
          .order("rating", { ascending: false });
        break;
      case "price-asc":
        q = q.order("price", { ascending: true });
        break;
      case "price-desc":
        q = q.order("price", { ascending: false });
        break;
      case "rating":
        q = q.order("rating", { ascending: false });
        break;
      default:
        q = q.order("created_at", { ascending: false });
    }

    const { data, error, count } = await q.range(
      (page - 1) * limit,
      page * limit - 1
    );

    if (error) {
      throw error;
    }

    const products = ((data as ProductRow[]) || []).map(productFromRow);
    const total = count ?? 0;

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}