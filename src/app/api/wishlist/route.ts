import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Wishlist, { type IWishlistItem } from "@/models/Wishlist";
import Product from "@/models/Product";
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

    await dbConnect();

    const wishlist = await Wishlist.findOne({ userId: session.userId })
      .populate("products.productId", "name price images stock isActive slug")
      .lean();

    if (!wishlist) {
      return NextResponse.json({ wishlist: { products: [] } });
    }

    const validProducts = (wishlist.products as unknown as Array<{
      productId: string | { isActive?: boolean };
      name: string;
      price: number;
      image: string;
      addedAt: Date;
    }>).filter(
      (item) =>
        item.productId &&
        (item.productId as { isActive?: boolean }).isActive !== false
    ) as IWishlistItem[];

    if (validProducts.length !== wishlist.products.length) {
      await Wishlist.findOneAndUpdate(
        { userId: session.userId },
        { products: validProducts }
      );
    }

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error("Error in GET /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { productId } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await Product.findOne({
      _id: productId.trim(),
      isActive: true,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const wishlist = await Wishlist.findOne({ userId: session.userId });

    if (!wishlist) {
      const newWishlist = await Wishlist.create({
        userId: session.userId,
        products: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images[0] || "",
          },
        ],
      });

      return NextResponse.json(
        { message: "Product added to wishlist", wishlist: newWishlist },
        { status: 201 }
      );
    }

    const alreadyExists = wishlist.products.some(
      (item) => String(item.productId) === String(product._id)
    );

    if (alreadyExists) {
      return NextResponse.json(
        { error: "Product is already in your wishlist" },
        { status: 409 }
      );
    }

    wishlist.products.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      addedAt: new Date(),
    });

    await wishlist.save();

    return NextResponse.json(
      { message: "Product added to wishlist", wishlist },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { productId } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const wishlist = await Wishlist.findOne({ userId: session.userId });
    if (!wishlist) {
      return NextResponse.json(
        { error: "Wishlist is empty" },
        { status: 404 }
      );
    }

    const itemIndex = wishlist.products.findIndex(
      (item) => String(item.productId) === productId.trim()
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Product not found in wishlist" },
        { status: 404 }
      );
    }

    wishlist.products.splice(itemIndex, 1);
    await wishlist.save();

    return NextResponse.json({
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Error in DELETE /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
