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
    const action = searchParams.get("action");
    const adminEmail = searchParams.get("adminEmail");

    let query = supabase
      .from("audit_logs")
      .select("id, admin_id, admin_email, action, target, details, ip_address, created_at", { count: "exact" });
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }
    if (adminEmail) {
      query = query.ilike("admin_email", `%${adminEmail}%`);
    }

    const { data: rows, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const total = count ?? 0;

    const logs = ((rows || []) as Array<{
      id: string;
      admin_id: string | null;
      admin_email: string | null;
      action: string;
      target: string;
      details: unknown;
      ip_address: string | null;
      created_at: string;
    }>).map((r) => ({
      _id: r.id,
      adminId: r.admin_id,
      adminEmail: r.admin_email,
      action: r.action,
      target: r.target,
      details: r.details,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/audit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}