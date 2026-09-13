import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { productFromRow } from "@/lib/supabase-shapes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID or slug is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    let product = null;
    let error = null;

    if (isUuid) {
      const res = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();
      product = res.data;
      error = res.error;
    }

    if (!product) {
      const res = await supabase
        .from("products")
        .select("*")
        .eq("slug", id.toLowerCase())
        .eq("is_active", true)
        .maybeSingle();
      if (res.data) {
        product = res.data;
        error = null;
      } else if (!error) {
        error = res.error;
      }
    }

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: productFromRow(product) });
  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}