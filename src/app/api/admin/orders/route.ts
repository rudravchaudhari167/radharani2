import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  orderFromRow,
  orderItemFromRow,
  type OrderRow,
  type OrderItemRow,
} from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

export const VALID_ORDER_STATUSES = [
  "ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
] as const;

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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (status && !(VALID_ORDER_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const { data: orderRows } = await supabase
      .from("orders")
      .select("id, order_id, user_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .order("created_at", { ascending: false });

    let rows = (orderRows || []) as OrderRow[];

    if (status) {
      rows = rows.filter((r) => r.order_status === status);
    }

    if (search) {
      const term = search.toLowerCase();
      rows = rows.filter((r) => {
        const addr = (r.address || {}) as Record<string, unknown>;
        return (
          r.order_id.toLowerCase().includes(term) ||
          String(addr.fullName || "").toLowerCase().includes(term) ||
          String(addr.email || "").toLowerCase().includes(term) ||
          String(addr.phone || "").toLowerCase().includes(term)
        );
      });
    }

    const total = rows.length;
    const pagedRows = rows.slice((page - 1) * limit, page * limit);

    if (pagedRows.length === 0) {
      return NextResponse.json({
        orders: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const orderIds = pagedRows.map((r) => r.id);
    const userIds = [...new Set(pagedRows.map((r) => r.user_id))];

    const [{ data: itemRows }, { data: userRows }] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, order_id, product_id, name, price, image, size, color, quantity")
        .in("order_id", orderIds),
      supabase
        .from("users")
        .select("id, name, email, phone")
        .in("id", userIds.length ? userIds : [""]),
    ]);

    const itemsByOrder = new Map<string, ReturnType<typeof orderItemFromRow>[]>();
    for (const item of (itemRows as OrderItemRow[] | null) || []) {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(orderItemFromRow(item));
      itemsByOrder.set(item.order_id, list);
    }

    const userMap = new Map(
      ((userRows as Array<{ id: string; name: string | null; email: string | null; phone: string | null }> | null) || []).map((u) => [
        u.id,
        { _id: u.id, name: u.name || "", email: u.email || "", phone: u.phone || "" },
      ])
    );

    const orders = pagedRows.map((row) =>
      orderFromRow(row, itemsByOrder.get(row.id) || [], userMap.get(row.user_id) || null)
    );

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}