import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cart from "@/models/Cart";
import Address from "@/models/Address";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import { createRazorpayOrder, isPaymentSandbox } from "@/lib/razorpay";
import { getServerSession } from "@/lib/auth";

const SHIPPING_STANDARD = 99;
const SHIPPING_EXPRESS = 199;
const FREE_SHIPPING_THRESHOLD = 1999;

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

    const { addressId, shippingMethod, couponCode } = body;

    if (typeof addressId !== "string" || !addressId.trim()) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const address = await Address.findOne({
      _id: addressId.trim(),
      userId: session.userId,
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const cart = await Cart.findOne({ userId: session.userId });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const productIds = cart.items.map((item) => String(item.productId));
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).lean();

    const productMap = new Map(
      products.map((p) => [String(p._id), p])
    );

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = productMap.get(String(item.productId));

      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.name}" is no longer available` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${item.name}". Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: String(product._id),
        name: product.name,
        price: product.price,
        image: product.images[0] || "",
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
    }

    const method =
      shippingMethod === "EXPRESS" ? "EXPRESS" : "STANDARD";
    const shipping =
      method === "EXPRESS"
        ? SHIPPING_EXPRESS
        : subtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : SHIPPING_STANDARD;

    let discount = 0;
    let appliedCouponCode = "";

    if (typeof couponCode === "string" && couponCode.trim()) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
      });

      if (coupon && coupon.active && new Date(coupon.expiryDate) >= new Date()) {
        if (subtotal >= coupon.minimumOrder) {
          if (coupon.usageLimit <= 0 || coupon.usedCount < coupon.usageLimit) {
            if (coupon.discountType === "PERCENTAGE") {
              discount = Math.round((subtotal * coupon.discountValue) / 100);
              if (coupon.maximumDiscount > 0) {
                discount = Math.min(discount, coupon.maximumDiscount);
              }
            } else {
              discount = Math.min(coupon.discountValue, subtotal);
            }
            appliedCouponCode = coupon.code;
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount + shipping);
    const amountInPaise = Math.round(total * 100);

    let razorpayOrderId: string;
    if (isPaymentSandbox()) {
      // Dev sandbox: simulate an order reference so the flow is testable
      // without live credentials. Replaced by real Razorpay orders when keys
      // are configured. Order id is prefixed with "sandbox_" so the verify
      // route can distinguish it and never accept real-credential payments.
      razorpayOrderId = `sandbox_${Date.now()}_${session.userId.slice(-6)}`;
    } else {
      const receiptId = `order_${session.userId.slice(-8)}_${Date.now()}`;
      const razorpayOrder = await createRazorpayOrder(amountInPaise, receiptId);
      razorpayOrderId = razorpayOrder.id;
    }

    await Cart.findOneAndUpdate(
      { userId: session.userId },
      {
        checkoutPending: {
          addressId: addressId.trim(),
          shippingMethod: method,
          couponCode: appliedCouponCode || undefined,
          subtotal,
          discount,
          shipping,
          total,
          razorpayOrderId,
          createdAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      sandbox: isPaymentSandbox(),
      subtotal,
      discount,
      shipping,
      total,
      shippingMethod: method,
      couponCode: appliedCouponCode || undefined,
    });
  } catch (error) {
    console.error("Error in POST /api/checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
