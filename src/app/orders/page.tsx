"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PackageSearch,
  ShoppingBag,
  ChevronRight,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface OrderItem {
  name: string;
  image?: string;
  quantity?: number;
}

interface Order {
  _id?: string;
  orderId: string;
  items: OrderItem[];
  total?: number;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  ORDER_PLACED: "bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]",
  PAYMENT_CONFIRMED: "bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]",
  PROCESSING: "bg-amber-500/15 text-amber-400",
  PACKED: "bg-amber-500/15 text-amber-400",
  SHIPPED: "bg-sky-500/15 text-sky-400",
  OUT_FOR_DELIVERY: "bg-sky-500/15 text-sky-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
};

const PAYMENT_BADGE: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
  REFUNDED: "bg-sky-500/15 text-sky-400",
};

function statusLabel(status: string): string {
  if (!status) return "—";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loggedIn = Boolean(user);
  const gateLoading = !initialized;

  useEffect(() => {
    if (gateLoading) return;
    if (!loggedIn) {
      router.replace("/login?redirect=/orders");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        const data = (await res.json()) as { orders?: Order[]; error?: string };
        if (!res.ok) {
          setError(data.error || "Could not load orders.");
          return;
        }
        setOrders(data.orders || []);
      } catch {
        setError("Network error while loading orders.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loggedIn, gateLoading, router]);

  if (gateLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 pt-28 sm:px-6 lg:px-8">
        <LoaderCircle size={40} className="animate-spin text-[var(--color-primary-light)]" />
      </div>
    );
  }

  if (!loggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="skeleton mb-8 h-9 w-56" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="skeleton h-14 w-14 rounded-xl" />
                  ))}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40" />
                  <div className="skeleton h-3 w-56" />
                </div>
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 pt-28 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-[0_0_40px_rgba(124,58,237,0.4)]"
        >
          <PackageSearch size={42} className="text-white" />
        </motion.div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          No orders yet
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
          When you place an order, you&apos;ll see it here. Explore our divine
          collection to get started.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Shop now
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
          <ShoppingBag size={13} />
          Your Orders
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {orders.length} order{orders.length > 1 ? "s" : ""}
        </h1>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
        >
          {error}
        </motion.p>
      )}

      <div className="space-y-4">
        {orders.map((order, index) => {
          const thumbnails = order.items.slice(0, 3);
          const extraCount = Math.max(0, order.items.length - 3);
          return (
            <motion.div
              key={order.orderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Link
                href={`/orders/${encodeURIComponent(order.orderId)}`}
                className="glass-card group flex flex-col gap-5 p-5 transition-all hover:border-[var(--color-primary-light)]/40 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)] sm:p-6 md:flex-row md:items-center"
              >
                {/* Stacked thumbnails */}
                <div className="flex shrink-0 items-center">
                  <div className="flex -space-x-3">
                    {thumbnails.length > 0
                      ? thumbnails.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative h-14 w-14 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5"
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                                <ShoppingBag size={16} />
                              </div>
                            )}
                          </div>
                        ))
                      : Array.from({ length: 1 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="relative h-14 w-14 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5"
                          >
                            <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                              <ShoppingBag size={16} />
                            </div>
                          </div>
                        ))}
                    {extraCount > 0 && (
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-primary)]/20 text-sm font-bold text-[var(--color-primary-light)]">
                        +{extraCount}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-mono text-sm font-bold tracking-wide text-[var(--color-text)]">
                      {order.orderId}
                    </p>
                    {order.paymentStatus && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          PAYMENT_BADGE[order.paymentStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    )}
                    {order.orderStatus && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_BADGE[order.orderStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                        }`}
                      >
                        {statusLabel(order.orderStatus)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
                    {formatDate(order.createdAt)} ·{" "}
                    {order.items.reduce((sum, i) => sum + (i.quantity || 1), 0)}{" "}
                    item(s)
                  </p>
                </div>

                {/* Total + CTA */}
                <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                  {typeof order.total === "number" ? (
                    <p className="text-xl font-black">{inr(order.total)}</p>
                  ) : null}
                  <span className="btn btn-ghost gap-1.5 px-4 py-2 text-xs">
                    View Details
                    <ChevronRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/shop" className="btn btn-outline">
          <ShoppingBag size={16} />
          Continue Shopping
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}