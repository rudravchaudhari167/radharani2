import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    if (status) {
      const validStatuses = [
        "ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED",
        "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      filter.orderStatus = status;
    }
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "address.fullName": { $regex: search, $options: "i" } },
        { "address.email": { $regex: search, $options: "i" } },
        { "address.phone": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
