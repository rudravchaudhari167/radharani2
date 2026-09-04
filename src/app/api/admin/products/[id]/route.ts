import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { productFromRow } from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

const PRODUCT_SELECT = "id, name, slug, description, price, old_price, category, subcategory, images, model_3d, sizes, colors, stock, sku, tags, featured, is_new_arrival, is_active, created_at, updated_at";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function logAdminAction(
  supabase: ReturnType<typeof getSupabaseServer>,
  session: { userId: string; email: string },
  action: string,
  target: string,
  details: Record<string, unknown>,
  ip: string
) {
  await supabase.from("audit_logs").insert({
    admin_id: session.userId,
    admin_email: session.email,
    action,
    target,
    details,
    ip_address: ip,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const supabase = getSupabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: productFromRow(product as Parameters<typeof productFromRow>[0]) });
  } catch (error) {
    console.error("Error in GET /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const supabase = getSupabaseServer();

    const { data: existing } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    /* Note: `existing.name` below is the camelCase-mapped field from
       productFromRow values stored via the mapped object — we fall back to
       raw values passed in body when undefined. */
    const current = productFromRow(existing as Parameters<typeof productFromRow>[0]);

    const changes: Record<string, { from: unknown; to: unknown }> = {};

    const fieldMap: Record<string, keyof typeof updates> = {
      name: "name",
      description: "description",
      price: "price",
      oldPrice: "old_price",
      category: "category",
      subcategory: "subcategory",
      images: "images",
      model3D: "model_3d",
      sizes: "sizes",
      colors: "colors",
      stock: "stock",
      sku: "sku",
      tags: "tags",
      featured: "featured",
      isNewArrival: "is_new_arrival",
      isActive: "is_active",
    };

    for (const [field, column] of Object.entries(fieldMap)) {
      if (body[field] !== undefined) {
        const newVal = body[field];
        const oldVal = (existing as unknown as Record<string, unknown>)[column];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[field] = { from: oldVal, to: newVal };
        }
        let storedVal = newVal;
        if (column === "price" || column === "old_price") {
          if (typeof storedVal === "number") storedVal = Math.round(storedVal);
          else storedVal = null;
        }
        if (column === "stock" && typeof storedVal === "number") {
          storedVal = Math.max(0, Math.floor(storedVal));
        }
        if (column === "sku" && typeof storedVal === "string") {
          storedVal = storedVal.toUpperCase().trim();
        }
        updates[column] = storedVal;
      }
    }

    if (body.name && typeof body.name === "string" && body.name !== current.name) {
      let slug = generateSlug(body.name);
      const { data: slugDup } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle();
      if (slugDup) slug = `${slug}-${Date.now()}`;
      updates.slug = slug;
    }

    if (updates.sku !== undefined && typeof updates.sku === "string") {
      const { data: skuDup } = await supabase
        .from("products")
        .select("id")
        .eq("sku", updates.sku)
        .neq("id", id)
        .maybeSingle();
      if (skuDup) {
        return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
      }
    }

    await supabase.from("products").update(updates).eq("id", id);

    const { data: updated } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .maybeSingle();

    await logAdminAction(
      supabase,
      { userId: session.userId, email: session.email },
      "PRODUCT_UPDATED",
      `Product:${id}`,
      { changes },
      getClientIp(request)
    );

    return NextResponse.json({ product: updated ? productFromRow(updated as Parameters<typeof productFromRow>[0]) : current });
  } catch (error) {
    console.error("Error in PUT /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const supabase = getSupabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select("id, name, slug")
      .eq("id", id)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await supabase
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    await logAdminAction(
      supabase,
      { userId: session.userId, email: session.email },
      "PRODUCT_SOFT_DELETED",
      `Product:${id}`,
      { name: product.name, slug: product.slug },
      getClientIp(request)
    );

    return NextResponse.json({ message: "Product deactivated successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}