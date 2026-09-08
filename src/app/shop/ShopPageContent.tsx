"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Feather,
  Filter,
  PackageOpen,
  RotateCcw,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  "MEN",
  "WOMEN",
  "UNISEX",
  "KIDS",
  "ACCESSORIES",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#f2f0ea" },
  { name: "Red", hex: "#e11d48" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
  { name: "Gold", hex: "#d4a574" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Pink", hex: "#ec4899" },
];

export const SORT_OPTIONS = [
  { value: "popular", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Selling" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const CATEGORY_HERO: Record<
  Category,
  { name: string; tagline: string; description: string; image: string }
> = {
  MEN: {
    name: "Men",
    tagline: "Krishna Inspiration",
    description: "Modern silhouettes shaped by timeless inspiration.",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1400&auto=format&fit=crop",
  },
  WOMEN: {
    name: "Women",
    tagline: "Radha Inspiration",
    description: "Graceful forms and ethereal silhouettes inspired by Radha.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1400&auto=format&fit=crop",
  },
  UNISEX: {
    name: "Unisex",
    tagline: "Devotional Forms",
    description: "Versatile, relaxed silhouettes designed to be shared and worn with devotion.",
    image: "https://images.unsplash.com/photo-1583743814966-8066b5dc11c7?q=80&w=1400&auto=format&fit=crop",
  },
  KIDS: {
    name: "Kids",
    tagline: "Gentle Devotion",
    description: "Soft, breathable garments for joyful everyday comfort.",
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=1400&auto=format&fit=crop",
  },
  ACCESSORIES: {
    name: "Accessories",
    tagline: "Timeless Adornments",
    description: "Subtle details inspired by timeless sacred symbolism.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1400&auto=format&fit=crop",
  },
};

export function isCategory(value: string | null | undefined): value is Category {
  if (!value) return false;
  return (CATEGORIES as readonly string[]).includes(value.toUpperCase());
}

const PAGE_SIZE = 12;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ClientFilters {
  sizes: string[];
  colors: string[];
  minRating: number | null;
  inStock: boolean;
}

const EMPTY_CLIENT_FILTERS: ClientFilters = {
  sizes: [],
  colors: [],
  minRating: null,
  inStock: false,
};

function hasActivePrice(priceRange: { min: string; max: string }): boolean {
  return Boolean(priceRange.min.trim() || priceRange.max.trim());
}

function matchesClientFilters(
  product: ProductCardProduct,
  filters: ClientFilters
): boolean {
  if (filters.sizes.length > 0) {
    const productSizes = (product.sizes || []).map((s) => s.toUpperCase());
    if (!filters.sizes.some((s) => productSizes.includes(s.toUpperCase()))) {
      return false;
    }
  }

  if (filters.colors.length > 0) {
    const productColors = (product.colors || []).map((c) => c.name.toLowerCase());
    if (!filters.colors.some((c) => productColors.includes(c.toLowerCase()))) {
      return false;
    }
  }

  if (filters.minRating != null) {
    if (
      typeof product.rating !== "number" ||
      product.rating < filters.minRating
    ) {
      return false;
    }
  }

  if (filters.inStock && typeof product.stock === "number" && product.stock <= 0) {
    return false;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/* Price inputs                                                        */
/* ------------------------------------------------------------------ */

function PriceFilter({
  min,
  max,
  onMinChange,
  onMaxChange,
  onClear,
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onClear: () => void;
}) {
  const hasValue = Boolean(min || max);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-text-muted)]">
            ₹
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min}
            placeholder="Min"
            aria-label="Minimum price"
            onChange={(e) => onMinChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-7 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
          />
        </div>
        <span className="text-[var(--color-text-muted)]">—</span>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-text-muted)]">
            ₹
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max}
            placeholder="Max"
            aria-label="Maximum price"
            onChange={(e) => onMaxChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-7 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
          />
        </div>
      </div>
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-secondary)] transition-colors hover:text-[var(--color-secondary)]/80"
        >
          <X size={12} />
          Clear price
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filters panel (shared by desktop sidebar + mobile drawer)           */
/* ------------------------------------------------------------------ */

interface FiltersPanelProps {
  activeCategory: Category | null;
  priceRange: { min: string; max: string };
  onPriceRangeChange: (range: { min: string; max: string }) => void;
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
  selectedColors: string[];
  onToggleColor: (color: string) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
  inStock: boolean;
  onInStockChange: (value: boolean) => void;
  activeFilterCount: number;
  onClearAll: () => void;
  onCategorySelect: (category: Category) => void;
}

function FilterSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
      {children}
    </h3>
  );
}

