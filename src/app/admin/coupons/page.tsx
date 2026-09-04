"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Plus,
  Trash2,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  LoaderCircle,
  X,
  Percent,
  IndianRupee,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useToastStore } from "@/lib/toast-store";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

interface CouponFormValues {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minimumOrder: string;
  maximumDiscount: string;
  expiryDate: string;
  usageLimit: string;
  active: boolean;
}

const EMPTY_FORM: CouponFormValues = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrder: "0",
  maximumDiscount: "0",
  expiryDate: "",
  usageLimit: "0",
  active: true,
};

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCouponsPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
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
        const res = await fetch(`/api/admin/coupons?${params.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          coupons?: Coupon[];
          pagination?: Pagination;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.coupons) {
          setError(data.error || "Could not load coupons.");
          return;
        }
        setCoupons(data.coupons);
        setPagination(data.pagination || null);
      } catch {
        if (!cancelled) setError("Network error. Could not load coupons.");
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
  }, [page, search, reloadKey]);

  const set = <K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrder: String(coupon.minimumOrder),
      maximumDiscount: String(coupon.maximumDiscount),
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      usageLimit: String(coupon.usageLimit),
      active: coupon.active,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.code.trim()) {
      setFormError("Coupon code is required.");
      return;
    }
    const value = parseFloat(form.discountValue);
    if (isNaN(value) || value < 0) {
      setFormError("Valid discount value is required.");
      return;
    }
    if (form.discountType === "PERCENTAGE" && value > 100) {
      setFormError("Percentage discount cannot exceed 100.");
      return;
    }
    if (!form.expiryDate) {
      setFormError("Expiry date is required.");
      return;
    }

    const payload = {
      code: form.code.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: value,
      minimumOrder: parseFloat(form.minimumOrder || "0") || 0,
      maximumDiscount: parseFloat(form.maximumDiscount || "0") || 0,
      expiryDate: new Date(form.expiryDate).toISOString(),
      usageLimit: parseInt(form.usageLimit || "0", 10) || 0,
      active: form.active,
    };

    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/coupons/${editing._id}`
        : "/api/admin/coupons";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error || "Could not save coupon.");
        return;
      }
      addToast(
        editing ? "Coupon updated successfully" : "Coupon created successfully",
        "success"
      );
      setModalOpen(false);
      setReloadKey((k) => k + 1);
    } catch {
      setFormError("Network error. Could not save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: !coupon.active }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        addToast(data.error || "Could not update coupon.", "error");
        return;
      }
      addToast(coupon.active ? "Coupon deactivated" : "Coupon activated", "success");
      setReloadKey((k) => k + 1);
    } catch {
      addToast("Network error. Could not update coupon.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        addToast(data.error || "Could not delete coupon.", "error");
        return;
      }
      addToast("Coupon deleted successfully", "success");
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch {
      addToast("Network error. Could not delete coupon.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout active="coupons">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
            <Ticket size={26} className="text-[var(--color-primary-light)]" />
            Coupons
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {pagination.total.toLocaleString("en-IN")} coupons
            </p>
          )}
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or description…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-6 w-32" />
              <div className="skeleton mt-4 h-4 w-3/4" />
              <div className="skeleton mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <AlertTriangle size={30} className="mb-4 text-[var(--color-secondary)]" />
          <h2 className="text-xl font-black">Could not load coupons</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn btn-primary mt-6"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Ticket size={36} className="mb-4 text-[var(--color-text-muted)]" />
          <h2 className="text-lg font-bold">No coupons found</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Create your first coupon to start discounting.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {coupons.map((coupon) => (
              <motion.div
                key={coupon._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card relative overflow-hidden p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
                      {coupon.discountType === "PERCENTAGE" ? (
                        <Percent size={20} />
                      ) : (
                        <IndianRupee size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-lg font-black tracking-wide">
                        {coupon.code}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {coupon.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(coupon)}
                    role="switch"
                    aria-checked={coupon.active}
                    title={coupon.active ? "Deactivate" : "Activate"}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      coupon.active
                        ? "bg-emerald-500/70"
                        : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        coupon.active ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      Value
                    </p>
                    <p className="mt-0.5 text-sm font-bold">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : inr(coupon.discountValue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      Min Order
                    </p>
                    <p className="mt-0.5 text-sm font-bold">
                      {inr(coupon.minimumOrder)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      Max Disc
                    </p>
                    <p className="mt-0.5 text-sm font-bold">
                      {coupon.maximumDiscount ? inr(coupon.maximumDiscount) : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">
                    Expires {formatDate(coupon.expiryDate)}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    Used {coupon.usedCount}/
                    {coupon.usageLimit || "∞"}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(coupon)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(coupon)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>

                {!coupon.active && (
                  <span className="absolute right-3 top-3 rounded-full bg-[var(--color-secondary)]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                    Inactive
                  </span>
                )}
              </motion.div>
            ))}
          </div>

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

      {/* Create/Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => !saving && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <Ticket size={20} className="text-[var(--color-primary-light)]" />
                  {editing ? "Edit Coupon" : "Create Coupon"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 noValidate">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 font-mono text-sm uppercase text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Short description"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Discount Type
                    </label>
                    <select
                      value={form.discountType}
                      onChange={(e) =>
                        set("discountType", e.target.value as CouponFormValues["discountType"])
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                    >
                      <option value="PERCENTAGE" className="bg-[var(--color-bg-secondary)]">
                        Percentage (%)
                      </option>
                      <option value="FIXED" className="bg-[var(--color-bg-secondary)]">
                        Fixed (₹)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.discountValue}
                      onChange={(e) => set("discountValue", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Min Order (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.minimumOrder}
                      onChange={(e) => set("minimumOrder", e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.maximumDiscount}
                      onChange={(e) => set("maximumDiscount", e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => set("expiryDate", e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.usageLimit}
                      onChange={(e) => set("usageLimit", e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 p-3.5">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => set("active", e.target.checked)}
                    className="h-5 w-5 accent-[var(--color-primary)]"
                  />
                  <span className="text-sm font-semibold">Active</span>
                </label>

                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
                  >
                    {formError}
                  </motion.p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary flex-1"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Saving…
                      </>
                    ) : editing ? (
                      "Save Changes"
                    ) : (
                      "Create Coupon"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
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
              <h3 className="text-lg font-black">Delete coupon?</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                This will permanently delete{" "}
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  {deleteTarget.code}
                </span>
                . This action cannot be undone.
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
