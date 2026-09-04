import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Product from "@/models/Product";
import AuditLog from "@/models/AuditLog";

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

    await dbConnect();
    const { id } = await params;

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
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

    await dbConnect();
    const { id } = await params;

    const existing = await Product.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const allowedFields = [
      "name", "description", "price", "oldPrice", "category", "subcategory",
      "images", "model3D", "sizes", "colors", "stock", "sku", "tags",
      "featured", "isNewArrival", "isActive",
    ] as const;

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const oldVal = existing.get(field);
        const newVal = body[field];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[field] = { from: oldVal, to: newVal };
        }
      }
    }

    if (body.name && typeof body.name === "string" && body.name !== existing.name) {
      let slug = generateSlug(body.name);
      const existingSlug = await Product.findOne({ slug, _id: { $ne: id } }).lean();
      if (existingSlug) slug = `${slug}-${Date.now()}`;
      existing.slug = slug;
    }

    if (body.sku && typeof body.sku === "string") {
      const skuUpper = body.sku.toUpperCase().trim();
      const duplicateSku = await Product.findOne({ sku: skuUpper, _id: { $ne: id } }).lean();
      if (duplicateSku) {
        return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
      }
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        existing.set(field, body[field]);
      }
    }

    await existing.save();

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "PRODUCT_UPDATED",
      target: `Product:${id}`,
      details: { changes },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ product: existing });
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

    await dbConnect();
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    product.isActive = false;
    await product.save();

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "PRODUCT_SOFT_DELETED",
      target: `Product:${id}`,
      details: { name: product.name, slug: product.slug },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ message: "Product deactivated successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
