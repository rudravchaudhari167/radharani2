import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  orderFromRow,
  orderItemFromRow,
  type OrderRow,
  type OrderItemRow,
} from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_id, user_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .eq("user_id", session.userId)
      .or(`order_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const { data: itemRows } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, name, price, image, size, color, quantity")
      .eq("order_id", order.id);

    const items = ((itemRows as OrderItemRow[] | null) || []).map(orderItemFromRow);

    return NextResponse.json({ order: orderFromRow(order as OrderRow, items) });
  } catch (error) {
    console.error("Error in GET /api/orders/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}