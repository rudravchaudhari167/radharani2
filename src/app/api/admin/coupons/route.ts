import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Coupon, { type ICoupon } from "@/models/Coupon";
import AuditLog from "@/models/AuditLog";

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
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/coupons:", error);
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
      code, description, discountType, discountValue,
      minimumOrder, maximumDiscount, expiryDate, usageLimit,
    } = body as Record<string, unknown>;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }
    if (!discountType || !["PERCENTAGE", "FIXED"].includes(discountType as string)) {
      return NextResponse.json({ error: "Valid discount type is required (PERCENTAGE or FIXED)" }, { status: 400 });
    }
    if (typeof discountValue !== "number" || discountValue < 0) {
      return NextResponse.json({ error: "Valid discount value is required" }, { status: 400 });
    }
    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
    }
    if (!expiryDate || isNaN(new Date(expiryDate as string).getTime())) {
      return NextResponse.json({ error: "Valid expiry date is required" }, { status: 400 });
    }

    const existingCoupon = await Coupon.findOne({ code: (code as string).toUpperCase().trim() }).lean();
    if (existingCoupon) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }

    const coupon = await Coupon.create({
      code: (code as string).toUpperCase().trim(),
      description: typeof description === "string" ? description : "",
      discountType: discountType as ICoupon["discountType"],
      discountValue: discountValue as number,
      minimumOrder: typeof minimumOrder === "number" ? (minimumOrder as number) : 0,
      maximumDiscount: typeof maximumDiscount === "number" ? (maximumDiscount as number) : 0,
      expiryDate: new Date(expiryDate as string),
      usageLimit: typeof usageLimit === "number" ? (usageLimit as number) : 0,
      usedCount: 0,
      active: true,
    });

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "COUPON_CREATED",
      target: `Coupon:${coupon._id}`,
      details: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        expiryDate: coupon.expiryDate,
      },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/coupons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
