import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [{ data: paidOrders }, { data: todayPaid }, totalOrders, pendingOrders, totalCustomers, totalProducts, { data: lowStockRows }, { data: recentRows }] = await Promise.all([
      supabase
        .from("orders")
        .select("total")
        .eq("payment_status", "PAID"),
      supabase
        .from("orders")
        .select("total")
        .eq("payment_status", "PAID")
        .gte("created_at", startOfToday.toISOString()),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("order_status", ["ORDER_PLACED", "PAYMENT_CONFIRMED"]),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "USER"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("products")
        .select("id, name, slug, stock, sku, price")
        .eq("is_active", true)
        .lt("stock", 5)
        .order("stock", { ascending: true })
        .limit(20),
      supabase
        .from("orders")
        .select("id, order_id, user_id, order_status, total, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const todayRevenue = (todayPaid || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const userIds = [...new Set((recentRows || []).map((r) => r.user_id).filter(Boolean))];
    const { data: userRows } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds.length ? userIds : [""]);

    const userMap = new Map(
      ((userRows || []) as Array<{ id: string; name: string | null; email: string | null }>).map((u) => [
        u.id,
        { name: u.name || "", email: u.email || "" },
      ])
    );

    const lowStock = ((lowStockRows || []) as Array<{ id: string; name: string; slug: string; stock: number; sku: string; price: number }>).map((p) => ({
      _id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      sku: p.sku,
      price: Number(p.price) || 0,
    }));

    const recentOrders = ((recentRows || []) as Array<{ id: string; order_id: string; user_id: string; order_status: string; total: number; created_at: string }>).map((o) => ({
      _id: o.id,
      orderId: o.order_id,
      total: Number(o.total) || 0,
      orderStatus: o.order_status,
      createdAt: o.created_at,
      userId: userMap.get(o.user_id),
    }));

    return NextResponse.json({
      totalRevenue,
      todayRevenue,
      totalOrders: totalOrders.count ?? 0,
      pendingOrders: pendingOrders.count ?? 0,
      totalCustomers: totalCustomers.count ?? 0,
      totalProducts: totalProducts.count ?? 0,
      lowStock,
      recentOrders,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}