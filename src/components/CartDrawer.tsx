"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

const FREE_SHIPPING_THRESHOLD = 1999;

export default function CartDrawer() {
  const router = useRouter();
  const titleId = useId();
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const amountAway = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  const handleCheckout = () => {
    closeDrawer();
    router.push("/checkout");
  };

  const handleViewCart = () => {
    closeDrawer();
    router.push("/cart");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-[var(--color-bg)] shadow-2xl border-l border-[var(--color-border)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
              <div className="flex items-center gap-2.5">
                <span id={titleId} className="font-serif text-lg font-medium tracking-wide text-[var(--color-text)]">
                  Shopping Bag
                </span>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  ({items.reduce((s, i) => s + (i.quantity || 1), 0)})
                </span>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
                aria-label="Close bag"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free shipping progress bar */}
            <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)]/50 px-6 py-3.5">
              {amountAway > 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Add{" "}
                  <span className="font-semibold text-[var(--color-accent)]">
                    ₹{amountAway.toLocaleString("en-IN")}
                  </span>{" "}
                  more for <span className="font-medium text-[var(--color-text)]">Complimentary Delivery</span>
                </p>
              ) : (
                <p className="text-xs font-medium text-[var(--color-accent)]">
                  ✓ You have unlocked Complimentary Delivery
                </p>
              )}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <motion.div
                  className="h-full bg-[var(--color-accent)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Content / Items */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                  <ShoppingBag size={24} strokeWidth={1.5} />
                </div>
                <p className="mt-4 font-serif text-lg text-[var(--color-text)]">
                  Your bag is empty
                </p>
                <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">
                  Discover contemporary silhouettes inspired by timeless Indian heritage.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    router.push("/shop");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] active:scale-100"
                >
                  Explore Collection
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[var(--color-border)]">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {/* Item Image */}
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)]">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={item.slug ? `/product/${item.slug}` : `/product/${item.productId}`}
                            onClick={closeDrawer}
                            className="font-serif text-sm font-medium leading-snug text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)] line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-error)]"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.size && item.color && <span>•</span>}
                          {item.color && <span>{item.color}</span>}
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, (item.quantity || 1) - 1)}
                            className="flex h-7 w-7 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-xs font-medium text-[var(--color-text)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, (item.quantity || 1) + 1)}
                            className="flex h-7 w-7 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          ₹{((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[var(--color-text)]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--color-accent-light)] hover:shadow-md"
                  >
                    Proceed to Checkout
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleViewCart}
                    className="w-full rounded-full border border-[var(--color-border)] py-3 text-xs font-medium tracking-wider text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-muted)]"
                  >
                    View Bag
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
