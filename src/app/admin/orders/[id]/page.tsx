"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  Tag,
  ArrowLeft,
  LoaderCircle,
  AlertTriangle,
  FileClock,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useToastStore } from "@/lib/toast-store";

interface OrderItem {
  name: string;
  price: number;
  image?: string;
  size?: string;
  color?: string;
  quantity?: number;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  paymentStatus: string;
  paymentId?: string;
  orderStatus: string;
  shippingMethod: "STANDARD" | "EXPRESS";
  createdAt: string;
  address: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  userId?: { name?: string; email?: string; phone?: string };
}

const ORDER_STATUSES = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

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

const PAYMENT_BADGE: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
  REFUNDED: "bg-sky-500/15 text-sky-400",
};

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

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

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const addToast = useToastStore((s) => s.addToast);

  const [id, setId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { id: resolvedId } = await params;
        if (cancelled) return;
        setId(resolvedId);
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(resolvedId)}`, {
          credentials: "include",
        });
        const data = (await res.json()) as { order?: Order; error?: string };
        if (!res.ok || !data.order) {
          if (!cancelled) setError(data.error || "Order not found.");
          return;
        }
        if (!cancelled) setOrder(data.order);
      } catch {
        if (!cancelled) setError("Could not load this order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderStatus: status }),
      });
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok) {
        addToast(data.error || "Could not update status.", "error");
        return;
      }
      setOrder(data.order || order);
      addToast("Order status updated", "success");
    } catch {
      addToast("Network error. Could not update status.", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="orders">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="skeleton h-10 w-64" />
          <div className="glass-card h-64 p-6">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton mt-5 h-4 w-3/4" />
            <div className="skeleton mt-3 h-4 w-1/2" />
          </div>
          <div className="glass-card h-72 p-6">
            <div className="skeleton h-6 w-40" />
            <div className="mt-5 space-y-3">
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout active="orders">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <AlertTriangle size={30} className="mb-4 text-[var(--color-secondary)]" />
          <h2 className="text-xl font-black">Could not load order</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
          <Link href="/admin/orders" className="btn btn-primary mt-6">
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
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
    <AdminLayout active="orders">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
          >
            <ArrowLeft size={14} />
            Back to Orders
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-black tracking-wide sm:text-3xl">
                {order.orderId}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  STATUS_BADGE[order.orderStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                }`}
              >
                {STATUS_LABEL[order.orderStatus] || order.orderStatus}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  PAYMENT_BADGE[order.paymentStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                }`}
              >
                Payment {order.paymentStatus.toLowerCase()}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Placed on {formatDateLong(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Status update */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <RefreshCw size={18} className="text-[var(--color-primary-light)]" />
                Update Order Status
              </h2>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => {
                  const active = order.orderStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={updating}
                      onClick={() => updateStatus(status)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                        active
                          ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-primary)]/30"
                          : "border border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {STATUS_LABEL[status] || status}
                    </button>
                  );
                })}
              </div>
              {updating && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <LoaderCircle size={14} className="animate-spin" />
                  Saving…
                </p>
              )}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 p-3 text-xs text-[var(--color-text-muted)]">
                <FileClock size={14} className="mt-0.5 shrink-0 text-[var(--color-primary-light)]" />
                All status changes are recorded in the audit log with the admin&apos;s
                identity and timestamp.
              </div>
            </motion.section>

            {/* Items */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <ShoppingBag size={18} className="text-[var(--color-primary-light)]" />
                Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
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
                          <ShoppingBag size={16} />
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
                    <p className="shrink-0 text-sm font-bold">
                      {inr(item.price * (item.quantity || 1))}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Payment info */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <CreditCard size={18} className="text-[var(--color-primary-light)]" />
                Payment Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Payment Status</p>
                  <p className="mt-1 font-semibold">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        PAYMENT_BADGE[order.paymentStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Payment ID</p>
                  <p className="mt-1 break-all font-mono text-xs font-semibold">
                    {order.paymentId || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Shipping Method</p>
                  <p className="mt-1 font-semibold">
                    {order.shippingMethod === "EXPRESS" ? "Express" : "Standard"}
                  </p>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Price breakdown */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card overflow-hidden"
            >
              <div className="border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="text-lg font-bold">Price Details</h2>
              </div>
              <div className="space-y-3 px-6 py-5 text-sm">
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--color-text)]">{inr(order.subtotal)}</span>
                </div>
                {order.couponCode && (
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} className="text-[var(--color-primary-light)]" />
                      Coupon ({order.couponCode})
                    </span>
                    <span>-{inr(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Shipping</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {order.shipping === 0 ? (
                      <span className="text-emerald-400">FREE</span>
                    ) : (
                      inr(order.shipping)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                  <span className="text-base font-bold">Total</span>
                  <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] bg-clip-text text-2xl font-black text-transparent">
                    {inr(order.total)}
                  </span>
                </div>
              </div>
            </motion.section>

            {/* Customer */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h2 className="mb-3 text-lg font-bold">Customer</h2>
              <p className="font-semibold">
                {order.userId?.name || order.address?.fullName || "Guest"}
              </p>
              {(order.userId?.email || order.address?.email) && (
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {order.userId?.email || order.address?.email}
                </p>
              )}
              {(order.userId?.phone || order.address?.phone) && (
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {order.userId?.phone || order.address?.phone}
                </p>
              )}
            </motion.section>

            {/* Address */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <MapPin size={15} />
                Delivery Address
              </h2>
              <p className="font-semibold">{order.address?.fullName || "—"}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {fullAddress}
              </p>
              {order.address?.landmark && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Landmark: {order.address.landmark}
                </p>
              )}
              {order.address?.phone && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {order.address.phone}
                </p>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-6"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                <Truck size={15} />
                Shipping
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {order.shippingMethod === "EXPRESS" ? "Express" : "Standard"} delivery
              </p>
            </motion.section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
