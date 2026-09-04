"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  PackageSearch,
  ChevronRight,
  ArrowRight,
  Settings,
} from "lucide-react";
import AccountLayout from "@/components/AccountLayout";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

interface OrderSummary {
  orderId: string;
  items: { name: string; image?: string }[];
  total?: number;
  orderStatus?: string;
  paymentStatus?: string;
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

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-12 w-72" />
      <div className="skeleton h-6 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="skeleton mb-3 h-10 w-10 rounded-xl" />
            <div className="skeleton mb-2 h-5 w-16" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const cartItems = useCartStore((s) => s.items);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const wishlistItems = useWishlistStore((s) => s.items);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addressCount, setAddressCount] = useState(0);

  const loggedIn = Boolean(user);
  const gateLoading = !initialized;

  useEffect(() => {
    if (gateLoading) return;
    if (!loggedIn) {
      router.replace("/login?redirect=/account");
      return;
    }

    fetchCart();
    fetchWishlist();

    const loadOrders = async () => {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        const data = (await res.json()) as { orders?: OrderSummary[] };
        if (res.ok && data.orders) setOrders(data.orders);
      } catch {
        // ignore
      } finally {
        setOrdersLoading(false);
      }
    };

    const loadAddresses = async () => {
      try {
        const res = await fetch("/api/addresses", { credentials: "include" });
        const data = (await res.json()) as { addresses?: unknown[] };
        if (res.ok && data.addresses) setAddressCount(data.addresses.length);
      } catch {
        // ignore
      }
    };

    loadOrders();
    loadAddresses();
  }, [loggedIn, gateLoading, router, fetchCart, fetchWishlist]);

  if (gateLoading || (!initialized && !user)) {
    return (
      <AccountLayout activeKey="account">
        <AccountSkeleton />
      </AccountLayout>
    );
  }

  if (!loggedIn) return null;

  const recentOrders = orders.slice(0, 3);
  const previewWishlist = wishlistItems.slice(0, 4);

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: ShoppingBag,
      color: "from-[var(--color-primary)] to-[var(--color-secondary)]",
    },
    {
      label: "Wishlist",
      value: wishlistItems.length,
      icon: Heart,
      color: "from-pink-500 to-rose-500",
    },
    {
      label: "Cart Items",
      value: cartItems.reduce((s, i) => s + i.quantity, 0),
      icon: PackageSearch,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Addresses",
      value: addressCount,
      icon: MapPin,
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <AccountLayout activeKey="account">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
          <User size={13} />
          Account Overview
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Namaste, {user?.name?.split(" ")[0] || "Friend"}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Welcome to your divine dashboard. Here&apos;s what&apos;s happening with your account.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 + index * 0.07 }}
              className="glass-card p-5"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
              >
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <PackageSearch size={18} className="text-[var(--color-primary-light)]" />
            Recent Orders
          </h2>
          {orders.length > 0 && (
            <Link
              href="/orders"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
            >
              View All
              <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-center gap-4">
                  <div className="skeleton h-14 w-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-3 w-56" />
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <PackageSearch size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No orders yet</p>
            <Link href="/shop" className="btn btn-primary mt-4">
              Start Shopping
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + index * 0.07 }}
              >
                <Link
                  href={`/orders/${encodeURIComponent(order.orderId)}`}
                  className="glass-card group flex flex-col gap-4 p-5 transition-all hover:border-[var(--color-primary-light)]/40 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)] sm:flex-row sm:items-center"
                >
                  <div className="flex shrink-0 items-center">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="relative h-12 w-12 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white/5"
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
                              <ShoppingBag size={14} />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary-light)]">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold tracking-wide">
                      {order.orderId}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {formatDate(order.createdAt)} · {order.items.length} item(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    {order.orderStatus && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_BADGE[order.orderStatus] || "bg-white/10 text-[var(--color-text-muted)]"
                        }`}
                      >
                        {statusLabel(order.orderStatus)}
                      </span>
                    )}
                    {typeof order.total === "number" && (
                      <p className="text-sm font-bold">{inr(order.total)}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Wishlist Preview */}
      {previewWishlist.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Heart size={18} className="text-pink-400" />
              Wishlist
            </h2>
            <Link
              href="/wishlist"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
            >
              View All
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {previewWishlist.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.06 }}
              >
                <Link
                  href={`/product/${item.slug || item.productId}`}
                  className="glass-card group block overflow-hidden transition-all hover:border-[var(--color-primary-light)]/40"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-[var(--color-text-muted)]">
                        <Heart size={20} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-xs font-medium">{item.name}</p>
                    <p className="mt-1 text-sm font-bold">{inr(item.price)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick Links */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Settings size={18} className="text-[var(--color-primary-light)]" />
          Quick Links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { href: "/account/addresses", label: "Manage Addresses", icon: MapPin, desc: "Add, edit or remove delivery addresses" },
            { href: "/account/settings", label: "Account Settings", icon: Settings, desc: "Update preferences and security" },
          ].map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.06 }}
              >
                <Link
                  href={link.href}
                  className="glass-card group flex items-center gap-4 p-5 transition-all hover:border-[var(--color-primary-light)]/40 hover:shadow-[0_0_24px_rgba(124,58,237,0.1)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/15 text-[var(--color-primary-light)]">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{link.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{link.desc}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </AccountLayout>
  );
}
