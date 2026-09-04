import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getServerSession } from "@/lib/auth";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.role !== undefined) {
      return NextResponse.json(
        { error: "Role changes are not allowed through this endpoint" },
        { status: 403 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: user } = await supabase
      .from("users")
      .select("id, name, email, phone, role, is_active, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ADMIN" && String(user.id) === String(session.userId)) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const previousActive = user.is_active;
    let newActive = previousActive;
    if (body.isActive !== undefined && typeof body.isActive === "boolean") {
      newActive = body.isActive;
    }

    await supabase
      .from("users")
      .update({ is_active: newActive, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    await supabase.from("audit_logs").insert({
      admin_id: session.userId,
      admin_email: session.email,
      action: "USER_STATUS_UPDATED",
      target: `User:${id}`,
      details: {
        userName: user.name,
        userEmail: user.email,
        isActiveChanged: previousActive !== newActive,
        previousActive,
        newActive,
      },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: newActive,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}