import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Product, { type IColor, type IProduct } from "@/models/Product";
import AuditLog from "@/models/AuditLog";

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

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

    await dbConnect();

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

    let slug = generateSlug(name as string);
    const existingSlug = await Product.findOne({ slug }).lean();
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const existingSku = await Product.findOne({ sku: (sku as string).toUpperCase() }).lean();
    if (existingSku) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    }

    const product = await Product.create({
      name: (name as string).trim(),
      slug,
      description: description as string,
      price: price as number,
      oldPrice: typeof oldPrice === "number" ? (oldPrice as number) : undefined,
      category: category as IProduct["category"],
      subcategory: typeof subcategory === "string" ? subcategory : "",
      images: (Array.isArray(images) ? images : []) as string[],
      model3D: typeof model3D === "string" ? model3D : "",
      sizes: (Array.isArray(sizes) ? sizes : []) as string[],
      colors: (Array.isArray(colors) ? colors : []) as IColor[],
      stock: typeof stock === "number" ? (stock as number) : 0,
      sku: (sku as string).toUpperCase().trim(),
      tags: (Array.isArray(tags) ? tags : []) as string[],
      featured: typeof featured === "boolean" ? featured : false,
      isNewArrival: typeof isNewArrival === "boolean" ? isNewArrival : false,
      isActive: true,
    });

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "PRODUCT_CREATED",
      target: `Product:${product._id}`,
      details: { name: product.name, slug: product.slug, sku: product.sku, price: product.price },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
