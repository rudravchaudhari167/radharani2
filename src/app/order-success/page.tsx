"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  CalendarDays,
  CreditCard,
  MapPin,
  Truck,
  ShoppingBag,
  PackageSearch,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface Order {
  orderId: string;
  createdAt?: string;
  total?: number;
  paymentStatus?: string;
  paymentId?: string;
  shippingMethod?: "STANDARD" | "EXPRESS";
  estimatedDelivery?: string;
  address?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items?: unknown[];
}

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

function formatDeliveryRange(shippingMethod?: "STANDARD" | "EXPRESS"): string {
  const now = new Date();
  const [min, max] =
    shippingMethod === "EXPRESS" ? [1, 3] : [3, 7];
  const a = new Date(now);
  const b = new Date(now);
  a.setDate(a.getDate() + min);
  b.setDate(b.getDate() + max);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(a)} – ${fmt(b)}`;
}

function paymentMethodLabel(): string {
  return "UPI / Card / Netbanking";
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const user = useAuthStore((s) => s.user);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(() => Boolean(orderId));
  const [error, setError] = useState(() =>
    orderId ? "" : "No order ID provided.",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          credentials: "include",
        });
        const data = (await res.json()) as { order?: Order; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.order) {
          setError(data.error || "Order not found.");
          return;
        }
        setOrder(data.order);
      } catch {
        if (!cancelled) setError("Could not load your order. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

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

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 pt-28">
        <LoaderCircle size={40} className="animate-spin text-[var(--color-primary-light)]" />
        <div className="mt-4 space-y-3">
          <div className="skeleton h-6 w-56" />
          <div className="skeleton h-4 w-72" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-28 text-center">
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
          {error || "We couldn't find your order. Please check the order ID."}
        </p>
        {!user && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            You may need to be logged in to view this order.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link href="/login?redirect=/order-success" className="btn btn-ghost">
            Log in to view
          </Link>
        </div>
      </div>
    );
  }

  const fullAddress = order.address
    ? [
        order.address.addressLine1,
        order.address.addressLine2,
        order.address.city,
        order.address.state,
        order.address.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      {/* Decorative falling petals background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="animate-petal-fall absolute left-[10%] top-0 h-6 w-6 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #f9a8d4, #ec4899 60%, #be185d)",
            animationDuration: "11s",
          }}
        />
        <span
          className="animate-petal-fall absolute left-[35%] top-0 h-4 w-4 rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #c4b5fd, #8b5cf6 60%, #6d28d9)",
            animationDelay: "2.2s",
            animationDuration: "13s",
          }}
        />
        <span
          className="animate-petal-fall absolute left-[62%] top-0 h-7 w-7 rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #fecdd3, #f472b6 60%, #db2777)",
            animationDelay: "4.5s",
            animationDuration: "15s",
          }}
        />
        <span
          className="animate-petal-fall absolute left-[85%] top-0 h-5 w-5 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #fef3c7, #fbbf24 60%, #d97706)",
            animationDelay: "1s",
            animationDuration: "14s",
          }}
        />
      </div>

      <div className="relative">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 14,
              delay: 0.1,
            }}
            className="relative"
          >
            <span className="animate-pulse-glow absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_60px_rgba(16,185,129,0.5)]">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.35 }}
              >
                <Check size={52} strokeWidth={3} className="text-white" />
              </motion.span>
            </div>
            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400/30" />
          </motion.div>
        </div>

        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-400">
            <Check size={13} />
            Payment Successful
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            ORDER PLACED{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              SUCCESSFULLY!
            </span>
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Thank you{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! Your divine
            order is on its way. A confirmation has been sent to your email.
          </p>
        </motion.div>

        {/* Order ID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mx-auto mt-8 flex max-w-md items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white/[0.03] px-5 py-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Order ID
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wide">
              {order.orderId}
            </p>
          </div>
          <button
            type="button"
            onClick={copyOrderId}
            className="btn btn-ghost gap-1.5 text-sm"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy size={15} />
                Copy
              </>
            )}
          </button>
        </motion.div>

        {/* Details grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <DetailCard
            icon={<CalendarDays size={18} />}
            label="Order Date"
            value={formatDate(order.createdAt)}
          />
          <DetailCard
            icon={<CreditCard size={18} />}
            label="Total Paid"
            value={inr(order.total || 0)}
          />
          <DetailCard
            icon={<Truck size={18} />}
            label="Payment Method"
            value={paymentMethodLabel()}
          />
        </motion.div>

        {/* Delivery address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="glass-card mt-6 p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <MapPin size={15} />
                Delivery Address
              </h3>
              <p className="mt-3 font-semibold">
                {order.address?.fullName || "—"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {fullAddress}
              </p>
              {order.address?.phone && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {order.address.phone}
                </p>
              )}
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Truck size={15} />
                Estimated Delivery
              </h3>
              <p className="mt-3 text-2xl font-black text-[var(--color-primary-light)]">
                {formatDeliveryRange(order.shippingMethod)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {order.shippingMethod === "EXPRESS"
                  ? "Express shipping (1-3 business days)"
                  : "Standard shipping (3-7 business days)"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <Link href="/shop" className="btn btn-primary px-7 py-3">
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
          <Link
            href={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
            className="btn btn-outline px-7 py-3"
          >
            <Truck size={16} />
            Track Order
          </Link>
          <Link href="/orders" className="btn btn-ghost px-7 py-3">
            <PackageSearch size={16} />
            View My Orders
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--color-text-muted)]"
        >
          <Sparkles size={12} className="text-[var(--color-gold)]" />
          May your style be as divine as your bond. Thank you for choosing Radha Rani.
        </motion.p>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]">
        {icon}
      </span>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="skeleton h-24 w-24 rounded-2xl" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
