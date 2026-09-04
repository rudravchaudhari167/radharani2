"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  Clock,
  Users,
  Package,
  AlertTriangle,
  Plus,
  ArrowRight,
  Ticket,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface LowStockItem {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
}

interface RecentOrder {
  _id: string;
  orderId: string;
  total: number;
  orderStatus: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
}

interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStock: LowStockItem[];
  recentOrders: RecentOrder[];
}

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

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

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  gradient,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
  gradient?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative overflow-hidden p-5"
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/25 via-transparent to-[var(--color-secondary)]/20" />
      )}
      <div className="relative z-10 flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight text-[var(--color-text)] sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--color-primary-light)]">
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

function RevenueBarChart({ recentOrders }: { recentOrders: RecentOrder[] }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-IN", { weekday: "short" });
  });

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return recentOrders
      .filter((o) => {
        if (!o.createdAt) return false;
        const created = new Date(o.createdAt).toISOString().slice(0, 10);
        return created === key && o.orderStatus !== "CANCELLED";
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
  });

  const max = Math.max(...buckets, 1);

  return (
    <div className="flex h-52 items-end justify-between gap-2 sm:gap-3">
      {buckets.map((value, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
            {value > 0 ? inr(value) : "—"}
          </span>
          <div className="flex h-full w-full items-end">
            <div
              className="relative w-full rounded-t-lg bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-secondary)] transition-all"
              style={{ height: `${Math.max((value / max) * 100, 3)}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
            {last7[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const data = (await res.json()) as Stats & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load dashboard statistics.");
          return;
        }
        setStats(data);
      } catch {
        if (!cancelled) setError("Network error. Could not load dashboard statistics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <AdminLayout active="dashboard">
        <div className="mb-8">
          <div className="skeleton h-9 w-64" />
          <div className="skeleton mt-3 h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton mt-3 h-8 w-32" />
              <div className="skeleton mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="glass-card h-64 lg:col-span-2" />
          <div className="glass-card h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout active="dashboard">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-secondary)]/15">
            <AlertTriangle size={30} className="text-[var(--color-secondary)]" />
          </div>
          <h2 className="text-xl font-black">Could not load dashboard</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn btn-primary mt-6"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Overview of your store&apos;s performance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={inr(stats.totalRevenue)}
          icon={Wallet}
          hint="Lifetime paid revenue"
          gradient
        />
        <StatCard
          label="Today's Revenue"
          value={inr(stats.todayRevenue)}
          icon={TrendingUp}
          hint="Earnings today"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString("en-IN")}
          icon={ShoppingBag}
          hint="All time"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders.toLocaleString("en-IN")}
          icon={Clock}
          hint="Awaiting processing"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers.toLocaleString("en-IN")}
          icon={Users}
          hint="Registered users"
        />
        <StatCard
          label="Total Products"
          value={stats.totalProducts.toLocaleString("en-IN")}
          icon={Package}
          hint="Active listings"
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStock.length.toString()}
          icon={AlertTriangle}
          hint="Below 5 units"
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between rounded-2xl border border-[var(--color-primary-light)]/20 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/15 p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary-light)]">
            Quick Actions
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-primary)]/30 transition-transform hover:-translate-y-0.5"
            >
              <Plus size={15} />
              Add Product
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              View Orders
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/admin/coupons"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              <Ticket size={15} />
              Create Coupon
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Charts + recent orders */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <IndianRupee size={18} className="text-[var(--color-primary-light)]" />
              Revenue (Last 7 Days)
            </h2>
          </div>
          <RevenueBarChart recentOrders={stats.recentOrders} />
        </motion.section>

        {/* Recent orders */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ShoppingBag size={18} className="text-[var(--color-primary-light)]" />
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {stats.recentOrders.length === 0 && (
              <p className="px-6 py-8 text-sm text-[var(--color-text-muted)]">
                No orders yet.
              </p>
            )}
            {stats.recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order._id}`}
                className="block px-6 py-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs font-bold">{order.orderId}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_BADGE[order.orderStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                    }`}
                  >
                    {STATUS_LABEL[order.orderStatus] || order.orderStatus}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span className="truncate pr-2">
                    {order.userId?.name || "Guest"}
                  </span>
                  <span className="font-bold text-[var(--color-text)]">
                    {inr(order.total)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      </div>
    </AdminLayout>
  );
}
