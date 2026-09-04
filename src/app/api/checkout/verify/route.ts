import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
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

    const supabase = getSupabaseServer();

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();

    const { data: cartItems } = cart
      ? await supabase
          .from("cart_items")
          .select("product_id, name, image, size, color, quantity")
          .eq("cart_id", cart.id)
      : { data: null };

    if (!cart || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const { data: pending } = await supabase
      .from("cart_checkout_pending")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (!pending) {
      return NextResponse.json(
        { error: "No pending checkout found for this order" },
        { status: 400 }
      );
    }

    const productIds: string[] = cartItems
      .map((i) => i.product_id)
      .filter((id): id is string => Boolean(id));

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, images, stock, is_active")
      .eq("is_active", true)
      .in("id", productIds.length ? productIds : [""]);

    const productMap = new Map(
      (products || []).map((p) => [p.id, p])
    );

    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      name: string;
      price: number;
      image: string;
      size: string;
      color: string;
      quantity: number;
    }> = [];

    for (const item of cartItems) {
      const product = productMap.get(item.product_id || "");

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

      subtotal += Number(product.price) * item.quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.images?.[0] || "",
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
    }

    subtotal = Math.round(subtotal);

    if (subtotal !== Number(pending.subtotal)) {
      return NextResponse.json(
        { error: "Cart contents have changed. Please re-checkout." },
        { status: 400 }
      );
    }

    const method: "STANDARD" | "EXPRESS" = pending.shipping_method;
    const shipping =
      method === "EXPRESS"
        ? SHIPPING_EXPRESS
        : subtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : SHIPPING_STANDARD;

    const discount = Number(pending.discount) || 0;
    const appliedCouponCode = pending.coupon_code || "";

    const total = Math.max(0, Math.round(subtotal - discount + shipping));
    const totalPaise = Math.round(total * 100);

    if (totalPaise !== Math.round(Number(pending.total) * 100)) {
      return NextResponse.json(
        { error: "Order total mismatch. Please re-checkout." },
        { status: 400 }
      );
    }

    if (appliedCouponCode) {
      const { data: couponRow } = await supabase
        .from("coupons")
        .select("code, active, expiry_date, minimum_order, usage_limit, used_count")
        .eq("code", appliedCouponCode.toUpperCase())
        .maybeSingle();
      if (
        !couponRow ||
        !couponRow.active ||
        new Date(couponRow.expiry_date) < new Date() ||
        subtotal < Number(couponRow.minimum_order) ||
        (Number(couponRow.usage_limit) > 0 &&
          Number(couponRow.used_count) >= Number(couponRow.usage_limit))
      ) {
        return NextResponse.json(
          { error: "Coupon is no longer valid" },
          { status: 400 }
        );
      }
    }

    const { data: storedAddress } = await supabase
      .from("addresses")
      .select("full_name, phone, email, address_line1, address_line2, city, state, pincode, landmark")
      .eq("id", pending.address_id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!storedAddress) {
      return NextResponse.json(
        { error: "Delivery address not found" },
        { status: 400 }
      );
    }

    const deliveryAddress = {
      fullName: storedAddress.full_name,
      phone: storedAddress.phone,
      email: storedAddress.email,
      addressLine1: storedAddress.address_line1,
      addressLine2: storedAddress.address_line2 || "",
      city: storedAddress.city,
      state: storedAddress.state,
      pincode: storedAddress.pincode,
      landmark: storedAddress.landmark || "",
    };

    const estimatedDays = method === "EXPRESS" ? 3 : 7;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

    const orderId = generateOrderId();

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        user_id: session.userId,
        subtotal: Math.round(subtotal),
        discount: Math.round(discount),
        coupon_code: appliedCouponCode,
        shipping,
        total: Math.round(total),
        payment_status: "PAID",
        payment_id: razorpayPaymentId,
        order_status: "PAYMENT_CONFIRMED",
        address: deliveryAddress,
        shipping_method: method,
        estimated_delivery: estimatedDelivery.toISOString(),
      })
      .select("id, order_id, subtotal, discount, coupon_code, shipping, total, payment_status, payment_id, order_status, address, shipping_method, estimated_delivery, created_at, updated_at")
      .single();

    if (orderError || !orderRow) {
      throw orderError || new Error("Could not create order");
    }

    await supabase
      .from("order_items")
      .insert(
        orderItems.map((item) => ({
          order_id: orderRow.id,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        }))
      );

    for (const item of orderItems) {
      await supabase.rpc(
        "decrement_stock",
        { target_product_id: item.productId, by_qty: item.quantity }
      );
    }

    await supabase.from("carts").delete().eq("id", cart.id);

    if (appliedCouponCode) {
      await supabase.rpc(
        "increment_coupon_used",
        { coupon_code: appliedCouponCode }
      );
    }

    return NextResponse.json({
      message: "Payment verified and order placed successfully",
      order: {
        orderId: orderRow.order_id,
        items: orderItems,
        subtotal: Number(orderRow.subtotal),
        discount: Number(orderRow.discount),
        couponCode: orderRow.coupon_code || "",
        shipping: Number(orderRow.shipping),
        total: Number(orderRow.total),
        paymentStatus: orderRow.payment_status,
        orderStatus: orderRow.order_status,
        address: orderRow.address,
        shippingMethod: orderRow.shipping_method,
        estimatedDelivery: orderRow.estimated_delivery,
        createdAt: orderRow.created_at,
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