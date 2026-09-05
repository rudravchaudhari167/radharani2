"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Check,
  X,
} from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/store";

const FREE_SHIPPING_THRESHOLD = 1999;
const SHIPPING_FLAT = 99;

interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

function computeCouponDiscount(
  coupon: AppliedCoupon,
  subtotal: number
): number {
  if (subtotal <= 0) return 0;
  if (coupon.discountType === "PERCENTAGE") {
    return Math.min(subtotal, Math.round((subtotal * coupon.discountValue) / 100));
  }
  return Math.min(subtotal, coupon.discountValue);
}

export default function CartPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applying, setApplying] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0),
    [items]
  );

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  const couponDiscount = useMemo(
    () => (appliedCoupon ? computeCouponDiscount(appliedCoupon, subtotal) : 0),
    [appliedCoupon, subtotal]
  );

  const total = Math.max(0, subtotal - couponDiscount + shipping);
  const amountAway = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const applyCoupon = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) {
      addToast("Please enter a coupon code", "info");
      return;
    }
    if (subtotal <= 0) {
      addToast("Your bag is empty", "info");
      return;
    }

    setApplying(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.coupon) {
        addToast(data.error || "Invalid coupon code", "error");
        return;
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discountType: data.coupon.discountType,
        discountValue: data.coupon.discountValue,
      });
      setCouponInput("");
      addToast(`Coupon ${data.coupon.code} applied`, "success");
    } catch {
      addToast("Could not validate coupon", "error");
    } finally {
      setApplying(false);
    }
  }, [couponInput, subtotal, addToast]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast("Coupon removed", "info");
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      addToast("Your bag is empty", "info");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="bg-[var(--color-bg)] py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Header */}
        <div className="mb-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--color-border)] pb-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-text)]">
              Shopping Bag
            </h1>
            <span className="text-xs text-[var(--color-text-muted)] tracking-wider uppercase">
              {items.reduce((s, i) => s + (i.quantity || 1), 0)} Items
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] mb-5">
              <ShoppingBag size={26} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl font-normal text-[var(--color-text)]">
              Your bag is empty
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              Explore our curated collections of contemporary silhouettes inspired by timeless Indian devotion.
            </p>
            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[var(--color-accent-light)] transition-all"
              >
                <span>Discover Collection</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Layout: Left Items, Right Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left: Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {/* Free Shipping Progress Indicator */}
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 p-4">
                {amountAway > 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Add <span className="font-semibold text-[var(--color-accent)]">₹{amountAway.toLocaleString("en-IN")}</span> more to qualify for <span className="font-medium text-[var(--color-text)]">Complimentary Delivery</span>
                  </p>
                ) : (
                  <p className="text-xs font-medium text-[var(--color-accent)] flex items-center gap-1.5">
                    <Check size={14} />
                    <span>You have unlocked Complimentary Delivery!</span>
                  </p>
                )}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full bg-[var(--color-accent)] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex gap-4 sm:gap-6 py-6"
                  >
                    {/* Item Image */}
                    <div className="relative aspect-[3/4] w-24 sm:w-28 shrink-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="120px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--color-text-muted)]">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={item.slug ? `/product/${item.slug}` : `/product/${item.productId}`}
                              className="font-serif text-base font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors line-clamp-1"
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors p-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Quantity Stepper & Price */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex h-8 items-center rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, (item.quantity || 1) - 1)}
                            className="flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-medium text-[var(--color-text)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, (item.quantity || 1) + 1)}
                            className="flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-base font-medium text-[var(--color-text)]">
                          ₹{((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 space-y-6 shadow-xs sticky top-24">
                <h2 className="font-serif text-lg font-medium text-[var(--color-text)] border-b border-[var(--color-border)] pb-4">
                  Order Summary
                </h2>

                {/* Pricing Breakdown */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[var(--color-text)]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[var(--color-accent)] font-medium">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="font-medium text-[var(--color-accent)]">FREE</span>
                      ) : (
                        `₹${shipping}`
                      )}
                    </span>
                  </div>

                  <div className="border-t border-[var(--color-border)] pt-3 flex justify-between text-sm font-medium text-[var(--color-text)]">
                    <span>Total</span>
                    <span className="text-base">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-[var(--color-border)] pt-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-md bg-[var(--color-bg-muted)] px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--color-accent)] font-medium">
                        <Tag size={13} />
                        <span>{appliedCoupon.code} Applied</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={applyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs uppercase tracking-wider text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                      />
                      <button
                        type="submit"
                        disabled={applying}
                        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--color-accent-light)] disabled:opacity-50"
                      >
                        {applying ? "..." : "APPLY"}
                      </button>
                    </form>
                  )}
                  <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                    Try WELCOME10 or KRISHNA10
                  </p>
                </div>

                {/* Checkout CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm hover:bg-[var(--color-accent-light)] transition-all"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Reassurance Badges */}
                <div className="border-t border-[var(--color-border)] pt-4 space-y-2 text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[var(--color-accent)]" />
                    <span>Guaranteed Safe & Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={14} className="text-[var(--color-accent)]" />
                    <span>7-Day Effortless Returns & Exchanges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones size={14} className="text-[var(--color-accent)]" />
                    <span>Dedicated Support: care@vrindav.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}