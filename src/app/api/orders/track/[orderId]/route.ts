import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

const ORDER_STATUSES = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: order, error } = await supabase
      .from("orders")
      .select("order_id, order_status, payment_status, shipping_method, estimated_delivery, created_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const currentStatusIndex = ORDER_STATUSES.indexOf(
      order.order_status as (typeof ORDER_STATUSES)[number]
    );

    const timeline = ORDER_STATUSES.map((status, index) => ({
      status,
      label: STATUS_LABELS[status],
      completed: index <= currentStatusIndex,
      isCurrent: index === currentStatusIndex,
    }));

    return NextResponse.json({
      orderId: order.order_id,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      shippingMethod: order.shipping_method,
      estimatedDelivery: order.estimated_delivery,
      createdAt: order.created_at,
      timeline,
    });
  } catch (error) {
    console.error("Error in GET /api/orders/track/[orderId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}