"use client";

import { Suspense, use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  RotateCcw,
  Sparkles,
  Box,
  X,
  Check,
} from "lucide-react";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";
import ProductViewer3D from "@/components/ProductViewer3D";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useToastStore } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/store";

type ProductParams = Promise<{ slug: string }>;

interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  featured?: boolean;
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

function discountPercent(oldPrice?: number, price?: number): number | null {
  if (!oldPrice || !price || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function ProductSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-48 skeleton rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-3 w-20">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] w-20 skeleton rounded-md" />
            ))}
          </div>
          <div className="flex-1 aspect-[3/4] skeleton rounded-lg" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-4 w-28 skeleton rounded" />
          <div className="h-8 w-3/4 skeleton rounded" />
          <div className="h-6 w-32 skeleton rounded" />
          <div className="h-20 w-full skeleton rounded" />
          <div className="h-12 w-full skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProductPageContent({ params }: { params: ProductParams }) {
  const { slug } = use(params);
  const router = useRouter();

  const addToast = useToastStore((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToBag, setAddingToBag] = useState(false);
  const [show3DModal, setShow3DModal] = useState(false);

  // Delivery pincode state
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "success" | "error">("idle");

  const [activeTab, setActiveTab] = useState<"details" | "story" | "reviews">("details");

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`, { cache: "no-store" });
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!active || !data.product) {
          if (active) setNotFound(true);
          return;
        }

        const p: ProductDetail = data.product;
        setProduct(p);
        setSelectedColor(p.colors?.[0]?.name || null);
        setSelectedSize(p.sizes?.[0] || null);

        // Fetch related products
        if (p.category) {
          fetch(`/api/products?category=${encodeURIComponent(p.category)}&limit=5`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (active && d?.products) {
                setRelated(d.products.filter((item: ProductCardProduct) => item._id !== p._id).slice(0, 4));
              }
            })
            .catch(() => undefined);
        }

        // Fetch reviews
        fetch(`/api/products/${p._id}/reviews`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (active && d?.reviews) {
              setReviews(d.reviews);
            }
          })
          .catch(() => undefined);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      active = false;
    };
  }, [slug]);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      setPincodeStatus("success");
    } else {
      setPincodeStatus("error");
    }
  };

  const handleAddToBag = async () => {
    if (!product) return;
    if (product.stock <= 0) {
      addToast("This item is currently sold out", "info");
      return;
    }

    setAddingToBag(true);
    const chosenSize = selectedSize || product.sizes?.[0] || "";
    const ok = await addItem(
      product._id,
      chosenSize,
      selectedColor || "",
      quantity
    );
    setAddingToBag(false);

    if (ok) {
      addToast(`${product.name} added to bag`, "success");
      openCartDrawer();
    } else {
      addToast("Could not add to bag. Please try again.", "error");
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.stock <= 0) {
      addToast("This item is currently sold out", "info");
      return;
    }

    setAddingToBag(true);
    const chosenSize = selectedSize || product.sizes?.[0] || "";
    const ok = await addItem(
      product._id,
      chosenSize,
      selectedColor || "",
      quantity
    );
    setAddingToBag(false);

    if (ok) {
      router.push("/checkout");
    } else {
      addToast("Could not initiate checkout. Please try again.", "error");
    }
  };

  if (loading) {
    return <ProductSkeleton />;
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-medium text-[var(--color-text)]">
          Product Not Found
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          The silhouette you are seeking is either no longer available or has moved.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white"
        >
          Explore Collection
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [""];
  const currentImage = images[activeImage] || images[0];
  const price = Number(product.price) || 0;
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : undefined;
  const discount = discountPercent(oldPrice, price);
  const inWishlist = useWishlistStore((s) =>
    s.items.some((item) => String(item.productId) === String(product._id))
  );
  const outOfStock = product.stock <= 0;

  return (
    <div className="bg-[var(--color-bg)] py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-text)] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/shop" className="hover:text-[var(--color-text)] transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight size={12} />
              <Link
                href={`/shop/${product.category.toLowerCase()}`}
                className="hover:text-[var(--color-text)] transition-colors uppercase"
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-[var(--color-text)] truncate font-medium">
            {product.name}
          </span>
        </nav>

        {/* Product Grid: Left Gallery, Right Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* ======================================================== */}
          {/* LEFT: Product Image Gallery                                */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnail Column */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] scrollbar-hide shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 w-16 md:h-24 md:w-20 shrink-0 overflow-hidden rounded-md border transition-all ${
                      idx === activeImage
                        ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
                        : "border-[var(--color-border)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} angle ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="relative flex-1 aspect-[3/4] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)]">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center transition-transform duration-500 hover:scale-105"
                />
              ) : null}

              {/* Badges */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {discount && (
                  <span className="rounded-xs bg-[var(--color-bg)]/90 border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[var(--color-error)] backdrop-blur-xs">
                    {discount}% OFF
                  </span>
                )}
                {product.featured && (
                  <span className="rounded-xs bg-[var(--color-bg)]/90 border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[var(--color-accent)] backdrop-blur-xs">
                    BESTSELLER
                  </span>
                )}
              </div>

              {/* Optional 3D Action */}
              <button
                type="button"
                onClick={() => setShow3DModal(true)}
                className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-[var(--color-bg)]/90 border border-[var(--color-border)] px-3.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[var(--color-accent)] backdrop-blur-md shadow-xs transition-transform hover:scale-105"
              >
                <Box size={14} />
                <span>View in 3D</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT: Product Information                                 */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Title & Category */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-accent)]">
                {product.category} COLLECTION
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-text)] mt-1.5 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3 text-xs text-[var(--color-text-muted)]">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.round(product.rating || 5) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span>({product.reviewCount || 12} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-b border-[var(--color-border)] pb-6">
              <span className="text-2xl font-medium text-[var(--color-text)]">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {oldPrice && oldPrice > price && (
                <span className="text-base text-[var(--color-text-muted)] line-through">
                  ₹{oldPrice.toLocaleString("en-IN")}
                </span>
              )}
              {discount && (
                <span className="text-xs font-semibold text-[var(--color-error)]">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm font-light leading-relaxed text-[var(--color-text-muted)]">
              {product.description}
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-2.5">
                  <span className="uppercase tracking-wider">Color: {selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                        selectedColor === c.name
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] font-medium text-[var(--color-accent)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)]"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                {/* Quantity */}
                <div className="flex h-12 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-7 w-7 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-xs font-medium text-[var(--color-text)]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToBag}
                  disabled={addingToBag || outOfStock}
                  className="flex-1 flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition-all hover:bg-[var(--color-accent-light)] disabled:opacity-50"
                >
                  <ShoppingBag size={15} />
                  <span>{outOfStock ? "Sold Out" : addingToBag ? "Adding..." : "Add to Bag"}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => {
                    toggleWishlist(product._id, {
                      name: product.name,
                      price,
                      image: currentImage,
                      slug: product.slug,
                    });
                    addToast(inWishlist ? "Removed from wishlist" : "Added to wishlist", "info");
                  }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all hover:scale-105 active:scale-95 ${
                    inWishlist
                      ? "border-red-200 bg-red-50 text-red-600 shadow-xs"
                      : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] hover:border-red-300 hover:text-red-500"
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart
                    size={18}
                    className={`transition-colors duration-200 ${
                      inWishlist ? "fill-red-500 text-red-500" : "text-[var(--color-text)]"
                    }`}
                  />
                </button>
              </div>

              {/* Buy Now Button */}
              {!outOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full flex h-12 items-center justify-center rounded-full border border-[var(--color-text)] bg-transparent text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)] hover:text-white"
                >
                  Buy Now
                </button>
              )}
            </div>

            {/* Delivery Pincode Checker */}
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
                <Truck size={16} className="text-[var(--color-accent)]" />
                <span>Delivery Information</span>
              </div>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    setPincodeStatus("idle");
                  }}
                  placeholder="Enter 6-digit pincode"
                  className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  type="submit"
                  className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-xs font-medium uppercase tracking-wider text-white hover:bg-[var(--color-accent-light)]"
                >
                  Check
                </button>
              </form>

              {pincodeStatus === "success" && (
                <div className="text-xs text-[var(--color-accent)] font-medium flex items-center gap-1.5">
                  <Check size={14} />
                  <span>Delivery available &bull; Estimated delivery: 3–7 business days</span>
                </div>
              )}
              {pincodeStatus === "error" && (
                <div className="text-xs text-[var(--color-error)]">
                  Please enter a valid 6-digit postal code.
                </div>
              )}
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              <div className="flex flex-col items-center gap-1">
                <Truck size={16} className="text-[var(--color-accent)]" />
                <span>Free shipping above ₹1,999</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={16} className="text-[var(--color-accent)]" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw size={16} className="text-[var(--color-accent)]" />
                <span>7-Day Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Accordion Tabs: Details & Care, Symbolism, Reviews         */}
        {/* ======================================================== */}
        <div className="mt-20 border-t border-[var(--color-border)] pt-12">
          <div className="flex border-b border-[var(--color-border)] mb-8">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors border-b-2 mr-8 ${
                activeTab === "details"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Details & Fabric Care
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("story")}
              className={`pb-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors border-b-2 mr-8 ${
                activeTab === "story"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              The Inspiration
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors border-b-2 ${
                activeTab === "reviews"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {activeTab === "details" && (
            <div className="max-w-2xl text-sm font-light leading-relaxed text-[var(--color-text-muted)] space-y-4">
              <p>
                Crafted with conscious reverence. Each piece undergoes artisanal garment-washing for an ultra-soft drape that breathes gracefully throughout the day.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Material: 100% Breathable Linen-Cotton blend</li>
                <li>Tailoring: Relaxed silhouette with structured collar</li>
                <li>Care: Dry clean recommended or delicate hand wash cold with mild detergent</li>
                <li>Crafted with pride in India</li>
              </ul>
            </div>
          )}

          {activeTab === "story" && (
            <div className="max-w-2xl text-sm font-light leading-relaxed text-[var(--color-text-muted)] space-y-3">
              <p>
                Inspired by the divine beauty of Vrindavan. The subtle motifs woven into this garment echo the divine play of Radha and Krishna—translated through minimalist, contemporary cuts suited for modern worldly grace.
              </p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-2xl space-y-6">
              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Be the first to share your thoughts on this garment.
                </p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="border-b border-[var(--color-border)] pb-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--color-text)]">
                        {rev.userId?.name || "Devoted Customer"}
                      </span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* Related Products                                           */}
        {/* ======================================================== */}
        {related.length > 0 && (
          <div className="mt-24 border-t border-[var(--color-border)] pt-16">
            <div className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-accent)] mb-2">
                COMPLETE THE LOOK
              </p>
              <h2 className="font-serif text-3xl font-normal text-[var(--color-text)]">
                You May Also Like
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p, idx) => (
                <ProductCard key={p._id} product={p} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* Optional 3D Modal Viewer                                  */}
      {/* ======================================================== */}
      <AnimatePresence>
        {show3DModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow3DModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <span className="font-serif text-lg font-medium text-[var(--color-text)]">
                  3D Interactive Viewer &bull; {product.name}
                </span>
                <button
                  type="button"
                  onClick={() => setShow3DModal(false)}
                  className="rounded-full p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4 h-[400px] w-full rounded-lg overflow-hidden border border-[var(--color-border)]">
                <ProductViewer3D />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function ProductPage({ params }: { params: ProductParams }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}