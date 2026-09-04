import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const query = request.nextUrl.searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchTerm = query.trim();

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
    })
      .select("name slug price images category tags")
      .limit(10)
      .lean();

    return NextResponse.json({ suggestions: products });
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