function FiltersPanel({
  activeCategory,
  priceRange,
  onPriceRangeChange,
  selectedSizes,
  onToggleSize,
  selectedColors,
  onToggleColor,
  minRating,
  onRatingChange,
  inStock,
  onInStockChange,
  activeFilterCount,
  onClearAll,
  onCategorySelect,
}: FiltersPanelProps) {
  return (
    <div className="space-y-8">
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-xs font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-secondary)]/50 hover:bg-white/10"
        >
          <RotateCcw size={14} />
          Clear all filters ({activeFilterCount})
        </button>
      )}

      {/* Categories */}
      <div>
        <FilterSectionTitle>Categories</FilterSectionTitle>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              if (activeCategory === null) return;
              onCategorySelect(activeCategory);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeCategory === null
                ? "bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/10 font-semibold text-[var(--color-primary-light)]"
                : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
            }`}
          >
            <Feather size={14} className="shrink-0" />
            All Products
          </button>
          {CATEGORIES.filter((c) => c !== "MEN" && c !== "ACCESSORIES").map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategorySelect(category)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/10 font-semibold text-[var(--color-primary-light)]"
                    : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                }`}
              >
                <span className="capitalize">{category.toLowerCase()}</span>
                {isActive && (
                  <Check size={14} className="shrink-0 text-[var(--color-primary-light)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div>
        <FilterSectionTitle>Price (₹)</FilterSectionTitle>
        <PriceFilter
          min={priceRange.min}
          max={priceRange.max}
          onMinChange={(min) => onPriceRangeChange({ ...priceRange, min })}
          onMaxChange={(max) => onPriceRangeChange({ ...priceRange, max })}
          onClear={() => onPriceRangeChange({ min: "", max: "" })}
        />
      </div>

      {/* Size */}
      <div>
        <FilterSectionTitle>Size</FilterSectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onToggleSize(size)}
                aria-pressed={isSelected}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-gradient-to-r from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20 text-[var(--color-primary-light)] shadow-[0_0_16px_-4px_rgba(124,58,237,0.6)]"
                    : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:border-white/25 hover:text-[var(--color-text)]"
                }`}
              >
                {isSelected && <Check size={12} />}
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <FilterSectionTitle>Colors</FilterSectionTitle>
        <div className="flex flex-wrap gap-3">
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = selectedColors.includes(swatch.name.toLowerCase());
            return (
              <button
                key={swatch.name}
                type="button"
                onClick={() => onToggleColor(swatch.name)}
                aria-label={`Filter by ${swatch.name}`}
                aria-pressed={isSelected}
                title={swatch.name}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-[var(--color-primary-light)] ring-offset-2 ring-offset-[var(--color-bg)]"
                    : "ring-1 ring-white/15 hover:scale-110"
                }`}
                style={{ backgroundColor: swatch.hex }}
              >
                {isSelected && (
                  <Check
                    size={15}
                    className={
                      swatch.name === "White" || swatch.name === "Gold"
                        ? "text-black"
                        : "text-white"
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
        {selectedColors.length > 0 && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {selectedColors.length} colour{selectedColors.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Rating */}
      <div>
        <FilterSectionTitle>Rating</FilterSectionTitle>
        <div className="space-y-2">
          {[
            { label: "4★ & above", value: 4 },
            { label: "3★ & above", value: 3 },
          ].map((option) => {
            const isSelected = minRating === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onRatingChange(isSelected ? null : option.value)}
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-white/10 font-semibold text-[var(--color-text)]"
                    : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <Check size={15} className="text-[var(--color-primary-light)]" />
                ) : (
                  <Star size={15} className="text-amber-400/70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* In stock */}
      <div>
        <button
          type="button"
          onClick={() => onInStockChange(!inStock)}
          aria-pressed={inStock}
          className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-white/5 px-3 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <span className={inStock ? "font-semibold text-[var(--color-text)]" : ""}>
            In Stock only
          </span>
          <span
            className={`relative h-5 w-9 rounded-full transition-colors ${
              inStock
                ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                inStock ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sort dropdown                                                       */
/* ------------------------------------------------------------------ */

function SortDropdown({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (value: SortValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const label =
    SORT_OPTIONS.find((option) => option.value === value)?.label ??
    SORT_OPTIONS[0].label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-white/20 hover:bg-white/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <SlidersHorizontal size={15} className="shrink-0 text-[var(--color-primary-light)]" />
        <span className="hidden sm:inline">Sort:</span>
        <span className="font-semibold">{label}</span>
        <ChevronDown
          size={15}
          className={`text-[var(--color-text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 shadow-2xl backdrop-blur-xl"
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-[var(--color-primary)]/25 to-[var(--color-secondary)]/15 font-semibold text-[var(--color-primary-light)]"
                        : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                    }`}
                  >
                    {option.label}
                    {isActive && <Check size={14} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const result: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) result.push(i);
      return result;
    }
    result.push(1);
    if (page > 3) result.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i += 1
    ) {
      result.push(i);
    }
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  const buttonClass = (isActive = false) =>
    `flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all ${
      isActive
        ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.6)]"
        : "border border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:border-white/20 hover:text-[var(--color-text)]"
    }`;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={buttonClass()}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, index) =>
        p === "..." ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-[var(--color-text-muted)]">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={buttonClass(p === page)}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={buttonClass()}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function ShopGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="glass-card overflow-hidden">
          <div className="skeleton aspect-[4/5] rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/3" />
            <div className="flex items-center justify-between gap-2">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-8 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ShopPageContent({
  presetCategory = null,
  fixedCategory = false,
}: {
  presetCategory?: string | null;
  fixedCategory?: boolean;
}) {
  const router = useRouter();
  const activeCategory = isCategory(presetCategory)
    ? (presetCategory.toUpperCase() as Category)
    : null;

  const [sort, setSort] = useState<SortValue>("popular");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [clientFilters, setClientFilters] =
    useState<ClientFilters>(EMPTY_CLIENT_FILTERS);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const serverParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (activeCategory) params.set("category", activeCategory);
    const min = priceRange.min.trim();
    const max = priceRange.max.trim();
    if (min) params.set("minPrice", min);
    if (max) params.set("maxPrice", max);
    params.set("sort", sort);
    return params.toString();
  }, [activeCategory, priceRange.min, priceRange.max, sort]);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/products?${serverParams}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load products");
        const data = (await res.json()) as { products?: ProductCardProduct[] };
        if (!active) return;
        setAllProducts(data.products ?? []);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [serverParams, refreshKey]);

  const filteredProducts = useMemo(
    () => allProducts.filter((p) => matchesClientFilters(p, clientFilters)),
    [allProducts, clientFilters]
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = useMemo(
    () =>
      filteredProducts.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredProducts, currentPage]
  );

  const resultStart =
    filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(filteredProducts.length, currentPage * PAGE_SIZE);

  const activeFilterCount = useMemo(
    () =>
      clientFilters.sizes.length +
      clientFilters.colors.length +
      (clientFilters.minRating != null ? 1 : 0) +
      (clientFilters.inStock ? 1 : 0) +
      (hasActivePrice(priceRange) ? 1 : 0),
    [clientFilters, priceRange]
  );

  const resetToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const toggleSize = useCallback((size: string) => {
    setClientFilters((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      if (sizes.length !== prev.sizes.length) setPage(1);
      return { ...prev, sizes };
    });
  }, []);

  const toggleColor = useCallback((color: string) => {
    const normalized = color.toLowerCase();
    setClientFilters((prev) => {
      const colors = prev.colors.includes(normalized)
        ? prev.colors.filter((c) => c !== normalized)
        : [...prev.colors, normalized];
      if (colors.length !== prev.colors.length) setPage(1);
      return { ...prev, colors };
    });
  }, []);

  const handleRatingChange = useCallback((rating: number | null) => {
    setClientFilters((prev) => ({ ...prev, minRating: rating }));
    setPage(1);
  }, []);

  const handleInStockChange = useCallback((value: boolean) => {
    setClientFilters((prev) => ({ ...prev, inStock: value }));
    setPage(1);
  }, []);

  const handlePriceRangeChange = useCallback(
    (range: { min: string; max: string }) => {
      setPriceRange(range);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleClearAll = useCallback(() => {
    setPriceRange({ min: "", max: "" });
    setClientFilters(EMPTY_CLIENT_FILTERS);
    setSort("popular");
    setPage(1);
  }, []);

  const handleCategorySelect = useCallback(
    (category: Category) => {
      if (fixedCategory) {
        if (category === activeCategory) {
          router.push("/shop");
        } else {
          router.push(`/shop/${category.toLowerCase()}`);
        }
        return;
      }
      router.push(category === activeCategory ? "/shop" : `/shop?category=${category}`);
    },
    [activeCategory, fixedCategory, router]
  );

  const showHero = fixedCategory && activeCategory !== null;
  const hero = activeCategory ? CATEGORY_HERO[activeCategory] : null;
  const invalidCategoryPage = fixedCategory && activeCategory === null;

  return (
    <>
      {/* Category hero banner */}
      {showHero && hero && (
        <section className="relative overflow-hidden border-b border-[var(--color-border)] h-72 sm:h-80 flex items-center">
          <Image
            src={hero.image}
            alt={hero.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative mx-auto max-w-[80rem] w-full px-4 sm:px-6 lg:px-8">
            <motion.nav
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              aria-label="Breadcrumb"
              className="mb-4 flex items-center gap-2 text-xs font-medium text-white/80"
            >
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <span>/</span>
              <Link href="/shop" className="transition-colors hover:text-white">
                Shop
              </Link>
              <span>/</span>
              <span className="text-white">{hero.name}</span>
            </motion.nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
                {hero.tagline}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-normal text-white">
                {hero.name}
              </h1>
              <p className="mt-2 max-w-xl text-xs sm:text-sm font-light leading-relaxed text-white/90">
                {hero.description}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {invalidCategoryPage ? (
        /* Unknown category */
        <section className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="card w-full p-10 sm:p-14"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-muted)]">
              <PackageOpen size={28} className="text-[var(--color-accent)]" />
            </div>
            <h1 className="font-serif text-2xl font-normal text-[var(--color-text)]">
              Category not found
            </h1>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              We couldn&apos;t find &ldquo;{(presetCategory ?? "").toUpperCase()}&rdquo;.
              Explore your favourite collections below.
            </p>
            <Link
              href="/shop"
              className="btn btn-primary mt-7 inline-flex"
            >
              Back to Shop
            </Link>
          </motion.div>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-10">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-accent)]">
              {showHero ? `${hero?.name} Collection` : "RADHA RANI COLLECTION"}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-text)]">
              {showHero && hero ? `${hero.name}` : "SHOP"}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {showHero && hero
                ? hero.description
                : "Explore the Radha Rani catalog."}
            </p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Desktop sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-8 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
                    <Filter size={14} className="text-[var(--color-accent)]" />
                    Filters
                  </h2>
                </div>
                <FiltersPanel
                  activeCategory={activeCategory}
                  priceRange={priceRange}
                  onPriceRangeChange={handlePriceRangeChange}
                  selectedSizes={clientFilters.sizes}
                  onToggleSize={toggleSize}
                  selectedColors={clientFilters.colors}
                  onToggleColor={toggleColor}
                  minRating={clientFilters.minRating}
                  onRatingChange={handleRatingChange}
                  inStock={clientFilters.inStock}
                  onInStockChange={handleInStockChange}
                  activeFilterCount={activeFilterCount}
                  onClearAll={handleClearAll}
                  onCategorySelect={handleCategorySelect}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {loading && !error
                    ? "Loading collection…"
                    : `Showing ${resultStart}–${resultEnd} of ${filteredProducts.length} pieces`}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="relative flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-muted)] lg:hidden shadow-xs"
                  >
                    <Filter size={13} className="text-[var(--color-accent)]" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <SortDropdown
                    value={sort}
                    onChange={(value) => {
                      setSort(value);
                      resetToFirstPage();
                    }}
                  />
                </div>
              </div>

              {/* Content states */}
              {error ? (
                <div className="card mx-auto mt-16 max-w-md p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-accent)]">
                    <PackageOpen size={24} />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[var(--color-text)]">
                    Unable to load pieces
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Please refresh or try again in a moment.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="btn btn-primary mt-6"
                  >
                    Try again
                  </button>
                </div>
              ) : loading ? (
                <ShopGridSkeleton />
              ) : filteredProducts.length === 0 ? (
                <div className="glass-card mx-auto mt-16 max-w-md p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/20">
                    <PackageOpen size={26} className="text-[var(--color-primary-light)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text)]">
                    No products found
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    Try adjusting or clearing your filters to see more divine pieces.
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="btn btn-primary mt-6"
                    >
                      <RotateCcw size={15} />
                      Clear all filters
                    </button>
                  )}
                  <div className="mt-3">
                    <Link href="/shop" className="btn btn-ghost">
                      Browse all products
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <motion.div
                    layout
                    className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
                  >
                    <AnimatePresence mode="popLayout">
                      {pageProducts.map((product, index) => (
                        <motion.div
                          key={product._id}
                          layout
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            duration: 0.4,
                            delay: (index % 4) * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <ProductCard product={product} index={index} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {totalPages > 1 && (
                    <div className="mt-12">
                      <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-[#171717]/40 backdrop-blur-xs lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-80 max-w-[85vw] border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl lg:hidden"
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-text)]">
                    <Filter size={15} className="text-[var(--color-accent)]" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
                    aria-label="Close filters"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <FiltersPanel
                    activeCategory={activeCategory}
                    priceRange={priceRange}
                    onPriceRangeChange={handlePriceRangeChange}
                    selectedSizes={clientFilters.sizes}
                    onToggleSize={toggleSize}
                    selectedColors={clientFilters.colors}
                    onToggleColor={toggleColor}
                    minRating={clientFilters.minRating}
                    onRatingChange={handleRatingChange}
                    inStock={clientFilters.inStock}
                    onInStockChange={handleInStockChange}
                    activeFilterCount={activeFilterCount}
                    onClearAll={handleClearAll}
                    onCategorySelect={handleCategorySelect}
                  />
                </div>

                <div className="border-t border-[var(--color-border)] p-4">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="btn btn-primary w-full"
                  >
                    Show results
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}