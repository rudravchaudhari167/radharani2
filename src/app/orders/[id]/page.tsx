"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PackageSearch,
  MapPin,
  CalendarDays,
  Truck,
  CreditCard,
  Tag,
  LoaderCircle,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
} from "lucide-react";
import OrderTimeline, { type OrderStatusType } from "@/components/OrderTimeline";
import { useAuthStore } from "@/lib/store";

interface OrderItem {
  name: string;
  price?: number;
  image?: string;
  size?: string;
  color?: string;
  quantity?: number;
}

interface Order {
  orderId: string;
  createdAt?: string;
  estimatedDelivery?: string;
  paymentId?: string;
  paymentStatus?: string;
  orderStatus: OrderStatusType;
  shippingMethod?: "STANDARD" | "EXPRESS";
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  couponCode?: string;
  items: OrderItem[];
  address: {
    fullName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

const PAYMENT_BADGE: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
  REFUNDED: "bg-sky-500/15 text-sky-400",
};

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateLong(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeliveryRange(shippingMethod?: "STANDARD" | "EXPRESS"): string {
  const now = new Date();
  const [min, max] = shippingMethod === "EXPRESS" ? [1, 3] : [3, 7];
  const a = new Date(now);
  const b = new Date(now);
  a.setDate(a.getDate() + min);
  b.setDate(b.getDate() + max);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(a)} – ${fmt(b)}`;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loggedIn = Boolean(user);
  const gateLoading = !initialized;

  useEffect(() => {
    if (gateLoading) return;
    if (!loggedIn) {
      router.replace("/login?redirect=");
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { id } = await params;
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        const data = (await res.json()) as { order?: Order; error?: string };
        if (!res.ok || !data.order) {
          setError(data.error || "Order not found.");
          return;
        }
        setOrder(data.order);
      } catch {
        setError("Could not load this order. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, gateLoading, router, params]);

  const copyOrderId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

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
        <div className="mb-8 flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-2xl" />
          <div className="skeleton h-8 w-56" />
        </div>
        <div className="glass-card mb-6 space-y-6 p-8">
          <div className="skeleton h-6 w-40" />
          <div className="flex gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </div>
        <div className="glass-card p-8">
          <div className="skeleton mb-4 h-6 w-44" />
          <div className="space-y-3">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-28 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-secondary)]/15"
        >
          <PackageSearch size={36} className="text-[var(--color-secondary)]" />
        </motion.div>
        <h1 className="text-2xl font-black tracking-tight">Order not found</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {error || "We couldn't find this order."}
        </p>
        <Link href="/orders" className="btn btn-primary mt-8">
          <ArrowLeft size={16} />
          Back to My Orders
        </Link>
      </div>
    );
  }

  const fullAddress = [
    order.address?.addressLine1,
    order.address?.addressLine2,
    order.address?.city,
    order.address?.state,
    order.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/orders"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
            >
              <ArrowLeft size={14} />
              Back to My Orders
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-black tracking-wide sm:text-3xl">
                {order.orderId}
              </h1>
              <button
                type="button"
                onClick={copyOrderId}
                aria-label="Copy order ID"
                className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                {copied ? (
                  <Check size={15} className="text-emerald-400" />
                ) : (
                  <Copy size={15} />
                )}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {order.paymentStatus && (
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    PAYMENT_BADGE[order.paymentStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                  }`}
                >
                  Payment {order.paymentStatus.toLowerCase()}
                </span>
              )}
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {order.shippingMethod === "EXPRESS" ? "Express" : "Standard"} shipping
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Placed on {formatDateLong(order.createdAt)}
          </p>
        </div>
      </motion.div>

      {/* Status timeline */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card overflow-x-auto p-6 sm:p-8"
      >
        <OrderTimeline orderStatus={order.orderStatus} />
      </motion.section>

      {/* Items + summary */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 sm:p-8"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
            <ShoppingBag size={18} className="text-[var(--color-primary-light)]" />
            Items ({order.items.length})
          </h2>
          <div className="space-y-5">
            {order.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                className="flex gap-4"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                      <ShoppingBag size={20} />
                    </div>
                  )}
                  {item.quantity && item.quantity > 1 && (
                    <span className="absolute bottom-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-tl-lg bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
                      {item.quantity}×
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                    {item.size && (
                      <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5">
                        Color: {item.color}
                      </span>
                    )}
                    {item.quantity && (
                      <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5">
                        Qty: {item.quantity}
                      </span>
                    )}
                  </div>
                </div>
                {typeof item.price === "number" && (
                  <p className="shrink-0 text-sm font-bold">
                    {inr(item.price * (item.quantity || 1))}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Summary */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6 lg:sticky lg:top-28 lg:self-start"
        >
          <div className="glass-card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <CreditCard size={18} className="text-[var(--color-primary-light)]" />
                Price Details
              </h2>
            </div>
            <div className="space-y-3 px-6 py-5 text-sm">
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--color-text)]">
                  {inr(order.subtotal || 0)}
                </span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} className="text-[var(--color-primary-light)]" />
                    Coupon ({order.couponCode})
                  </span>
                  <span>-{inr(order.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>
                  Shipping{" "}
                  {order.shippingMethod === "EXPRESS" ? "(Express)" : "(Standard)"}
                </span>
                <span className="font-medium text-[var(--color-text)]">
                  {order.shipping === 0 ? (
                    <span className="text-emerald-400">FREE</span>
                  ) : (
                    inr(order.shipping || 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <span className="text-base font-bold">Total</span>
                <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] bg-clip-text text-2xl font-black text-transparent">
                  {inr(order.total || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <MapPin size={15} />
              Delivery Address
            </h3>
            <p className="mt-3 font-semibold">{order.address?.fullName || "—"}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {fullAddress}
            </p>
            {order.address?.phone && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {order.address.phone}
              </p>
            )}
            {order.address?.email && (
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {order.address.email}
              </p>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Truck size={15} />
              Delivery Info
            </h3>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Estimated delivery
            </p>
            <p className="mt-1 text-xl font-black text-[var(--color-primary-light)]">
              {formatDeliveryRange(order.shippingMethod)}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <CalendarDays size={13} />
              Ordered on {formatDate(order.createdAt)}
            </p>
            {order.paymentId && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <CreditCard size={13} />
                Payment ID: {order.paymentId}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
              className="btn btn-primary flex-1"
            >
              <Truck size={16} />
              Track Order
            </Link>
            <Link href="/shop" className="btn btn-ghost flex-1">
              <ArrowRight size={16} />
              Shop More
            </Link>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}