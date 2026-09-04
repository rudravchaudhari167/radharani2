import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

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

    await dbConnect();
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

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ADMIN" && String(user._id) === String(session.userId)) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const previousActive = user.isActive;
    if (body.isActive !== undefined && typeof body.isActive === "boolean") {
      user.isActive = body.isActive;
    }

    await user.save();

    await AuditLog.create({
      adminId: session.userId,
      adminEmail: session.email,
      action: "USER_STATUS_UPDATED",
      target: `User:${id}`,
      details: {
        userName: user.name,
        userEmail: user.email,
        isActiveChanged: previousActive !== user.isActive,
        previousActive,
        newActive: user.isActive,
      },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
