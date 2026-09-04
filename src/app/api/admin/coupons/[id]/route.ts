import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { couponFromRow, type CouponRow } from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

const COUPON_SELECT = "id, code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, usage_limit, used_count, active, created_at, updated_at";

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

    const { id } = await params;

    const supabase = getSupabaseServer();

    const { data: coupon } = await supabase
      .from("coupons")
      .select(COUPON_SELECT)
      .eq("id", id)
      .maybeSingle();

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
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields: Record<string, keyof typeof updates> = {
      code: "code",
      description: "description",
      discountType: "discount_type",
      discountValue: "discount_value",
      minimumOrder: "minimum_order",
      maximumDiscount: "maximum_discount",
      expiryDate: "expiry_date",
      usageLimit: "usage_limit",
      active: "active",
    };

    for (const [field, column] of Object.entries(allowedFields)) {
      if (body[field] !== undefined) {
        let newVal = body[field];
        if (field === "code" && typeof newVal === "string") {
          newVal = newVal.toUpperCase().trim();
        }
        if (field === "expiryDate" && typeof newVal === "string") {
          const parsed = new Date(newVal);
          if (isNaN(parsed.getTime())) {
            return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
          }
          newVal = parsed.toISOString();
        }
        if (
          field === "discountValue" || field === "minimumOrder" || field === "maximumDiscount"
        ) {
          if (typeof newVal === "number") {
            newVal = Math.round(newVal * 100) / 100;
          } else {
            newVal = 0;
          }
        }
        if (field === "usageLimit" && typeof newVal === "number") {
          newVal = Math.max(0, Math.floor(newVal));
        }
        const oldVal = (coupon as unknown as Record<string, unknown>)[column];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[field] = { from: oldVal, to: newVal };
          updates[column] = newVal;
        }
      }
    }

    const finalType =
      updates.discount_type !== undefined ? String(updates.discount_type) : coupon.discount_type;
    const finalValue =
      updates.discount_value !== undefined ? Number(updates.discount_value) : Number(coupon.discount_value);
    if (finalType === "PERCENTAGE" && finalValue > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
    }

    if (updates.code !== undefined && typeof updates.code === "string") {
      const { data: duplicate } = await supabase
        .from("coupons")
        .select("id")
        .eq("code", updates.code)
        .neq("id", id)
        .maybeSingle();
      if (duplicate) {
        return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
      }
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({
        message: "No changes to update",
        coupon: couponFromRow(coupon as CouponRow),
      });
    }

    await supabase.from("coupons").update(updates).eq("id", id);

    await supabase.from("audit_logs").insert({
      admin_id: session.userId,
      admin_email: session.email,
      action: "COUPON_UPDATED",
      target: `Coupon:${id}`,
      details: {
        code: updates.code ?? coupon.code,
        changes,
      },
      ip_address: getClientIp(request),
    });

    const { data: updated } = await supabase
      .from("coupons")
      .select(COUPON_SELECT)
      .eq("id", id)
      .maybeSingle();

    return NextResponse.json({
      coupon: updated ? couponFromRow(updated as CouponRow) : couponFromRow(coupon as CouponRow),
    });
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

    const { id } = await params;

    const supabase = getSupabaseServer();

    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, code, discount_type")
      .eq("id", id)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await supabase.from("coupons").delete().eq("id", id);

    await supabase.from("audit_logs").insert({
      admin_id: session.userId,
      admin_email: session.email,
      action: "COUPON_DELETED",
      target: `Coupon:${id}`,
      details: { code: coupon.code, discountType: coupon.discount_type },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/coupons/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}