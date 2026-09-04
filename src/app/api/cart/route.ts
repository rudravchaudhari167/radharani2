import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cart, { type ICartItem } from "@/models/Cart";
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

    const cart = await Cart.findOne({ userId: session.userId })
      .populate("items.productId", "name price images stock isActive")
      .lean();

    if (!cart) {
      return NextResponse.json({ cart: { items: [] } });
    }

    const validItems = (cart.items as unknown as Array<{
      productId: string | { isActive?: boolean };
      name: string;
      price: number;
      image: string;
      size: string;
      color: string;
      quantity: number;
    }>).filter(
      (item) =>
        item.productId &&
        (item.productId as { isActive?: boolean }).isActive !== false
    ) as ICartItem[];

    if (validItems.length !== cart.items.length) {
      await Cart.findOneAndUpdate(
        { userId: session.userId },
        { items: validItems }
      );
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Error in GET /api/cart:", error);
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

    const { productId, size, color, quantity } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const qty = typeof quantity === "number" ? quantity : 1;
    if (qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
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

    if (product.stock < qty) {
      return NextResponse.json(
        { error: "Insufficient stock available" },
        { status: 400 }
      );
    }

    const sizeStr = typeof size === "string" ? size : "";
    const colorStr = typeof color === "string" ? color : "";

    const cart = await Cart.findOne({ userId: session.userId });

    if (!cart) {
      const newCart = await Cart.create({
        userId: session.userId,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images[0] || "",
            size: sizeStr,
            color: colorStr,
            quantity: qty,
          },
        ],
      });

      return NextResponse.json(
        { message: "Item added to cart", cart: newCart },
        { status: 201 }
      );
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        String(item.productId) === String(product._id) &&
        item.size === sizeStr &&
        item.color === colorStr
    );

    if (existingItemIndex > -1) {
      const newQty = cart.items[existingItemIndex].quantity + qty;

      if (product.stock < newQty) {
        return NextResponse.json(
          { error: "Insufficient stock available" },
          { status: 400 }
        );
      }

      cart.items[existingItemIndex].quantity = newQty;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0] || "",
        size: sizeStr,
        color: colorStr,
        quantity: qty,
      });
    }

    await cart.save();

    return NextResponse.json(
      { message: "Item added to cart", cart },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { productId, size, color, quantity } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const qty = typeof quantity === "number" ? quantity : 1;
    if (qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
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

    if (product.stock < qty) {
      return NextResponse.json(
        { error: "Insufficient stock available" },
        { status: 400 }
      );
    }

    const sizeStr = typeof size === "string" ? size : "";
    const colorStr = typeof color === "string" ? color : "";

    const cart = await Cart.findOne({ userId: session.userId });
    if (!cart) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        String(item.productId) === String(product._id) &&
        item.size === sizeStr &&
        item.color === colorStr
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    return NextResponse.json({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error in PUT /api/cart:", error);
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

    const { productId, size, color } = body;

    if (typeof productId !== "string" || !productId.trim()) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const sizeStr = typeof size === "string" ? size : "";
    const colorStr = typeof color === "string" ? color : "";

    const cart = await Cart.findOne({ userId: session.userId });
    if (!cart) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        String(item.productId) === productId.trim() &&
        item.size === sizeStr &&
        item.color === colorStr
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return NextResponse.json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error in DELETE /api/cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
