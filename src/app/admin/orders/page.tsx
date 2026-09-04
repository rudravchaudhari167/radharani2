"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Order {
  _id: string;
  orderId: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: unknown[];
  address?: { fullName?: string; email?: string };
  userId?: { name?: string; email?: string };
}

interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "ORDER_PLACED", label: "Order Placed" },
  { key: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_BADGE: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
  REFUNDED: "bg-sky-500/15 text-sky-400",
};

const STATUS_BADGE: Record<string, string> = {
  ORDER_PLACED: "bg-sky-500/15 text-sky-400",
  PAYMENT_CONFIRMED: "bg-indigo-500/15 text-indigo-400",
  PROCESSING: "bg-amber-500/15 text-amber-400",
  PACKED: "bg-fuchsia-500/15 text-fuchsia-400",
  SHIPPED: "bg-blue-500/15 text-blue-400",
  OUT_FOR_DELIVERY: "bg-violet-500/15 text-violet-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
};

const STATUS_LABEL: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
        if (status) params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/admin/orders?${params.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          orders?: Order[];
          pagination?: Pagination;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.orders) {
          setError(data.error || "Could not load orders.");
          return;
        }
        setOrders(data.orders);
        setPagination(data.pagination || null);
      } catch {
        if (!cancelled) setError("Network error. Could not load orders.");
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
  }, [page, status, search, reloadKey]);

  return (
    <AdminLayout active="orders">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
            <ShoppingBag size={26} className="text-[var(--color-primary-light)]" />
            Orders
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {pagination.total.toLocaleString("en-IN")} orders
            </p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-2">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key || "all"}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(tab.key);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-primary)]/30"
                    : "border border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID or customer…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-3 w-1/3" />
              </div>
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <AlertTriangle size={30} className="mb-4 text-[var(--color-secondary)]" />
          <h2 className="text-xl font-black">Could not load orders</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn btn-primary mt-6"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <ShoppingBag size={36} className="mb-4 text-[var(--color-text-muted)]" />
          <h2 className="text-lg font-bold">No orders found</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Try a different filter or search.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Items</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {orders.map((order) => (
                    <tr key={order._id} className="transition-colors hover:bg-white/5">
                      <td className="px-5 py-3 font-mono text-xs font-bold">
                        {order.orderId}
                      </td>
                      <td className="px-5 py-3">
                        <p className="max-w-[160px] truncate font-semibold">
                          {order.userId?.name || order.address?.fullName || "Guest"}
                        </p>
                        <p className="max-w-[180px] truncate text-xs text-[var(--color-text-muted)]">
                          {order.userId?.email || order.address?.email || ""}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-[var(--color-text-muted)]">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-5 py-3 font-bold">{inr(order.total)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            PAYMENT_BADGE[order.paymentStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_BADGE[order.orderStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                          }`}
                        >
                          {STATUS_LABEL[order.orderStatus] || order.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--color-text-muted)]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </AdminLayout>
  );
}
