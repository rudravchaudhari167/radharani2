import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { productFromRow } from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    let query = supabase
      .from("products")
      .select("id, name, slug, description, price, old_price, category, subcategory, images, model_3d, sizes, colors, stock, sku, tags, featured, is_new_arrival, is_active, created_at, updated_at", { count: "exact" });
    if (category) {
      query = query.eq("category", category);
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq("is_active", isActive === "true");
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: rows, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const products = ((rows as Parameters<typeof productFromRow>[0][] | null) || []).map(productFromRow);

    const total = count ?? 0;

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      name, description, price, oldPrice, category, subcategory,
      images, model3D, sizes, colors, stock, sku, tags,
      featured, isNewArrival,
    } = body as Record<string, unknown>;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    if (!category || !["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"].includes(category as string)) {
      return NextResponse.json({ error: "Valid category is required" }, { status: 400 });
    }
    if (!sku || typeof sku !== "string") {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const skuUpper = (sku as string).toUpperCase().trim();

    const { data: existingSku } = await supabase
      .from("products")
      .select("id")
      .eq("sku", skuUpper)
      .maybeSingle();
    if (existingSku) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    }

    let slug = generateSlug(name as string);
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const { data: created, error: insertError } = await supabase
      .from("products")
      .insert({
        id: randomUUID(),
        name: (name as string).trim(),
        slug,
        description: description as string,
        price: Math.round(price as number),
        old_price: typeof oldPrice === "number" ? Math.round(oldPrice) : null,
        category: category as string,
        subcategory: typeof subcategory === "string" ? subcategory : "",
        images: (Array.isArray(images) ? images : []) as string[],
        model_3d: typeof model3D === "string" ? model3D : "",
        sizes: (Array.isArray(sizes) ? sizes : []) as string[],
        colors: (Array.isArray(colors) ? colors : []) as { name: string; hex: string }[],
        stock: typeof stock === "number" ? Math.max(0, Math.floor(stock)) : 0,
        sku: skuUpper,
        tags: (Array.isArray(tags) ? tags : []) as string[],
        featured: typeof featured === "boolean" ? featured : false,
        is_new_arrival: typeof isNewArrival === "boolean" ? isNewArrival : false,
        is_active: true,
      })
      .select("id, name, slug, description, price, old_price, category, subcategory, images, model_3d, sizes, colors, stock, sku, tags, featured, is_new_arrival, is_active, created_at, updated_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    await logAdminAction(
      supabase,
      { userId: session.userId, email: session.email },
      "PRODUCT_CREATED",
      `Product:${created.id}`,
      { name: created.name, slug: created.slug, sku: created.sku, price: created.price },
      getClientIp(request)
    );

    return NextResponse.json({ product: productFromRow(created as Parameters<typeof productFromRow>[0]) }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}