"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const FREE_SHIPPING_THRESHOLD = 1999;
const SHIPPING_FLAT = 99;

const formatPrice = (value: number) =>
  `₹${Number(value).toLocaleString("en-IN")}`;

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

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function CartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-28 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="skeleton mb-8 h-9 w-56" />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-card flex gap-4 p-4">
              <div className="skeleton h-28 w-24 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-3 w-1/4" />
                <div className="skeleton mt-1 h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login prompt                                                        */
/* ------------------------------------------------------------------ */

function LoginPrompt() {
  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full p-10 sm:p-14"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
          <ShoppingBag size={28} className="text-[var(--color-primary-light)]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
          Please login to view your cart
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
          Your divine picks are waiting for you. Sign in to see your cart and
          continue your journey with Radha Rani.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn btn-primary">
            Login
          </Link>
          <Link href="/register" className="btn btn-ghost">
            Create an account
          </Link>
        </div>
        <div className="mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
          >
            <ArrowLeft size={14} />
            Continue browsing the collection
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyCart() {
  return (
    <section className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full p-10 sm:p-14"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
          <PackageOpen size={28} className="text-[var(--color-primary-light)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
          You haven&apos;t added any divine pieces yet. Explore the collection
          and find something you&apos;ll adore.
        </p>
        <Link href="/shop" className="btn btn-primary mt-7">
          Continue shopping
        </Link>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cart item                                                           */
/* ------------------------------------------------------------------ */

function CartRow({
  item,
  onRemove,
  onQuantityChange,
  removing,
}: {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
  removing: boolean;
}) {
  const outOfStock = typeof item.stock === "number" && item.stock <= 0;
  const isLive = !outOfStock;
  const lineTotal = item.price * item.quantity;
  const maxQuantity = typeof item.stock === "number" ? item.stock : 99;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.96, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`glass-card relative overflow-hidden p-4 sm:p-5 ${
        outOfStock ? "opacity-80" : ""
      }`}
    >
      <div className="flex gap-4 sm:gap-5">
        {/* Image */}
        <Link
          href={`/product/${item.slug || item.productId}`}
          className="relative block aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] sm:w-28"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <span className="text-[10px] text-[var(--color-text-muted)]">
                No image
              </span>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-full border border-red-400/40 bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                Out of stock
              </span>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/product/${item.slug || item.productId}`}
                className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-text)] transition-colors hover:text-[var(--color-primary-light)]"
              >
                {item.name}
              </Link>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                {item.size && (
                  <span className="rounded-full border border-[var(--color-border)] bg-white/5 px-2 py-0.5">
                    Size: {item.size}
                  </span>
                )}
                {item.color && (
                  <span className="rounded-full border border-[var(--color-border)] bg-white/5 px-2 py-0.5">
                    Colour: {item.color.charAt(0).toUpperCase() + item.color.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={removing}
              className="shrink-0 rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-secondary)] disabled:opacity-40"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Unavailable notice */}
          {outOfStock && (
            <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
              This item is currently unavailable and won&apos;t be included in
              your order. Remove it to proceed.
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
            {/* Quantity */}
            {isLive ? (
              <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-white/5">
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="flex h-9 w-9 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-xs font-bold text-[var(--color-text)]">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= maxQuantity}
                  className="flex h-9 w-9 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)]">
                Quantity unavailable
              </span>
            )}

            {/* Line total */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatPrice(item.price)} × {item.quantity}
              </span>
              <span className={`text-base font-bold ${isLive ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)] line-through"}`}>
                {formatPrice(lineTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const items = useCartStore((s) => s.items);
  const cartLoading = useCartStore((s) => s.loading);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applying, setApplying] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const liveItems = useMemo(
    () => items.filter((i) => !(typeof i.stock === "number" && i.stock <= 0)),
    [items]
  );
  const hasUnavailable = items.length !== liveItems.length;

  const subtotal = useMemo(
    () => liveItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [liveItems]
  );

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  const couponDiscount = useMemo(
    () =>
      appliedCoupon ? computeCouponDiscount(appliedCoupon, subtotal) : 0,
    [appliedCoupon, subtotal]
  );

  const total = Math.max(0, subtotal - couponDiscount + shipping);

  const itemKey = (item: CartItem) =>
    `${item.productId}::${item.size}::${item.color}`;

  const handleQuantityChange = useCallback(
    async (item: CartItem, qty: number) => {
      if (qty < 1) return;
      if (typeof item.stock === "number" && qty > item.stock) {
        addToast(`Only ${item.stock} available in stock`, "error");
        return;
      }
      const ok = await updateQuantity(item.productId, item.size, item.color, qty);
      if (!ok) addToast("Could not update quantity", "error");
    },
    [updateQuantity, addToast]
  );

  const handleRemove = useCallback(
    async (item: CartItem) => {
      setRemovingId(itemKey(item));
      const ok = await removeItem(item.productId, item.size, item.color);
      if (ok) addToast(`${item.name} removed from cart`, "info");
      else addToast("Could not remove item", "error");
      setRemovingId(null);
    },
    [removeItem, addToast]
  );

  const handleClearCart = useCallback(async () => {
    if (items.length === 0) return;
    if (!window.confirm("Clear all items from your cart?")) return;
    await clearCart();
    addToast("Cart cleared", "info");
  }, [items.length, clearCart, addToast]);

  const applyCoupon = useCallback(async () => {
    const code = couponInput.trim();
    if (!code) {
      addToast("Enter a coupon code first", "info");
      return;
    }
    if (subtotal <= 0) {
      addToast("Your cart is empty", "info");
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
      const data = (await res.json()) as {
        coupon?: {
          code: string;
          discountType: AppliedCoupon["discountType"];
          discountValue: number;
        };
        discount?: number;
        error?: string;
      };

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
      addToast(`Coupon ${data.coupon.code} applied — you saved ${formatPrice(data.discount ?? 0)}`, "success");
    } catch {
      addToast("Could not validate coupon", "error");
    } finally {
      setApplying(false);
    }
  }, [couponInput, subtotal, addToast]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    addToast("Coupon removed", "info");
  }, [addToast]);

  const handleCheckout = useCallback(() => {
    if (hasUnavailable) {
      addToast("Remove unavailable items to proceed", "error");
      return;
    }
    router.push("/checkout");
  }, [hasUnavailable, addToast, router]);

  /* Auth gate logic */
  if (!initialized || (initialized && user && cartLoading && items.length === 0)) {
    return <CartSkeleton />;
  }

  if (initialized && !user) {
    return <LoginPrompt />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
            <ShoppingBag size={13} />
            Your selection
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)] sm:text-4xl">
            Shopping Cart
            {items.length > 0 && (
              <span className="ml-3 align-middle text-sm font-semibold text-[var(--color-text-muted)]">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            )}
          </h1>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)]"
          >
            <Trash2 size={15} />
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Items */}
          <div className="min-w-0">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <div key={itemKey(item)} className="mb-4">
                  <CartRow
                    item={item}
                    removing={removingId === itemKey(item)}
                    onRemove={() => handleRemove(item)}
                    onQuantityChange={(qty) => handleQuantityChange(item, qty)}
                  />
                </div>
              ))}
            </AnimatePresence>

            {hasUnavailable && (
              <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-300">
                Some items in your cart are currently out of stock and have been
                excluded from your order summary. Please remove them to proceed
                to checkout.
              </p>
            )}

            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
            >
              <ArrowLeft size={15} />
              Continue shopping
            </Link>
          </div>

          {/* Order summary */}
          <div className="h-fit lg:sticky lg:top-24">
            <div className="glass-card overflow-hidden">
              <div className="border-b border-[var(--color-border)] px-6 py-5">
                <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text)]">
                  <Tag size={16} className="text-[var(--color-primary-light)]" />
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[var(--color-text)]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                    <span>Shipping</span>
                    {shipping === 0 ? (
                      <span className="font-semibold text-emerald-400">FREE</span>
                    ) : (
                      <span className="font-semibold text-[var(--color-text)]">
                        {formatPrice(shipping)}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {appliedCoupon && couponDiscount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between overflow-hidden text-emerald-400"
                      >
                        <span className="flex items-center gap-1.5">
                          <BadgePercent size={14} />
                          {appliedCoupon.code}
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-secondary)]"
                            aria-label="Remove coupon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                        <span className="font-semibold">
                          − {formatPrice(couponDiscount)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {shipping > 0 && (
                  <p className="rounded-lg border border-[var(--color-border)] bg-white/[0.03] px-3 py-2 text-[11px] text-[var(--color-text-muted)]">
                    Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more to
                    unlock <span className="font-semibold text-emerald-400">FREE shipping</span>.
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    Total
                  </span>
                  <span className="text-2xl font-black text-[var(--color-text)]">
                    {formatPrice(total)}
                  </span>
                </div>

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                      <BadgePercent size={16} />
                      {appliedCoupon.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-secondary)]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <BadgePercent
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                      />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder="Coupon code"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-9 pr-3 text-sm uppercase text-[var(--color-text)] placeholder:normal-case placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applying || !couponInput.trim()}
                      className="rounded-xl border border-[var(--color-primary-light)]/40 bg-gradient-to-r from-[var(--color-primary)]/15 to-[var(--color-secondary)]/10 px-4 text-sm font-semibold text-[var(--color-primary-light)] transition-colors hover:bg-white/10 disabled:opacity-40"
                    >
                      {applying ? "…" : "Apply"}
                    </button>
                  </div>
                )}

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    liveItems.length > 0 ? handleCheckout() : undefined
                  }
                  disabled={liveItems.length === 0 || hasUnavailable}
                  className="btn btn-primary h-13 w-full rounded-2xl py-3.5 text-base font-bold"
                >
                  <ArrowRight size={17} />
                  PROCEED TO CHECKOUT
                </motion.button>

                <p className="text-center text-[11px] text-[var(--color-text-muted)]">
                  Free delivery above {formatPrice(FREE_SHIPPING_THRESHOLD)} · 7-day
                  easy returns · Secure checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}