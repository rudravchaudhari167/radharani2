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
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

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
  items?: OrderItem[];
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
        <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#666666]">
          Loading Order Confirmation…
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-28 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F1EA] text-[#666666]">
          <PackageSearch size={32} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-2xl font-light text-[#171717]">
          Order Not Found
        </h1>
        <p className="mt-2 text-sm text-[#666666]">
          {error || "We could not find your order details. Please verify the link."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="bg-[#171717] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2D4A6B]"
          >
            Return to Shop
          </Link>
          <Link
            href="/track-order"
            className="border border-[#E7E3DC] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-[#666666] hover:text-[#171717]"
          >
            Track Order
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
    <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-24 text-[#171717]">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-[#171717] text-white shadow-sm"
          >
            <Check size={36} strokeWidth={2.5} />
          </motion.div>
        </div>

        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2D4A6B]">
            Payment Successful
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light tracking-tight sm:text-4xl">
            Thank you for your order
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            {user?.name ? `${user.name.split(" ")[0]}, your` : "Your"} piece from
            VRINDAV has been confirmed. A receipt has been dispatched to your
            registered email.
          </p>
        </motion.div>

        {/* Order ID Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex items-center justify-between rounded-sm border border-[#E7E3DC] bg-white px-5 py-4"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
              Order Number
            </p>
            <p className="font-mono text-sm font-semibold tracking-wide text-[#171717]">
              {order.orderId}
            </p>
          </div>
          <button
            type="button"
            onClick={copyOrderId}
            className="inline-flex items-center gap-1.5 border border-[#E7E3DC] px-3 py-1.5 text-xs text-[#666666] transition-colors hover:text-[#171717]"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
        </motion.div>

        {/* Details Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-[#E7E3DC] bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-[#666666]">
              <CalendarDays size={15} />
              <span className="uppercase tracking-wider">Date</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#171717]">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="rounded-sm border border-[#E7E3DC] bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-[#666666]">
              <CreditCard size={15} />
              <span className="uppercase tracking-wider">Total Amount</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#171717]">
              {inr(order.total || 0)}
            </p>
          </div>
          <div className="rounded-sm border border-[#E7E3DC] bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-[#666666]">
              <Truck size={15} />
              <span className="uppercase tracking-wider">Estimated Delivery</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#171717]">
              {formatDeliveryRange(order.shippingMethod)}
            </p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mt-6 rounded-sm border border-[#E7E3DC] bg-white p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#666666]">
            <MapPin size={14} />
            Delivery Destination
          </div>
          <p className="mt-3 text-sm font-semibold text-[#171717]">
            {order.address?.fullName || "—"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#666666]">
            {fullAddress}
          </p>
          {order.address?.phone && (
            <p className="mt-2 text-xs text-[#666666]">
              Phone: {order.address.phone}
            </p>
          )}
        </div>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
            className="inline-flex items-center gap-2 bg-[#171717] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2D4A6B]"
          >
            Track Shipment
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/shop"
            className="border border-[#E7E3DC] bg-white px-8 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[#171717] hover:border-[#171717]"
          >
            Continue Browsing
          </Link>
        </div>

        {/* Brand Note */}
        <div className="mt-14 border-t border-[#E7E3DC] pt-8 text-center">
          <p className="font-serif italic text-sm text-[#666666]">
            &ldquo;Divine Style. Eternal Bond.&rdquo;
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#999999]">
            VRINDAV Atelier
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 pt-28">
          <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
