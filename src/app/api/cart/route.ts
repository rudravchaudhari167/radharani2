import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { cartItemFromRow, type ProductRow } from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

async function getOrCreateCart(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    return existing.id;
  }
  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .maybeSingle();
  if (error && error.code !== "23505") {
    throw error;
  }
  if (created) {
    return created.id;
  }
  const { data: again } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!again) {
    throw new Error("Could not create cart");
  }
  return again.id;
}

/** Fetch cart items joined with their product rows for the given cart. */
async function fetchCartData(
  supabase: ReturnType<typeof getSupabaseServer>,
  cartId: string
) {
  const { data: items, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, name, price, image, size, color, quantity")
    .eq("cart_id", cartId);

  if (error) {
    throw error;
  }

  const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, images, stock, is_active, slug")
    .in("id", productIds.length ? productIds : [""]);

  const map = new Map<string, ProductRow & { _id: string }>(
    ((products as ProductRow[]) || []).map((p) => [p.id, p] as unknown as [string, ProductRow & { _id: string }])
  );

  const rawItems = (items || []).map((i) => ({
    ...i,
    product: map.get(i.product_id) || null,
  }));

  const validItems = rawItems.filter(
    (item) => item.product && item.product.is_active !== false
  );

  if (validItems.length !== rawItems.length) {
    const validIds = new Set(validItems.map((i) => i.id));
    await supabase.from("cart_items").delete().in("id", [...rawItems.map((i) => i.id)].filter((id) => !validIds.has(id)));
  }

  return validItems.map((item) => {
    const base = cartItemFromRow(item);
    return {
      ...base,
      productId: item.product_id ?? "",
      name: item.product?.name ?? base.name,
      price: Number(item.product?.price) || base.price,
      image: item.product?.images?.[0] || base.image,
      stock: item.product?.stock,
      slug: item.product?.slug,
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

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!cart) {
      return NextResponse.json({ cart: { items: [] } });
    }

    const items = await fetchCartData(supabase, cart.id);

    return NextResponse.json({ cart: { items } });
  } catch (error) {
    console.error("Error in GET /api/cart:", error);
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

    const { productId, size, color, quantity } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const qty = typeof quantity === "number" ? quantity : 1;
    if (qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select("id, name, price, images, stock, is_active")
      .eq("id", productId.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.stock < qty) {
      return NextResponse.json(
        { error: "Insufficient stock available" },
        { status: 400 }
      );
    }

    const sizeStr = typeof size === "string" ? size : "";
    const colorStr = typeof color === "string" ? color : "";

    const cartId = await getOrCreateCart(supabase, session.userId);

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", product.id)
      .eq("size", sizeStr)
      .eq("color", colorStr)
      .maybeSingle();

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (product.stock < newQty) {
        return NextResponse.json(
          { error: "Insufficient stock available" },
          { status: 400 }
        );
      }
      await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existingItem.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cartId,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "",
        size: sizeStr,
        color: colorStr,
        quantity: qty,
      });
    }

    const items = await fetchCartData(supabase, cartId);

    return NextResponse.json(
      { message: "Item added to cart", cart: { items } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { productId, size, color, quantity } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const qty = typeof quantity === "number" ? quantity : 1;
    if (qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select("id, stock, is_active")
      .eq("id", productId.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.stock < qty) {
      return NextResponse.json(
        { error: "Insufficient stock available" },
        { status: 400 }
      );
    }

    const sizeStr = typeof size === "string" ? size : "";
    const colorStr = typeof color === "string" ? color : "";

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!cart) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 404 });
    }

    const { data: item } = await supabase
      .from("cart_items")
      .select("id")
      .eq("cart_id", cart.id)
      .eq("product_id", product.id)
      .eq("size", sizeStr)
      .eq("color", colorStr)
      .maybeSingle();

    if (!item) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    await supabase
      .from("cart_items")
      .update({ quantity: qty })
      .eq("id", item.id);

    const items = await fetchCartData(supabase, cart.id);

    return NextResponse.json({ message: "Cart updated", cart: { items } });
  } catch (error) {
    console.error("Error in PUT /api/cart:", error);
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

    const { productId, size, color } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const sizeStr = typeof size === "string" ? size : "";
    const colorStr = typeof color === "string" ? color : "";

    const supabase = getSupabaseServer();

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!cart) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 404 });
    }

    const { data: item, error } = await supabase
      .from("cart_items")
      .select("id")
      .eq("cart_id", cart.id)
      .eq("product_id", productId.trim())
      .eq("size", sizeStr)
      .eq("color", colorStr)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    await supabase.from("cart_items").delete().eq("id", item.id);

    const items = await fetchCartData(supabase, cart.id);

    return NextResponse.json({ message: "Item removed from cart", cart: { items } });
  } catch (error) {
    console.error("Error in DELETE /api/cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}