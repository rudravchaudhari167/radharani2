import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalRevenueResult,
      todayRevenueResult,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStock,
      recentOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "PAID", createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: { $in: ["ORDER_PLACED", "PAYMENT_CONFIRMED"] } }),
      User.countDocuments({ role: "USER" }),
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true, stock: { $lt: 5 } })
        .select("name slug stock sku price")
        .sort({ stock: 1 })
        .limit(20)
        .lean(),
      Order.find({})
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return NextResponse.json({
      totalRevenue: totalRevenueResult[0]?.total || 0,
      todayRevenue: todayRevenueResult[0]?.total || 0,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStock,
      recentOrders,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
