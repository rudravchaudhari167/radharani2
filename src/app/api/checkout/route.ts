import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { couponFromRow } from "@/lib/supabase-shapes";
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

    const supabase = getSupabaseServer();

    const { data: address } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", addressId.trim())
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!cart) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("product_id, name, price, image, size, color, quantity")
      .eq("cart_id", cart.id);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
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

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

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

    const method = shippingMethod === "EXPRESS" ? "EXPRESS" : "STANDARD";
    const shipping =
      method === "EXPRESS"
        ? SHIPPING_EXPRESS
        : subtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : SHIPPING_STANDARD;

    let discount = 0;
    let appliedCouponCode = "";

    if (typeof couponCode === "string" && couponCode.trim()) {
      const { data: couponRow } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .maybeSingle();

      if (couponRow) {
        const coupon = couponFromRow(couponRow);
        if (coupon.active && new Date(coupon.expiryDate) >= new Date()) {
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
    }

    const total = Math.max(0, Math.round(subtotal - discount + shipping));
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

    await supabase
      .from("cart_checkout_pending")
      .upsert(
        {
          cart_id: cart.id,
          address_id: addressId.trim(),
          shipping_method: method,
          coupon_code: appliedCouponCode || null,
          subtotal: Math.round(subtotal),
          discount: Math.round(discount),
          shipping,
          total,
          razorpay_order_id: razorpayOrderId,
        },
        { onConflict: "cart_id" }
      );

    return NextResponse.json({
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      sandbox: isPaymentSandbox(),
      subtotal: Math.round(subtotal),
      discount: Math.round(discount),
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