"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  PackageOpen,
  RefreshCcw,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store";
import { useToastStore } from "@/lib/toast-store";

type WishlistItemWithDiscount = WishlistItem & { oldPrice?: number };

const formatPrice = (value: number) =>
  `₹${Number(value).toLocaleString("en-IN")}`;

function discountPercent(oldPrice?: number, price?: number): number | null {
  if (!oldPrice || !price || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function WishlistSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass-card overflow-hidden">
          <div className="skeleton aspect-[4/5] rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton mt-2 h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
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
          <Heart size={28} className="text-[var(--color-primary-light)]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
          Please login to view your wishlist
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
          Your saved divine pieces are waiting for you. Sign in to see the
          styles you&apos;ve loved.
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

function EmptyWishlist() {
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
          Your wishlist is empty
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
          You haven&apos;t saved anything yet. Tap the heart on any product to
          add it to your wishlist.
        </p>
        <Link href="/shop" className="btn btn-primary mt-7 inline-flex">
          Shop Now
          <ArrowRight size={16} />
        </Link>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Error state                                                         */
/* ------------------------------------------------------------------ */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="relative mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full p-10 sm:p-14"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
          <RefreshCcw size={26} className="text-[var(--color-primary-light)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Couldn&apos;t load your wishlist
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
          Something went wrong while fetching your saved pieces. Please try
          again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-primary mt-7 inline-flex"
        >
          <RefreshCcw size={15} />
          Retry
        </button>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Wishlist card                                                       */
/* ------------------------------------------------------------------ */

function WishlistCard({
  item,
  onRemove,
  onMoveToCart,
  busy,
}: {
  item: WishlistItemWithDiscount;
  onRemove: () => void;
  onMoveToCart: () => void;
  busy: "remove" | "move" | null;
}) {
  const price = Number(item.price) || 0;
  const oldPrice = item.oldPrice ? Number(item.oldPrice) : undefined;
  const discount = discountPercent(oldPrice, price);
  const outOfStock = typeof item.stock === "number" && item.stock <= 0;
  const removeBusy = busy === "remove" || busy === "move";
  const moveBusy = busy === "move";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card group relative overflow-hidden"
    >
      {/* Image */}
      <Link
        href={`/product/${item.slug || item.productId}`}
        className="relative block aspect-[4/5] overflow-hidden"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
            <span className="text-xs text-[var(--color-text-muted)]">No image</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />

        {discount && (
          <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
            -{discount}%
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <Link
          href={`/product/${item.slug || item.productId}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-light)]"
        >
          {item.name}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-[var(--color-text)]">
            {formatPrice(price)}
          </span>
          {oldPrice && oldPrice > price && (
            <span className="text-sm text-[var(--color-text-muted)] line-through">
              {formatPrice(oldPrice)}
            </span>
          )}
        </div>

        <span
          className={`text-[11px] font-medium ${
            outOfStock
              ? "text-[var(--color-secondary)]"
              : typeof item.stock === "number" && item.stock <= 10
                ? "text-amber-400"
                : "text-emerald-400"
          }`}
        >
          {outOfStock
            ? "Out of stock"
            : typeof item.stock === "number" && item.stock <= 10
              ? "Only few left"
              : "In stock"}
        </span>

        <div className="mt-1 flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={onMoveToCart}
            disabled={outOfStock || busy !== null}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-300 ${
              outOfStock
                ? "cursor-not-allowed bg-white/5 text-[var(--color-text-muted)]"
                : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/40"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {moveBusy ? (
              <LoaderIcon />
            ) : (
              <ShoppingBag size={14} />
            )}
            {moveBusy ? "Moving…" : "Move to Cart"}
          </motion.button>

          <button
            type="button"
            onClick={onRemove}
            disabled={busy !== null}
            aria-label={`Remove ${item.name} from wishlist`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <motion.span
              key={removeBusy ? "busy" : "idle"}
              initial={removeBusy ? { scale: 0.4 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="flex items-center justify-center"
            >
              <Heart
                size={17}
                fill={removeBusy ? "transparent" : "#ec4899"}
                color={removeBusy ? "currentColor" : "#ec4899"}
              />
            </motion.span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LoaderIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function WishlistPage() {
  const addToast = useToastStore((s) => s.addToast);

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const items = useWishlistStore((s) => s.items);
  const wishlistLoading = useWishlistStore((s) => s.loading);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  const addItem = useCartStore((s) => s.addItem);

  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"remove" | "move" | null>(null);

  useEffect(() => {
    if (!initialized || !user) return;
    let active = true;
    fetchWishlist()
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setError(false);
      });
    return () => {
      active = false;
    };
  }, [fetchWishlist, user, initialized, refreshKey]);

  const itemsWithDiscount = useMemo<WishlistItemWithDiscount[]>(
    () => items as WishlistItemWithDiscount[],
    [items],
  );

  const handleRetry = useCallback(() => {
    setError(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleRemove = useCallback(
    async (item: WishlistItem) => {
      setBusyId(item.productId);
      setBusyAction("remove");
      const ok = await toggleWishlist(item.productId);
      if (ok) addToast(`${item.name} removed from wishlist`, "success");
      else addToast("Could not remove item", "error");
      setBusyId(null);
      setBusyAction(null);
    },
    [toggleWishlist, addToast],
  );

  const handleMoveToCart = useCallback(
    async (item: WishlistItem) => {
      setBusyId(item.productId);
      setBusyAction("move");

      const moved = await addItem(item.productId, "", "", 1);
      if (moved) {
        const removed = await toggleWishlist(item.productId);
        if (removed) {
          addToast(`${item.name} moved to cart`, "success");
        } else {
          addToast(`${item.name} added to cart`, "success");
        }
      } else {
        addToast("Could not add to cart", "error");
      }

      setBusyId(null);
      setBusyAction(null);
    },
    [addItem, toggleWishlist, addToast],
  );

  /* Auth gating */
  if (!initialized || (initialized && user && wishlistLoading && items.length === 0)) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
            <Heart size={13} />
            Saved pieces
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)] sm:text-4xl">
            Wishlist
          </h1>
        </div>
        <WishlistSkeleton />
      </div>
    );
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
            <Heart size={13} />
            Saved pieces
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)] sm:text-4xl">
            Your Wishlist
            {items.length > 0 && (
              <span className="ml-3 align-middle text-sm font-semibold text-[var(--color-text-muted)]">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            )}
          </h1>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-light)] transition-colors hover:border-[var(--color-primary-light)]/40 hover:bg-white/10"
        >
          <ShoppingBag size={15} />
          Shop more
        </Link>
      </div>

      {error ? (
        <ErrorState onRetry={handleRetry} />
      ) : items.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <>
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {itemsWithDiscount.map((item) => (
                <WishlistCard
                  key={item.productId}
                  item={item}
                  busy={busyId === item.productId ? busyAction : null}
                  onRemove={() => handleRemove(item)}
                  onMoveToCart={() => handleMoveToCart(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <div className="mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
            >
              <ArrowLeft size={15} />
              Continue shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
