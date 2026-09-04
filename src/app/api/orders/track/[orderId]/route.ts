import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

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
    await dbConnect();

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ orderId })
      .select("orderId orderStatus paymentStatus shippingMethod estimatedDelivery createdAt")
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const currentStatusIndex = ORDER_STATUSES.indexOf(
      order.orderStatus as (typeof ORDER_STATUSES)[number]
    );

    const timeline = ORDER_STATUSES.map((status, index) => ({
      status,
      label: STATUS_LABELS[status],
      completed: index <= currentStatusIndex,
      isCurrent: index === currentStatusIndex,
    }));

    return NextResponse.json({
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shippingMethod: order.shippingMethod,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
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
