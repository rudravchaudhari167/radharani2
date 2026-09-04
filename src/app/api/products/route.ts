import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const size = searchParams.get("size") || "";
    const color = searchParams.get("color") || "";
    const sort = searchParams.get("sort") || "popular";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10))
    );
    const featured = searchParams.get("featured");
    const isNewArrival = searchParams.get("isNewArrival");

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    if (category) {
      const validCategories = ["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"];
      if (validCategories.includes(category.toUpperCase())) {
        filter.category = category.toUpperCase();
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        (filter.price as Record<string, number>).$gte = Math.max(
          0,
          parseFloat(minPrice)
        );
      }
      if (maxPrice) {
        (filter.price as Record<string, number>).$lte = Math.max(
          0,
          parseFloat(maxPrice)
        );
      }
    }

    if (size) {
      filter.sizes = { $in: [size.toUpperCase()] };
    }

    if (color) {
      filter["colors.name"] = new RegExp(`^${color}$`, "i");
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (isNewArrival === "true") {
      filter.isNewArrival = true;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case "popular":
        sortOption = { reviewCount: -1, rating: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "price-asc":
        sortOption = { price: 1 };
        break;
      case "price-desc":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
