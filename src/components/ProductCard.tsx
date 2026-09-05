"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
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
  featured?: boolean;
  isNewArrival?: boolean;
}

interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
  eager?: boolean;
}

export default function ProductCard({
  product,
  eager = false,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [quickAdding, setQuickAdding] = useState(false);

  const addToast = useToastStore((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  const price = Number(product.price) || 0;
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : undefined;
  const imageList = product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : [];
  const primaryImage = imageList[0] || "";
  const secondaryImage = imageList[1] || primaryImage;
  const href = `/product/${product.slug || product._id}`;
  const inWishlist = isInWishlist(product._id);
  const defaultSize = product.sizes?.[0] || "";
  const defaultColor = product.colors?.[0]?.name || "";
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;

  // Determine badge
  let badgeText: string | null = null;
  if (outOfStock) {
    badgeText = "SOLD OUT";
  } else if (oldPrice && oldPrice > price) {
    badgeText = "SALE";
  } else if (product.isNewArrival) {
    badgeText = "NEW";
  } else if (product.featured) {
    badgeText = "BESTSELLER";
  }

  const handleQuickAdd = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (outOfStock || quickAdding) return;

      setQuickAdding(true);
      const success = await addItem(product._id, defaultSize, defaultColor, 1);
      setQuickAdding(false);

      if (success) {
        addToast(`${product.name} added to bag`, "success");
      } else {
        addToast("Please choose your size on product page", "info");
      }
    },
    [product, defaultSize, defaultColor, outOfStock, quickAdding, addItem, addToast]
  );

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(product._id, {
        name: product.name,
        price,
        image: primaryImage,
        slug: product.slug,
      });
      addToast(
        inWishlist ? `Removed from wishlist` : `Added to wishlist`,
        "info"
      );
    },
    [product, price, primaryImage, inWishlist, toggleWishlist, addToast]
  );

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-[var(--color-border)]/60 bg-[var(--color-bg-muted)]">
        <Link href={href} className="block h-full w-full" tabIndex={-1}>
          {primaryImage ? (
            <>
              {/* Primary Image */}
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                priority={eager}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
                  hovered && secondaryImage && secondaryImage !== primaryImage
                    ? "opacity-0"
                    : "opacity-100"
                }`}
              />

              {/* Secondary Image on Hover */}
              {secondaryImage && secondaryImage !== primaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} alternate angle`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
                    hovered ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)]">
              No Image
            </div>
          )}
        </Link>

        {/* Subtle Badge */}
        {badgeText && (
          <div className="absolute left-2.5 top-2.5 pointer-events-none">
            <span
              className={`inline-block rounded-xs px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase backdrop-blur-xs ${
                badgeText === "SALE"
                  ? "bg-[var(--color-bg)]/90 text-[var(--color-error)] border border-[var(--color-border)]"
                  : badgeText === "SOLD OUT"
                  ? "bg-[var(--color-bg)]/90 text-[var(--color-text-muted)] border border-[var(--color-border)]"
                  : "bg-[var(--color-bg)]/90 text-[var(--color-accent)] border border-[var(--color-border)]"
              }`}
            >
              {badgeText}
            </span>
          </div>
        )}

        {/* Wishlist Button (Top Right) */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-xs border transition-all hover:scale-110 active:scale-95 ${
            inWishlist
              ? "bg-red-50 border-red-200 text-red-500 shadow-xs"
              : "bg-[var(--color-bg)]/85 border-[var(--color-border)]/60 text-[var(--color-text)] hover:text-red-500"
          }`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={15}
            className={`transition-colors duration-200 ${
              inWishlist ? "fill-red-500 text-red-500" : "text-[var(--color-text)]"
            }`}
          />
        </button>

        {/* Quick Add Bar (Slide-Up on Hover) */}
        {!outOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-2.5 transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={quickAdding}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-bg)]/95 backdrop-blur-md border border-[var(--color-border)] text-xs font-medium tracking-wider uppercase text-[var(--color-text)] transition-colors hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] shadow-xs"
            >
              <ShoppingBag size={13} />
              <span>{quickAdding ? "Adding..." : "Quick Add"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Details Below Image */}
      <div className="mt-3 flex flex-col space-y-1">
        {/* Name */}
        <Link href={href} className="group-hover:text-[var(--color-accent)] transition-colors">
          <h3 className="font-serif text-sm font-medium leading-snug text-[var(--color-text)] truncate">
            {product.name}
          </h3>
        </Link>

        {/* Category */}
        <p className="text-xs text-[var(--color-text-muted)]">
          {product.category
            ? `${product.category.charAt(0) + product.category.slice(1).toLowerCase()}'s Collection`
            : "Heritage Wear"}
        </p>

        {/* Price & Colors */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {oldPrice && oldPrice > price && (
              <span className="text-xs text-[var(--color-text-muted)] line-through">
                ₹{oldPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Color Dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1" aria-label="Available colors">
              {product.colors.slice(0, 3).map((col, cIdx) => (
                <span
                  key={cIdx}
                  title={col.name}
                  className="h-2 w-2 rounded-full border border-[var(--color-border)]"
                  style={{ backgroundColor: col.hex || "#2D4A6B" }}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[9px] text-[var(--color-text-muted)]">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
