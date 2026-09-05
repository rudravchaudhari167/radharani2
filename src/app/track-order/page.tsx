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
  ShieldCheck,
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
          setError(data.error || "Order not found. Please verify the ID.");
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
    <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-24 text-[#171717]">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
            <Truck size={14} />
            Live Shipment Tracker
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light tracking-tight text-[#171717] sm:text-4xl">
            Track Your Order
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#666666]">
            Enter your order reference number to follow the journey of your
            tailored pieces.
          </p>
        </div>

        {/* Search input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            track(input);
          }}
          className="mx-auto flex max-w-xl flex-col gap-2 rounded-sm border border-[#E7E3DC] bg-white p-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <PackageSearch
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]"
            />
            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value.toUpperCase().replace(/\s/g, ""))
              }
              placeholder="e.g. VKABCD123456"
              className="w-full bg-transparent py-2.5 pl-10 pr-3 font-mono text-xs uppercase tracking-wider text-[#171717] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#999999] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-[#171717] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#2D4A6B] disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search size={14} />
                Track
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mx-auto mt-6 flex max-w-xl items-center justify-between rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            <div className="h-40 w-full animate-pulse rounded-sm border border-[#E7E3DC] bg-white p-6" />
          </div>
        )}

        {/* Results */}
        {trackData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 space-y-8"
          >
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#E7E3DC] bg-white p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
                  Order Number
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-[#171717]">
                  {currentId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
                  Current Status
                </p>
                <span className="mt-1 inline-block rounded bg-[#171717] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  {statusLabel(trackData.orderStatus)}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-8">
              <h2 className="mb-6 font-serif text-lg font-medium text-[#171717]">
                Shipment Progress
              </h2>
              <OrderTimeline orderStatus={trackData.orderStatus} />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-sm border border-[#E7E3DC] bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF9F6] text-[#2D4A6B]">
                  <CalendarDays size={16} />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
                  Placed On
                </p>
                <p className="mt-1 text-sm font-semibold text-[#171717]">
                  {formatDate(trackData.createdAt)}
                </p>
              </div>
              <div className="rounded-sm border border-[#E7E3DC] bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF9F6] text-[#2D4A6B]">
                  <Truck size={16} />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
                  Estimated Delivery
                </p>
                <p className="mt-1 text-sm font-semibold text-[#171717]">
                  {formatDeliveryRange(trackData.shippingMethod)}
                </p>
              </div>
              <div className="rounded-sm border border-[#E7E3DC] bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF9F6] text-[#2D4A6B]">
                  <ShieldCheck size={16} />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
                  Payment Status
                </p>
                <p className="mt-1 text-sm font-semibold text-[#171717]">
                  {trackData.paymentStatus === "PAID" ? "Confirmed & Paid" : trackData.paymentStatus}
                </p>
              </div>
            </div>

            {/* Items */}
            {fullOrder && fullOrder.items.length > 0 && (
              <div className="rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-8">
                <h2 className="mb-5 font-serif text-lg font-medium text-[#171717]">
                  Items in Package ({fullOrder.items.length})
                </h2>
                <div className="space-y-4">
                  {fullOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 border-b border-[#E7E3DC] pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-sm border border-[#E7E3DC] bg-[#FAF9F6]">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#999999]">
                              <PackageSearch size={14} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#171717]">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#666666]">
                            {item.size && `Size ${item.size}`}
                            {item.size && item.color ? " · " : ""}
                            {item.color}
                            {item.quantity && item.quantity > 1 ? ` · Qty: ${item.quantity}` : ""}
                          </p>
                        </div>
                      </div>
                      {typeof item.price === "number" && (
                        <p className="text-xs font-semibold text-[#171717]">
                          {inr(item.price * (item.quantity || 1))}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery destination */}
            {fullOrder?.address && (
              <div className="rounded-sm border border-[#E7E3DC] bg-white p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#666666]">
                  <MapPin size={14} />
                  Delivery Destination
                </div>
                <p className="mt-3 text-sm font-semibold text-[#171717]">
                  {fullOrder.address.fullName || "—"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#666666]">
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
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-2 bg-[#171717] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#2D4A6B]"
              >
                All Orders
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/shop"
                className="border border-[#E7E3DC] bg-white px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-[#666666] hover:text-[#171717]"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}