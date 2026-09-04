"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  PackageSearch,
  Search,
  Truck,
  MapPin,
  CalendarDays,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";
import OrderTimeline, { type OrderStatusType } from "@/components/OrderTimeline";

interface TrackResult {
  orderId: string;
  orderStatus: OrderStatusType;
  paymentStatus: string;
  shippingMethod: "STANDARD" | "EXPRESS";
  estimatedDelivery?: string;
  createdAt?: string;
  timeline: {
    status: string;
    label: string;
    completed: boolean;
    isCurrent: boolean;
  }[];
}

interface FullOrder {
  orderId: string;
  orderStatus: OrderStatusType;
  paymentStatus?: string;
  shippingMethod?: "STANDARD" | "EXPRESS";
  estimatedDelivery?: string;
  createdAt?: string;
  items: {
    name: string;
    image?: string;
    size?: string;
    color?: string;
    price?: number;
    quantity?: number;
  }[];
  address: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  total?: number;
  shipping?: number;
  subtotal?: number;
  discount?: number;
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
  const [min, max] = shippingMethod === "EXPRESS" ? [1, 3] : [3, 7];
  const a = new Date(now);
  const b = new Date(now);
  a.setDate(a.getDate() + min);
  b.setDate(b.getDate() + max);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(a)} – ${fmt(b)}`;
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

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId") || "";

  const [input, setInput] = useState(urlOrderId);
  const [trackData, setTrackData] = useState<TrackResult | null>(null);
  const [fullOrder, setFullOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(() => Boolean(urlOrderId));
  const [error, setError] = useState("");

  const currentId = trackData?.orderId || "";

  const track = useCallback(
    async (orderId: string) => {
      const id = orderId.trim();
      if (!id) {
        setError("Please enter your Order ID.");
        return;
      }
      setLoading(true);
      setError("");
      setTrackData(null);
      setFullOrder(null);
      try {
        const res = await fetch(`/api/orders/track/${encodeURIComponent(id)}`);
        const data = (await res.json()) as { error?: string } & TrackResult;
        if (!res.ok || !data.orderId) {
          setError(data.error || "Order not found.");
          return;
        }
        setTrackData({
          orderId: data.orderId,
          orderStatus: data.orderStatus,
          paymentStatus: data.paymentStatus,
          shippingMethod: data.shippingMethod,
          estimatedDelivery: data.estimatedDelivery,
          createdAt: data.createdAt,
          timeline: data.timeline,
        });

        const detailRes = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        if (detailRes.ok) {
          const detail = (await detailRes.json()) as { order?: FullOrder };
          if (detail.order) setFullOrder(detail.order);
        }
      } catch {
        setError("Network error while tracking your order.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!urlOrderId) return;
    let cancelled = false;

    const loadFromUrl = async () => {
      try {
        await Promise.resolve();
        const id = urlOrderId.trim();
        const res = await fetch(`/api/orders/track/${encodeURIComponent(id)}`);
        const data = (await res.json()) as { error?: string } & TrackResult;
        if (cancelled) return;
        if (!res.ok || !data.orderId) {
          setError(data.error || "Order not found.");
          return;
        }
        setTrackData({
          orderId: data.orderId,
          orderStatus: data.orderStatus,
          paymentStatus: data.paymentStatus,
          shippingMethod: data.shippingMethod,
          estimatedDelivery: data.estimatedDelivery,
          createdAt: data.createdAt,
          timeline: data.timeline,
        });

        const detailRes = await fetch(
          `/api/orders/${encodeURIComponent(id)}`,
          { credentials: "include" },
        );
        if (!detailRes.ok) return;
        const detail = (await detailRes.json()) as { order?: FullOrder };
        if (!cancelled && detail.order) setFullOrder(detail.order);
      } catch {
        if (!cancelled) setError("Network error while tracking your order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFromUrl();
    return () => {
      cancelled = true;
    };
  }, [urlOrderId]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
          <Truck size={13} />
          Order Tracking
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Track your order
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-text-muted)]">
          Enter your Order ID (e.g. VKXXXXXXXXXX) to see live status of your
          delivery.
        </p>
      </motion.div>

      {/* Track input */}
      {!currentId && !loading && (
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={(e) => {
            e.preventDefault();
            track(input);
          }}
          className="glass-card mx-auto flex max-w-xl flex-col gap-3 p-5 sm:flex-row"
        >
          <div className="relative flex-1">
            <PackageSearch
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value.toUpperCase().replace(/\s/g, ""))
              }
              placeholder="e.g. VKABCD123456"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-3 pl-11 pr-3 font-mono text-sm tracking-wider text-[var(--color-text)] placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-70"
          >
            {loading ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <Search size={16} />
                Track
              </>
            )}
          </button>
        </motion.form>
      )}

      {/* Error */}
      {error && !currentId && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-6 flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-5 py-4 text-sm text-[var(--color-secondary)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 text-xs font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mx-auto mt-10 max-w-2xl space-y-4">
          <div className="glass-card p-8">
            <div className="skeleton mb-2 h-6 w-48" />
            <div className="skeleton mb-6 h-4 w-64" />
            <div className="flex gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {trackData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-10 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Order ID
              </p>
              <p className="mt-1 font-mono text-xl font-bold tracking-wide">
                {currentId}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${STATUS_BADGE[trackData.orderStatus] || STATUS_BADGE.ORDER_PLACED}`}
            >
              {statusLabel(trackData.orderStatus)}
            </span>
          </div>

          <div className="glass-card overflow-x-auto p-6 sm:p-8">
            <OrderTimeline orderStatus={trackData.orderStatus} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]">
                <CalendarDays size={16} />
              </span>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Order Date
              </p>
              <p className="mt-1 text-sm font-bold">
                {formatDate(trackData.createdAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]">
                <Truck size={16} />
              </span>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Estimated Delivery
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--color-primary-light)]">
                {formatDeliveryRange(trackData.shippingMethod)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <ArrowRight size={16} />
              </span>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Payment
              </p>
              <p className="mt-1 text-sm font-bold">
                {trackData.paymentStatus === "PAID" ? "Paid" : trackData.paymentStatus}
              </p>
            </div>
          </div>

          {/* Items */}
          {fullOrder && fullOrder.items.length > 0 && (
            <div className="glass-card p-6 sm:p-8">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
                <PackageSearch size={18} className="text-[var(--color-primary-light)]" />
                Items in this order
              </h2>
              <div className="space-y-4">
                {fullOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                          <PackageSearch size={18} />
                        </div>
                      )}
                      {item.quantity && item.quantity > 1 && (
                        <span className="absolute bottom-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-tl-lg bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
                          {item.quantity}×
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {item.size && `Size ${item.size}`}
                        {item.size && item.color ? " · " : ""}
                        {item.color}
                      </p>
                    </div>
                    {typeof item.price === "number" && (
                      <p className="text-sm font-bold">
                        {inr(item.price * (item.quantity || 1))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          {fullOrder?.address && (
            <div className="glass-card p-6 sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <MapPin size={18} className="text-[var(--color-primary-light)]" />
                Delivery Address
              </h2>
              <p className="font-semibold">{fullOrder.address.fullName || "—"}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {[
                  fullOrder.address.addressLine1,
                  fullOrder.address.addressLine2,
                  fullOrder.address.city,
                  fullOrder.address.state,
                  fullOrder.address.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {fullOrder.address.phone && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {fullOrder.address.phone}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/orders" className="btn btn-outline">
              View My Orders
              <ArrowRight size={15} />
            </Link>
            <Link href="/shop" className="btn btn-ghost">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="skeleton h-24 w-24 rounded-2xl" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}