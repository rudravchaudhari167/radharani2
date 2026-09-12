"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useToastStore } from "@/lib/toast-store";

interface Product {
  _id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  subcategory?: string;
  stock: number;
  sku: string;
  slug: string;
  images: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  isActive: boolean;
  featured: boolean;
}

interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const CATEGORY_BADGE: Record<string, string> = {
  MEN: "bg-sky-500/15 text-sky-400",
  WOMEN: "bg-pink-500/15 text-pink-400",
  UNISEX: "bg-violet-500/15 text-violet-400",
  KIDS: "bg-amber-500/15 text-amber-400",
  ACCESSORIES: "bg-emerald-500/15 text-emerald-400",
};

export default function AdminProductsPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async (targetPage: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "20",
        });
        if (search.trim()) params.set("search", search.trim());
        if (categoryFilter !== "ALL") params.set("category", categoryFilter);
        const res = await fetch(`/api/admin/products?${params.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          products?: Product[];
          pagination?: Pagination;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.products) {
          setError(data.error || "Could not load products.");
          return;
        }
        setProducts(data.products);
        setPagination(data.pagination || null);
      } catch {
        if (!cancelled) setError("Network error. Could not load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (search.trim()) {
      timer = setTimeout(() => {
        if (page !== 1) {
          setPage(1);
        } else {
          load(1);
        }
      }, 400);
    } else {
      load(page);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [page, search, reloadKey, categoryFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        addToast(data.error || "Could not delete product.", "error");
        return;
      }
      addToast("Product deleted successfully", "success");
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch {
      addToast("Network error. Could not delete product.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout active="products">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
            <Package size={26} className="text-[var(--color-primary-light)]" />
            Products
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {pagination.total.toLocaleString("en-IN")} products
            </p>
          )}
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus size={16} />
          Add Cloth / Product
        </Link>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by cloth name or SKU…"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setPage(1);
              }}
              className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                categoryFilter === cat
                  ? "border-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                  : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card flex items-center gap-4 p-4">
              <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <AlertTriangle size={30} className="mb-4 text-[var(--color-secondary)]" />
          <h2 className="text-xl font-black">Could not load products</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn btn-primary mt-6"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Package size={36} className="mb-4 text-[var(--color-text-muted)]" />
          <h2 className="text-lg font-bold">No products found</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Try adjusting your search or add a new product.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="px-5 py-4">Cloth & Details</th>
                    <th className="px-5 py-4">Colors & Sizes</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {products.map((product) => (
                    <tr key={product._id} className="transition-colors hover:bg-white/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5">
                            {product.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-semibold">
                              {product.name}
                            </p>
                            <p className="font-mono text-xs text-[var(--color-text-muted)]">
                              {product.sku} {product.subcategory ? `• ${product.subcategory}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Colors & Sizes Preview */}
                      <td className="px-5 py-3">
                        <div className="space-y-1.5">
                          {product.colors && product.colors.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {product.colors.slice(0, 5).map((col, idx) => (
                                <span
                                  key={idx}
                                  title={`${col.name} (${col.hex})`}
                                  className="h-4 w-4 rounded-full border border-white/20 shadow-xs"
                                  style={{ backgroundColor: col.hex }}
                                />
                              ))}
                              {product.colors.length > 5 && (
                                <span className="text-[10px] text-[var(--color-text-muted)]">
                                  +{product.colors.length - 5}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--color-text-muted)]">—</span>
                          )}
                          {product.sizes && product.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.sizes.slice(0, 4).map((sz) => (
                                <span
                                  key={sz}
                                  className="rounded border border-[var(--color-border)] px-1 py-0.2 text-[9px] font-bold text-[var(--color-text-muted)]"
                                >
                                  {sz}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            CATEGORY_BADGE[product.category] || "bg-white/10 text-[var(--color-text-muted)]"
                          }`}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold">{inr(product.price)}</p>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <p className="text-xs text-[var(--color-text-muted)] line-through">
                            {inr(product.oldPrice)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-bold ${
                            product.stock === 0
                              ? "text-red-400"
                              : product.stock < 5
                                ? "text-yellow-400"
                                : "text-[var(--color-text)]"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            product.isActive
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/edit/${product._id}`}
                            aria-label={`Edit ${product.name}`}
                            className="rounded-lg border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Delete ${product.name}`}
                            className="rounded-lg border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-[var(--color-text-muted)]">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="glass-card w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-secondary)]/15">
                <AlertTriangle size={24} className="text-[var(--color-secondary)]" />
              </div>
              <h3 className="text-lg font-black">Are you sure?</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                This will deactivate{" "}
                <span className="font-semibold text-[var(--color-text)]">
                  {deleteTarget.name}
                </span>
                . It will no longer appear in the store.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="btn flex-1 disabled:opacity-70"
                  style={{
                    color: "#fff",
                    background:
                      "linear-gradient(135deg, var(--color-secondary), #be185d)",
                    border: "none",
                  }}
                >
                  {deleting ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
