import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { couponFromRow, type CouponRow } from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

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

    const supabase = getSupabaseServer();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search");

    let query = supabase
      .from("coupons")
      .select("id, code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, usage_limit, used_count, active, created_at, updated_at", { count: "exact" });
    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: rows, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const coupons = ((rows as CouponRow[] | null) || []).map(couponFromRow);
    const total = count ?? 0;

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

    const supabase = getSupabaseServer();

    const codeUpper = (code as string).toUpperCase().trim();

    const { data: existing } = await supabase
      .from("coupons")
      .select("id")
      .eq("code", codeUpper)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }

    const { data: created, error: insertError } = await supabase
      .from("coupons")
      .insert({
        id: randomUUID(),
        code: codeUpper,
        description: typeof description === "string" ? description : "",
        discount_type: discountType as string,
        discount_value: Math.round((discountValue as number) * 100) / 100,
        minimum_order: MIN_NUM(typeof minimumOrder),
        maximum_discount: MIN_NUM(typeof maximumDiscount),
        expiry_date: new Date(expiryDate as string).toISOString(),
        usage_limit: typeof usageLimit === "number" ? Math.max(0, Math.floor(usageLimit)) : 0,
        used_count: 0,
        active: true,
      })
      .select("id, code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, usage_limit, used_count, active, created_at, updated_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    await supabase.from("audit_logs").insert({
      admin_id: session.userId,
      admin_email: session.email,
      action: "COUPON_CREATED",
      target: `Coupon:${created.id}`,
      details: {
        code: created.code,
        discountType: created.discount_type,
        discountValue: created.discount_value,
        expiryDate: created.expiry_date,
      },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ coupon: couponFromRow(created as CouponRow) }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/coupons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function MIN_NUM(v: unknown): number {
  return typeof v === "number" ? v : 0;
}