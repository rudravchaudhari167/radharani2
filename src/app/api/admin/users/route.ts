import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getServerSession } from "@/lib/auth";

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
    const role = searchParams.get("role");

    let query = supabase
      .from("users")
      .select("id, name, email, phone, role, is_active, created_at, updated_at", { count: "exact" });
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (role && ["USER", "ADMIN"].includes(role)) {
      query = query.eq("role", role);
    }

    const { data: usersRaw, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const userIds = (usersRaw || []).map((u) => u.id);
    const total = count ?? 0;

    const statsMap = new Map<string, { orderCount: number; totalSpending: number }>();
    if (userIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total")
        .in("user_id", userIds);
      for (const order of orders || []) {
        const current = statsMap.get(order.user_id) || { orderCount: 0, totalSpending: 0 };
        current.orderCount += 1;
        current.totalSpending += Number(order.total) || 0;
        statsMap.set(order.user_id, current);
      }
    }

    const users = (usersRaw || []).map((u) => {
      const stats = statsMap.get(u.id) || { orderCount: 0, totalSpending: 0 };
      return {
        _id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        orderCount: stats.orderCount,
        totalSpending: stats.totalSpending,
      };
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}