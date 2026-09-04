import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Coupon from "@/models/Coupon";
import AuditLog from "@/models/AuditLog";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
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

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const allowedFields = [
      "code", "description", "discountType", "discountValue",
      "minimumOrder", "maximumDiscount", "expiryDate", "usageLimit", "active",
    ] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        let newVal = body[field];
        if (field === "code" && typeof newVal === "string") {
          newVal = newVal.toUpperCase().trim();
        }
        if (field === "expiryDate" && typeof newVal === "string") {
          newVal = new Date(newVal);
          if (isNaN((newVal as Date).getTime())) {
            return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
          }
        }
        const oldVal = coupon.get(field);
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[field] = { from: oldVal, to: newVal };
          coupon.set(field, newVal);
        }
      }
    }

    if (body.discountType !== undefined || body.discountValue !== undefined) {
      const type = body.discountType as string || coupon.discountType;
      const val = typeof body.discountValue === "number" ? body.discountValue : coupon.discountValue;
      if (type === "PERCENTAGE" && val > 100) {
        return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
      }
    }

    if (body.code && typeof body.code === "string") {
      const duplicate = await Coupon.findOne({ code: (body.code as string).toUpperCase().trim(), _id: { $ne: id } }).lean();
      if (duplicate) {
        return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
      }
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ message: "No changes to update", coupon });
    }

    await coupon.save();

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "COUPON_UPDATED",
      target: `Coupon:${id}`,
      details: { code: coupon.code, changes },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error in PUT /api/admin/coupons/[id]:", error);
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

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await Coupon.findByIdAndDelete(id);

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "COUPON_DELETED",
      target: `Coupon:${id}`,
      details: { code: coupon.code, discountType: coupon.discountType },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/coupons/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
