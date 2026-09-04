import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  orderFromRow,
  orderItemFromRow,
  type OrderRow,
  type OrderItemRow,
} from "@/lib/supabase-shapes";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: orderRows, error } = await supabase
      .from("orders")
      .select("id, order_id, user_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = orderRows.map((o) => o.id);

    const { data: itemRows } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, name, price, image, size, color, quantity")
      .in("order_id", orderIds);

    const itemsByOrder = new Map<string, ReturnType<typeof orderItemFromRow>[]>();
    for (const item of (itemRows as OrderItemRow[] | null) || []) {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(orderItemFromRow(item));
      itemsByOrder.set(item.order_id, list);
    }

    const orders = (orderRows as OrderRow[]).map((row) =>
      orderFromRow(row, itemsByOrder.get(row.id) || [])
    );

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error in GET /api/orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}