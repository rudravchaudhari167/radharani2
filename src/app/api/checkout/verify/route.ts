import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cart from "@/models/Cart";
import Address from "@/models/Address";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { verifyRazorpayPayment, isPaymentSandbox } from "@/lib/razorpay";
import { getServerSession } from "@/lib/auth";

const SHIPPING_STANDARD = 99;
const SHIPPING_EXPRESS = 199;
const FREE_SHIPPING_THRESHOLD = 1999;

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "VK";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    if (
      !razorpayOrderId.trim() ||
      !razorpayPaymentId.trim() ||
      !razorpaySignature.trim()
    ) {
      return NextResponse.json(
        { error: "Payment fields cannot be empty" },
        { status: 400 }
      );
    }

    const sandboxOrder = razorpayOrderId.startsWith("sandbox_");
    if (!isPaymentSandbox() && sandboxOrder) {
      return NextResponse.json(
        { error: "Invalid payment order" },
        { status: 400 }
      );
    }

    let isValid = false;
    if (sandboxOrder && isPaymentSandbox()) {
      // Dev sandbox path — only reachable when real Razorpay keys are NOT set.
      isValid = razorpayPaymentId.trim().length > 0 && razorpaySignature.trim().length > 0;
    } else {
      const verified = await verifyRazorpayPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
      isValid = verified;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({ userId: session.userId }).select(
      "+checkoutPending"
    );
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (
      !cart.checkoutPending ||
      cart.checkoutPending.razorpayOrderId !== razorpayOrderId
    ) {
      return NextResponse.json(
        { error: "No pending checkout found for this order" },
        { status: 400 }
      );
    }

    const pending = cart.checkoutPending;

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

      subtotal += product.price * item.quantity;

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

    if (subtotal !== pending.subtotal) {
      return NextResponse.json(
        { error: "Cart contents have changed. Please re-checkout." },
        { status: 400 }
      );
    }

    const method: "STANDARD" | "EXPRESS" = pending.shippingMethod;
    const shipping =
      method === "EXPRESS"
        ? SHIPPING_EXPRESS
        : subtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : SHIPPING_STANDARD;

    const discount = pending.discount;
    const appliedCouponCode = pending.couponCode || "";

    const total = Math.max(0, subtotal - discount + shipping);
    const totalPaise = Math.round(total * 100);

    if (totalPaise !== Math.round(pending.total * 100)) {
      return NextResponse.json(
        { error: "Order total mismatch. Please re-checkout." },
        { status: 400 }
      );
    }

    if (appliedCouponCode) {
      const coupon = await Coupon.findOne({
        code: appliedCouponCode.toUpperCase(),
      });
      if (
        !coupon ||
        !coupon.active ||
        new Date(coupon.expiryDate) < new Date() ||
        subtotal < coupon.minimumOrder ||
        (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
      ) {
        return NextResponse.json(
          { error: "Coupon is no longer valid" },
          { status: 400 }
        );
      }
    }

    const storedAddress = await Address.findOne({
      _id: pending.addressId,
      userId: session.userId,
    }).lean();

    if (!storedAddress) {
      return NextResponse.json(
        { error: "Delivery address not found" },
        { status: 400 }
      );
    }

    const deliveryAddress = {
      fullName: storedAddress.fullName,
      phone: storedAddress.phone,
      email: storedAddress.email,
      addressLine1: storedAddress.addressLine1,
      addressLine2: storedAddress.addressLine2 || "",
      city: storedAddress.city,
      state: storedAddress.state,
      pincode: storedAddress.pincode,
      landmark: storedAddress.landmark || "",
    };

    const estimatedDays = method === "EXPRESS" ? 3 : 7;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

    const orderId = generateOrderId();

    const order = await Order.create({
      orderId,
      userId: session.userId,
      items: orderItems,
      subtotal,
      discount,
      couponCode: appliedCouponCode,
      shipping,
      total,
      paymentStatus: "PAID",
      paymentId: razorpayPaymentId,
      orderStatus: "PAYMENT_CONFIRMED",
      address: deliveryAddress,
      shippingMethod: method,
      estimatedDelivery,
    });

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId: session.userId });

    if (appliedCouponCode) {
      await Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    return NextResponse.json({
      message: "Payment verified and order placed successfully",
      order: {
        orderId: order.orderId,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        couponCode: order.couponCode,
        shipping: order.shipping,
        total: order.total,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        address: order.address,
        shippingMethod: order.shippingMethod,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/checkout/verify:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
