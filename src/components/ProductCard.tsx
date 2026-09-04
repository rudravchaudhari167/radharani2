"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";

export interface ProductCardProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  images?: string[];
  image?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  category?: string;
}

interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
  eager?: boolean;
}

function discountPercent(old?: number, price?: number): number | null {
  if (!old || !price || old <= price) return null;
  return Math.round(((old - price) / old) * 100);
}

export default function ProductCard({
  product,
  index = 0,
  eager = false,
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [quickView, setQuickView] = useState(false);

  const addToast = useToastStore((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  const price = Number(product.price) || 0;
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : undefined;
  const discount = discountPercent(oldPrice, price);
  const imageSrc = product.images?.[0] || product.image || "";
  const href = `/product/${product.slug || product._id}`;
  const defaultSize = product.sizes?.[0] || "";
  const defaultColor = product.colors?.[0]?.name || "";
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  const inWishlist = isInWishlist(product._id);

  /* 3D tilt ---------------------------------------------------------- */
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sy = useSpring(ry, { stiffness: 200, damping: 20 });
  const glareX = useTransform(sx, [-12, 12], ["40%", "60%"]);
  const glareY = useTransform(sy, [-12, 12], ["30%", "70%"]);
  const glare = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.18), transparent 60%)`,
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      ry.set(px * 14);
      rx.set(-py * 14);
    },
    [rx, ry],
  );

  const handleLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  /* actions ---------------------------------------------------------- */
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (outOfStock) return;
      const ok = await addItem(product._id, defaultSize, defaultColor, 1);
      if (ok) {
        setAdded(true);
        addToast(`${product.name} added to cart`, "success");
        setTimeout(() => setAdded(false), 1400);
      } else {
        addToast("Could not add to cart", "error");
      }
    },
    [addItem, addToast, product._id, product.name, defaultSize, defaultColor, outOfStock],
  );

  const handleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await toggleWishlist(product._id, {
        name: product.name,
        price,
        image: imageSrc,
        slug: product.slug,
        stock: product.stock,
      });
      if (ok) {
        addToast(
          isInWishlist(product._id) ? "Removed from wishlist" : "Added to wishlist",
          "success",
        );
      }
    },
    [toggleWishlist, isInWishlist, product, price, imageSrc, addToast],
  );

  const progressColor =
    typeof product.stock === "number" && product.stock <= 10
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ perspective: 1200 }}
        className="relative"
      >
        <motion.div
          style={{ rotateX: sx, rotateY: sy, transformStyle: "preserve-3d" }}
          className="glass-card relative overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_40px_-8px_rgba(124,58,237,0.55)]"
        >
          {/* Glare */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glare }}
          />

          {/* Image */}
          <Link href={href} className="relative block aspect-[4/5] overflow-hidden">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                priority={eager || index < 2}
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
                <span className="text-xs text-[var(--color-text-muted)]">No image</span>
              </div>
            )}

            {/* Top gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />

            {/* Discount badge */}
            {discount && (
              <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
                -{discount}%
              </div>
            )}

            {/* Category tag */}
            {product.category && (
              <div className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                {product.category}
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

          {/* Wishlist button */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/60"
          >
            <motion.span
              key={inWishlist ? "filled" : "outline"}
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="flex items-center justify-center"
            >
              <Heart
                size={17}
                fill={inWishlist ? "#ec4899" : "transparent"}
                color={inWishlist ? "#ec4899" : "currentColor"}
              />
            </motion.span>
          </button>

          {/* Quick view overlay */}
          <div
            className={`pointer-events-none absolute inset-x-3 bottom-[4.5rem] z-10 flex justify-center transition-all duration-300 ${
              quickView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <button
              type="button"
              onMouseEnter={() => setQuickView(true)}
              onMouseLeave={() => setQuickView(false)}
              onClick={(e) => {
                e.preventDefault();
                addToast("Quick view coming soon", "info");
              }}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
            >
              <Eye size={14} />
              Quick view
            </button>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 p-4">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-light)]">
              <Link href={href}>{product.name}</Link>
            </h3>

            {/* Rating */}
            {typeof product.rating === "number" && product.rating > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Star size={12} fill="currentColor" />
                  <span className="font-semibold text-[var(--color-text)]">
                    {product.rating.toFixed(1)}
                  </span>
                </span>
                <span className="text-[var(--color-text-muted)]">
                  ({product.reviewCount ?? 0})
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[var(--color-text)]">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {oldPrice && oldPrice > price && (
                <span className="text-sm text-[var(--color-text-muted)] line-through">
                  ₹{oldPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Stock / add to cart */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={`text-[11px] font-medium ${progressColor}`}>
                {typeof product.stock === "number" && product.stock > 0
                  ? product.stock <= 10
                    ? "Only few left"
                    : "In stock"
                  : outOfStock
                    ? "Out of stock"
                    : "In stock"}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  outOfStock
                    ? "cursor-not-allowed bg-white/5 text-[var(--color-text-muted)]"
                    : added
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/40"
                }`}
              >
                <ShoppingBag size={13} />
                {added ? "Added" : "Add"}
              </motion.button>
            </div>
          </div>

          {/* Glow border on hover */}
          <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.4)" }} />
        </motion.div>
      </div>
    </motion.div>
  );
}
