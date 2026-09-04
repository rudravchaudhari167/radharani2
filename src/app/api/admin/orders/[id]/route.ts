import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Order from "@/models/Order";
import AuditLog from "@/models/AuditLog";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

const VALID_ORDER_STATUSES = [
  "ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
] as const;

const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

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

    const order = await Order.findById(id)
      .populate("userId", "name email phone")
      .lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
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

    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id);
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

    if (orderStatus !== undefined) {
      if (!(VALID_ORDER_STATUSES as readonly string[]).includes(orderStatus as string)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      if (order.orderStatus !== orderStatus) {
        changes.orderStatus = { from: order.orderStatus, to: orderStatus };
        order.orderStatus = orderStatus as typeof order.orderStatus;
      }
    }

    if (paymentStatus !== undefined) {
      if (!(VALID_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus as string)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }
      if (order.paymentStatus !== paymentStatus) {
        changes.paymentStatus = { from: order.paymentStatus, to: paymentStatus };
        order.paymentStatus = paymentStatus as typeof order.paymentStatus;
      }
    }

    if (paymentId !== undefined && typeof paymentId === "string") {
      if (order.paymentId !== paymentId) {
        changes.paymentId = { from: order.paymentId, to: paymentId };
        order.paymentId = paymentId;
      }
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ message: "No changes to update", order });
    }

    await order.save();

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "ORDER_UPDATED",
      target: `Order:${id}`,
      details: { orderId: order.orderId, changes },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error in PUT /api/admin/orders/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
