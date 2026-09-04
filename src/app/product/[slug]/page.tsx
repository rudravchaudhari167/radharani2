"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Box,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Rotate3d,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";
import ProductViewer3D from "@/components/ProductViewer3D";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useToastStore } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ProductParams = Promise<{ slug: string }>;

interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  category?: string;
  subcategory?: string;
  images: string[];
  model3D?: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  sku?: string;
  rating: number;
  reviewCount: number;
  tags?: string[];
}

interface Review {
  _id: string;
  userId?: { _id: string; name: string } | null;
  rating: number;
  comment: string;
  createdAt?: string;
}

type TabId = "description" | "reviews" | "details";

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "reviews", label: "Reviews" },
  { id: "details", label: "Details & Care" },
];

const formatPrice = (value: number) =>
  `₹${Number(value).toLocaleString("en-IN")}`;

function discountPercent(oldPrice?: number, price?: number): number | null {
  if (!oldPrice || !price || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/* ------------------------------------------------------------------ */
/* Star rating                                                         */
/* ------------------------------------------------------------------ */

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const rounded = Math.round(Math.max(0, Math.min(5, rating)));
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={index < rounded ? "text-amber-400" : "text-white/15"}
          fill={index < rounded ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="skeleton mb-8 h-4 w-56" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="glass-card overflow-hidden">
          <div className="skeleton aspect-[4/5] rounded-none" />
        </div>
        <div className="space-y-5">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-9 w-3/4" />
          <div className="skeleton h-4 w-32" />
          <div className="flex items-end gap-3">
            <div className="skeleton h-9 w-28" />
            <div className="skeleton h-6 w-20" />
          </div>
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-40" />
        </div>
      </div>
      <div className="mt-20">
        <div className="skeleton mb-8 h-6 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-card overflow-hidden">
              <div className="skeleton aspect-[4/5] rounded-none" />
              <div className="p-4">
                <div className="skeleton mb-2 h-4 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function ProductPageInner({ params }: { params: ProductParams }) {
  const { slug } = use(params);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const addToast = useToastStore((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [show3D, setShow3D] = useState(false);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
      setReviews([]);
      setRelated([]);
      setSelectedColor(null);
      setSelectedSize(null);
      setQuantity(1);
      setActiveImage(0);
      setShow3D(false);

      try {
        const res = await fetch(
          `/api/products/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load product");
        const data = (await res.json()) as { product?: ProductDetail };
        if (!active || !data.product) {
          if (active) setNotFound(true);
          return;
        }

        setProduct(data.product);
        setSelectedColor(data.product.colors?.[0]?.name ?? null);
        setSelectedSize(data.product.sizes?.[0] ?? null);

        // Reviews (the reviews endpoint indexes by Mongo ObjectId)
        if (data.product._id) {
          fetch(
            `/api/products/${data.product._id}/reviews`,
            { cache: "no-store" }
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (active) setReviews((d?.reviews ?? []).slice(0, 6));
            })
            .catch(() => undefined);
        }

        // Related products from the same category
        if (data.product.category) {
          fetch(
            `/api/products?category=${encodeURIComponent(
              data.product.category
            )}&limit=8&sort=popular`,
            { cache: "no-store" }
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (!active) return;
              const items = (d?.products ?? []) as ProductCardProduct[];
              setRelated(
                items.filter((p) => p._id !== data.product!._id).slice(0, 4)
              );
            })
            .catch(() => undefined);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const resolveLogin = useCallback(() => {
    addToast("Please login to get started", "info");
    router.push("/login");
  }, [addToast, router]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    if (!user) {
      resolveLogin();
      return;
    }
    if ((product.sizes?.length ?? 0) > 0 && !selectedSize) {
      addToast("Please select a size", "error");
      return;
    }
    if (typeof product.stock === "number" && product.stock <= 0) {
      addToast("This product is out of stock", "error");
      return;
    }

    setAdding(true);
    const ok = await addItem(
      product._id,
      selectedSize ?? "",
      selectedColor ?? "",
      quantity
    );
    setAdding(false);

    if (ok) addToast(`${product.name} added to cart`, "success");
    else addToast("Could not add to cart", "error");
  }, [product, user, selectedSize, selectedColor, quantity, addItem, addToast, resolveLogin]);

  const handleBuyNow = useCallback(async () => {
    if (!product) return;
    if (!user) {
      resolveLogin();
      return;
    }
    if ((product.sizes?.length ?? 0) > 0 && !selectedSize) {
      addToast("Please select a size", "error");
      return;
    }
    if (typeof product.stock === "number" && product.stock <= 0) {
      addToast("This product is out of stock", "error");
      return;
    }

    setBuying(true);
    const ok = await addItem(
      product._id,
      selectedSize ?? "",
      selectedColor ?? "",
      quantity
    );
    setBuying(false);

    if (ok) {
      addToast("Redirecting to checkout…", "success");
      router.push("/checkout");
    } else {
      addToast("Could not process order", "error");
    }
  }, [product, user, selectedSize, selectedColor, quantity, addItem, addToast, resolveLogin, router]);

  const handleWishlist = useCallback(async () => {
    if (!product) return;
    if (!user) {
      resolveLogin();
      return;
    }
    const ok = await toggleWishlist(product._id, {
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? "",
      slug: product.slug,
      stock: product.stock,
    });
    if (ok) {
      addToast(
        isInWishlist(product._id)
          ? "Removed from wishlist"
          : "Added to wishlist",
        "success"
      );
    } else {
      addToast("Could not update wishlist", "error");
    }
  }, [product, user, toggleWishlist, isInWishlist, addToast, resolveLogin]);

  /* ------------------------------------------------------------------ */

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (notFound || !product) {
    return (
      <section className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card w-full p-10 sm:p-14"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
            <Package size={30} className="text-[var(--color-primary-light)]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
            Product not found
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
            The divine piece you&apos;re looking for may have been sold out or
            no longer exists. Explore our full collection instead.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-primary">
              <ShoppingBag size={16} />
              Back to Shop
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-ghost"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>
        </motion.div>
      </section>
    );
  }

  const images = product.images?.length ? product.images : [""];
  const price = Number(product.price) || 0;
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : undefined;
  const discount = discountPercent(oldPrice, price);
  const rating = Number(product.rating) || 0;
  const reviewCount = reviews.length || Number(product.reviewCount) || 0;
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  const lowStock =
    !outOfStock && typeof product.stock === "number" && product.stock <= 10;
  const currentImage = images[activeImage] || images[0];
  const inWishlist = isInWishlist(product._id);

  const reviewsCount = (stars: number) =>
    reviews.filter((r) => Math.round(r.rating) === stars).length;

  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]"
      >
        <Link href="/" className="transition-colors hover:text-[var(--color-text)]">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="transition-colors hover:text-[var(--color-text)]">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link
              href={`/shop/${product.category.toLowerCase()}`}
              className="uppercase transition-colors hover:text-[var(--color-text)]"
            >
              {product.category}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="truncate text-[var(--color-text)]">
          {product.name}
        </span>
      </motion.nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* ------------------------- Gallery ------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass-card relative overflow-hidden">
            <div className="relative aspect-[4/5]">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    No image available
                  </span>
                </div>
              )}

              {/* Top gradient */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />

              {/* Sale badge */}
              {discount && (
                <div className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white shadow-lg">
                  -{discount}%
                </div>
              )}

              {/* Stock badge */}
              <div className="absolute right-4 top-4">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                    outOfStock
                      ? "border-red-400/40 bg-red-500/20 text-red-300"
                      : lowStock
                        ? "border-amber-400/40 bg-amber-500/20 text-amber-300"
                        : "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {outOfStock ? "Out of stock" : lowStock ? "Only few left" : "In stock"}
                </span>
              </div>

              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                  <span className="rounded-full border border-white/20 bg-black/60 px-5 py-2 text-sm font-bold uppercase tracking-widest text-white">
                    Out of stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 border-t border-[var(--color-border)] bg-black/20 p-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${
                      activeImage === index
                        ? "border-[var(--color-primary-light)] ring-2 ring-[var(--color-primary)]/40"
                        : "border-[var(--color-border)] opacity-60 hover:opacity-100"
                    }`}
                  >
                    {image && (
                      <Image
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ------------------------ Details -------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          {/* Category badge */}
          {product.category && (
            <div className="flex items-center gap-3">
              <Link
                href={`/shop/${product.category.toLowerCase()}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-light)] transition-colors hover:border-[var(--color-primary-light)]/50"
              >
                <Sparkles size={12} />
                {product.category}
              </Link>
              {product.subcategory && (
                <span className="text-xs capitalize text-[var(--color-text-muted)]">
                  {product.subcategory}
                </span>
              )}
            </div>
          )}

          {/* Name */}
          <h1 className="text-3xl font-black leading-tight tracking-tight text-[var(--color-text)] sm:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <Stars rating={rating} />
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              ({reviewCount} review{reviewCount === 1 ? "" : "s"})
            </span>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-4xl font-black tracking-tight text-[var(--color-text)]">
              {formatPrice(price)}
            </span>
            {oldPrice && oldPrice > price && (
              <>
                <span className="text-lg text-[var(--color-text-muted)] line-through">
                  {formatPrice(oldPrice)}
                </span>
                <span className="mb-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-sm font-bold text-emerald-400">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  Colour
                </span>
                <span className="text-xs capitalize text-[var(--color-text-muted)]">
                  {selectedColor ?? "Select a colour"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  const selected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      aria-label={`Select colour ${color.name}`}
                      aria-pressed={selected}
                      title={color.name}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                        selected
                          ? "ring-2 ring-[var(--color-primary-light)] ring-offset-2 ring-offset-[var(--color-bg)]"
                          : "ring-1 ring-white/15 hover:scale-110"
                      }`}
                      style={{ backgroundColor: color.hex || "#ffffff" }}
                    >
                      {selected && (
                        <AnimatePresence>
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex h-3 w-3 items-center justify-center rounded-full bg-white/80"
                          />
                        </AnimatePresence>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  Size
                </span>
                <span className="text-xs uppercase text-[var(--color-text-muted)]">
                  {selectedSize ?? "Select a size"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => {
                  const selected = selectedSize === size;
                  return (
                    <motion.button
                      key={size}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selected}
                      className={`min-w-12 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                        selected
                          ? "border-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.6)]"
                          : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:border-white/25 hover:text-[var(--color-text)]"
                      }`}
                    >
                      {size}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-6">
            <div>
              <span className="mb-3 block text-sm font-semibold text-[var(--color-text)]">
                Quantity
              </span>
              <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-white/5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm font-bold text-[var(--color-text)]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(
                        outOfStock ? q : Number(product.stock) || q,
                        q + 1
                      )
                    )
                  }
                  disabled={!outOfStock && quantity >= Number(product.stock)}
                  className="flex h-11 w-11 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="mt-5">
              <span
                className={`flex items-center gap-2 text-sm font-semibold ${
                  outOfStock
                    ? "text-red-400"
                    : lowStock
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                </span>
                {outOfStock
                  ? "Out of Stock"
                  : `In Stock (${product.stock} available)`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="btn btn-primary h-14 w-full rounded-2xl text-base font-bold"
            >
              {adding ? (
                "Adding…"
              ) : (
                <>
                  <ShoppingBag size={18} />
                  ADD TO CART
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleBuyNow}
              disabled={outOfStock || buying}
              className="h-14 w-full rounded-2xl border border-[var(--color-primary-light)]/40 bg-gradient-to-r from-[var(--color-primary)]/15 to-[var(--color-secondary)]/10 text-base font-bold text-[var(--color-primary-light)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-primary-light)] hover:bg-white/10 hover:shadow-[0_0_30px_-8px_rgba(124,58,237,0.7)] disabled:opacity-50"
            >
              {buying ? "Processing…" : (
                <>
                  <Zap size={18} />
                  BUY NOW
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleWishlist}
              className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white/5 text-sm font-semibold text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-secondary)]/50 hover:text-[var(--color-text)]"
            >
              <motion.span
                key={inWishlist ? "wishful" : "wishless"}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="flex items-center"
              >
                <Heart
                  size={17}
                  className={
                    inWishlist
                      ? "text-[var(--color-secondary)]"
                      : "text-[var(--color-text-muted)] group-hover:text-[var(--color-secondary)]"
                  }
                  fill={inWishlist ? "currentColor" : "none"}
                />
              </motion.span>
              {inWishlist ? "Remove from wishlist" : "ADD TO WISHLIST"}
            </button>
          </div>

          {/* Delivery info */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent">
                <Truck size={18} className="text-[var(--color-primary-light)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text)]">
                  Free delivery
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  above ₹1999
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-secondary)]/20 to-transparent">
                <Zap size={18} className="text-[var(--color-secondary)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text)]">
                  Ships in 24 hours
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  fast dispatch
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent)]/20 to-transparent">
                <RefreshCw size={18} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text)]">
                  7-day easy returns
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  no questions asked
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ------------------------- Tabs ------------------------------ */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mt-20"
      >
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-selected={selected}
                role="tab"
                className={`relative whitespace-nowrap px-5 py-3.5 text-sm font-semibold transition-colors ${
                  selected
                    ? "text-[var(--color-primary-light)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      layoutId="product-tab-underline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-x-2 -bottom-px h-0.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                    />
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <div className="pt-8" role="tabpanel">
          <AnimatePresence mode="wait">
            {activeTab === "description" && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl space-y-4"
              >
                <p className="text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                  {product.description || "No description available for this piece."}
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Woven with devotion, every Radha Rani piece celebrates the timeless
                  bond between Radha and Krishna — thoughtfully crafted, ethically
                  produced, and made to be loved for years, not seasons.
                </p>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="grid gap-10 lg:grid-cols-[320px_1fr]"
              >
                {/* Rating summary */}
                <div className="glass-card h-fit p-6">
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-black text-[var(--color-text)]">
                      {rating.toFixed(1)}
                    </span>
                    <span className="pb-1 text-sm text-[var(--color-text-muted)]">
                      {reviewCount} review{reviewCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Stars rating={rating} size={20} />
                  </div>

                  <div className="mt-6 space-y-2.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviewsCount(stars);
                      const width =
                        reviews.length === 0 ? 0 : (count / reviews.length) * 100;
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="flex w-9 items-center gap-1 font-medium text-[var(--color-text-muted)]">
                            {stars}
                            <Star size={11} className="text-amber-400" fill="currentColor" />
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${width}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                            />
                          </div>
                          <span className="w-6 text-right text-[var(--color-text-muted)]">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <p className="text-sm text-[var(--color-text-muted)]">
                        No reviews yet. Be the first to share your experience with
                        this divine piece.
                      </p>
                    </div>
                  ) : (
                    reviews.map((review, index) => (
                      <motion.article
                        key={review._id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.4, delay: index * 0.06 }}
                        className="glass-card p-5"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-xs font-bold text-white">
                              {(review.userId?.name || "V").charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text)]">
                                {review.userId?.name || "Verified buyer"}
                              </p>
                              {review.createdAt && (
                                <p className="text-[11px] text-[var(--color-text-muted)]">
                                  {new Date(review.createdAt).toLocaleDateString(
                                    "en-IN",
                                    { day: "numeric", month: "short", year: "numeric" }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <Stars rating={review.rating} size={13} />
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                          {review.comment}
                        </p>
                      </motion.article>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="grid max-w-4xl gap-8 md:grid-cols-2"
              >
                <div className="glass-card h-fit p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-primary-light)]">
                    <Box size={15} />
                    Product Details
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--color-text-muted)]">SKU</dt>
                      <dd className="font-medium text-[var(--color-text)]">
                        {product.sku || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--color-text-muted)]">Category</dt>
                      <dd className="font-medium text-[var(--color-text)]">
                        {product.category || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--color-text-muted)]">Subcategory</dt>
                      <dd className="font-medium capitalize text-[var(--color-text)]">
                        {product.subcategory || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--color-text-muted)]">Available sizes</dt>
                      <dd className="font-medium text-[var(--color-text)]">
                        {product.sizes.length ? product.sizes.join(", ") : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--color-text-muted)]">Colours</dt>
                      <dd className="font-medium text-right text-[var(--color-text)]">
                        {product.colors.length
                          ? product.colors.map((c) => c.name).join(", ")
                          : "—"}
                      </dd>
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--color-text-muted)]">Tags</dt>
                        <dd className="flex flex-wrap justify-end gap-1.5">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--color-border)] bg-white/5 px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="glass-card h-fit p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-primary-light)]">
                    <ShieldCheck size={15} />
                    Care Instructions
                  </h3>
                  <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
                    <li className="flex gap-3">
                      <span className="text-[var(--color-secondary)]">•</span>
                      Gentle machine wash cold, inside-out with similar colours.
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[var(--color-secondary)]">•</span>
                      Hand wash delicate embroidery &amp; embellished pieces separately.
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[var(--color-secondary)]">•</span>
                      Do not bleach; do not tumble dry. Dry in shade.
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[var(--color-secondary)]">•</span>
                      Warm iron only on the reverse side.
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[var(--color-secondary)]">•</span>
                      Store flat in a cool, dry place away from direct sunlight.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ------------------------- 3D view -------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mt-16"
      >
        <div className="glass-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] p-6">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
                <Rotate3d size={20} className="text-[var(--color-primary-light)]" />
                Experience it in 3D
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Drag, zoom and spin your way around this divine creation.
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setShow3D((v) => !v)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                show3D
                  ? "border-[var(--color-secondary)]/60 bg-gradient-to-r from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20 text-[var(--color-text)]"
                  : "border-[var(--color-primary-light)]/40 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:shadow-[0_0_30px_-6px_rgba(124,58,237,0.8)]"
              }`}
            >
              {show3D ? "Close 3D view" : "View in 3D"}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {show3D && (
              <motion.div
                key="3d"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="h-[480px] sm:h-[560px]">
                  <ProductViewer3D
                    modelUrl={product.model3D || undefined}
                    image={product.images?.[0] || undefined}
                    name={product.name}
                    className="h-full w-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!show3D && (
            <button
              type="button"
              onClick={() => setShow3D(true)}
              className="flex w-full items-center justify-center gap-3 p-10 text-center transition-colors hover:bg-white/[0.02]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
                <motion.span
                  animate={
                    reduceMotion
                      ? undefined
                      : { rotate: [0, 360] }
                  }
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="flex items-center justify-center"
                >
                  <Rotate3d
                    size={26}
                    className="text-[var(--color-primary-light)]"
                  />
                </motion.span>
              </span>
              <span className="text-sm font-semibold text-[var(--color-text)]">
                Turn the page into a sculpture —{" "}
                <span className="text-[var(--color-primary-light)]">
                  tap to view 3D
                </span>
              </span>
            </button>
          )}
        </div>
      </motion.section>

      {/* -------------------- Related products ---------------------- */}
      {related.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
                <Sparkles size={13} />
                You may also adore
              </p>
              <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)] sm:text-3xl">
                Complete the Collection
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:bg-white/10 sm:inline-flex"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {related.map((productItem, index) => (
              <ProductCard key={productItem._id} product={productItem} index={index} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

export default function ProductPage({ params }: { params: ProductParams }) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductPageInner params={params} />
    </Suspense>
  );
}