"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Trash2,
  LoaderCircle,
  PackageOpen,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store";
import { useToastStore } from "@/lib/toast-store";

type WishlistItemWithDiscount = WishlistItem & { oldPrice?: number };

const formatPrice = (value: number) =>
  `₹${Number(value).toLocaleString("en-IN")}`;

export default function WishlistPage() {
  const addToast = useToastStore((s) => s.addToast);

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const items = useWishlistStore((s) => s.items);
  const wishlistLoading = useWishlistStore((s) => s.loading);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const addItemToCart = useCartStore((s) => s.addItem);

  const [movingId, setMovingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && user) {
      fetchWishlist();
    }
  }, [initialized, user, fetchWishlist]);

  const handleMoveToCart = async (item: WishlistItemWithDiscount) => {
    setMovingId(item.productId);
    try {
      await addItemToCart(item.productId, "M", "Standard", 1);
      await removeFromWishlist(item.productId);
      addToast("Moved to your shopping bag", "success");
    } catch {
      addToast("Failed to move piece to bag", "error");
    } finally {
      setMovingId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      addToast("Removed from wishlist", "info");
    } catch {
      addToast("Failed to remove piece", "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-28 text-[#171717]">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F1EA] text-[#171717]">
            <Heart size={28} strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-2xl font-light text-[#171717] sm:text-3xl">
            Saved Pieces
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#666666]">
            Sign in to sync your saved items across devices and receive private
            notices when your desired pieces become available.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login?redirect=/wishlist"
              className="inline-flex items-center justify-center bg-[#171717] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2D4A6B]"
            >
              Sign In
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center border border-[#E7E3DC] bg-white px-8 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[#171717] hover:border-[#171717]"
            >
              Explore Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-24 text-[#171717]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E7E3DC] pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
              Personal Curation
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light tracking-tight text-[#171717] sm:text-4xl">
              Saved Pieces ({items.length})
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[#666666] hover:text-[#171717]"
          >
            Continue Shopping →
          </Link>
        </div>

        {/* Loading state */}
        {wishlistLoading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[3/4] w-full rounded-sm bg-[#F4F1EA]" />
                <div className="h-4 w-3/4 rounded bg-[#F4F1EA]" />
                <div className="h-3 w-1/2 rounded bg-[#F4F1EA]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F1EA] text-[#666666]">
              <PackageOpen size={28} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-light text-[#171717]">
              Your wishlist is waiting
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#666666]">
              Browse the latest arrivals and touch the heart symbol on any piece
              to preserve it in your personal collection.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 bg-[#171717] px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2D4A6B]"
            >
              Discover Collection
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const moving = movingId === item.productId;
              const removing = removingId === item.productId;
              const outOfStock =
                typeof item.stock === "number" && item.stock <= 0;

              return (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative flex flex-col justify-between rounded-sm border border-[#E7E3DC] bg-white transition-shadow hover:shadow-sm"
                >
                  {/* Image container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF9F6]">
                    <Link href={`/product/${item.slug || item.productId}`}>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#999999]">
                          Radha Rani
                        </div>
                      )}
                    </Link>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.productId)}
                      disabled={removing}
                      aria-label="Remove item"
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#666666] shadow-sm backdrop-blur-sm transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      {removing ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>

                    {outOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <span className="rounded-sm bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#171717]">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <Link
                        href={`/product/${item.slug || item.productId}`}
                        className="line-clamp-1 text-xs font-semibold text-[#171717] hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs font-medium text-[#171717]">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToCart(item)}
                      disabled={outOfStock || moving}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 border border-[#171717] py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#171717] transition-colors hover:bg-[#171717] hover:text-white disabled:border-[#E7E3DC] disabled:text-[#999999] disabled:hover:bg-transparent"
                    >
                      {moving ? (
                        <>
                          <LoaderCircle size={13} className="animate-spin" />
                          Moving…
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={13} />
                          Move to Bag
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
