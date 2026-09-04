import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getServerSession } from "@/lib/auth";

async function fetchWishlistData(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string
) {
  const { data: items } = await supabase
    .from("wishlist_items")
    .select("id, product_id, name, price, image, added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (!items) {
    return [];
  }

  const productIds: string[] = items
    .map((i) => i.product_id)
    .filter((id): id is string => Boolean(id));

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, images, stock, is_active, slug")
    .in("id", productIds.length ? productIds : [""]);

  const productMap = new Map((products || []).map((p) => [p.id, p]));

  const validItems = items.filter(
    (item) => productMap.get(item.product_id || "")?.is_active !== false
  );

  if (validItems.length !== items.length) {
    const validIds = new Set(validItems.map((i) => i.id));
    const staleIds = items
      .map((i) => i.id)
      .filter((id) => !validIds.has(id));
    if (staleIds.length > 0) {
      await supabase.from("wishlist_items").delete().in("id", staleIds);
    }
  }

  return validItems.map((item) => {
    const product = productMap.get(item.product_id || "");
    return {
      id: item.id,
      productId: product
        ? { _id: product.id, name: product.name, price: Number(product.price), images: product.images, stock: product.stock, isActive: product.is_active, slug: product.slug }
        : item.product_id,
      name: product?.name ?? item.name,
      price: product ? Number(product.price) : Number(item.price) || 0,
      image: product?.images?.[0] ?? item.image,
      addedAt: item.added_at,
    };
  });
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();

    const products = await fetchWishlistData(supabase, session.userId);

    return NextResponse.json({ wishlist: { products } });
  } catch (error) {
    console.error("Error in GET /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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

    const { productId } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select("id, name, price, images, is_active")
      .eq("id", productId.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", session.userId)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Product is already in your wishlist" },
        { status: 409 }
      );
    }

    await supabase.from("wishlist_items").insert({
      user_id: session.userId,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
    });

    const products = await fetchWishlistData(supabase, session.userId);

    return NextResponse.json(
      { message: "Product added to wishlist", wishlist: { products } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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

    const { productId } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: existing, error } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", session.userId)
      .eq("product_id", productId.trim())
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found in wishlist" },
        { status: 404 }
      );
    }

    await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", existing.id);

    const products = await fetchWishlistData(supabase, session.userId);

    return NextResponse.json({
      message: "Product removed from wishlist",
      wishlist: { products },
    });
  } catch (error) {
    console.error("Error in DELETE /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}