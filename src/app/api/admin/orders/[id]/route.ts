import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  orderFromRow,
  orderItemFromRow,
  type OrderRow,
  type OrderItemRow,
} from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

const VALID_ORDER_STATUSES = [
  "ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
] as const;

const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
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

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_id, user_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [{ data: itemRows }, { data: user }] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, order_id, product_id, name, price, image, size, color, quantity")
        .eq("order_id", order.id),
      supabase
        .from("users")
        .select("id, name, email, phone")
        .eq("id", order.user_id)
        .maybeSingle(),
    ]);

    const items = ((itemRows as OrderItemRow[] | null) || []).map(orderItemFromRow);

    const populatedOrder = orderFromRow(
      order as OrderRow,
      items,
      user
        ? { _id: user.id, name: user.name || "", email: user.email || "", phone: user.phone || "" }
        : null
    );

    return NextResponse.json({ order: populatedOrder });
  } catch (error) {
    console.error("Error in GET /api/admin/orders/[id]:", error);
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

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_id, user_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { orderStatus, paymentStatus, paymentId } = body;

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (orderStatus !== undefined) {
      if (!(VALID_ORDER_STATUSES as readonly string[]).includes(orderStatus as string)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      if (order.order_status !== orderStatus) {
        changes.orderStatus = { from: order.order_status, to: orderStatus };
        updates.order_status = orderStatus;
      }
    }

    if (paymentStatus !== undefined) {
      if (!(VALID_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus as string)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }
      if (order.payment_status !== paymentStatus) {
        changes.paymentStatus = { from: order.payment_status, to: paymentStatus };
        updates.payment_status = paymentStatus;
      }
    }

    if (paymentId !== undefined && typeof paymentId === "string") {
      if (order.payment_id !== paymentId) {
        changes.paymentId = { from: order.payment_id, to: paymentId };
        updates.payment_id = paymentId;
      }
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({
        message: "No changes to update",
        order: orderFromRow(order as OrderRow, []),
      });
    }

    await supabase.from("orders").update(updates).eq("id", id);

    await supabase.from("audit_logs").insert({
      admin_id: session.userId,
      admin_email: session.email,
      action: "ORDER_UPDATED",
      target: `Order:${id}`,
      details: { orderId: order.order_id, changes },
      ip_address: getClientIp(request),
    });

    const { data: updated } = await supabase
      .from("orders")
      .select("id, order_id, user_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    return NextResponse.json({
      order: updated
        ? orderFromRow(updated as OrderRow, [])
        : orderFromRow(order as OrderRow, []),
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/orders/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}