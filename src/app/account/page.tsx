"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  MapPin,
  PackageSearch,
  ChevronRight,
  ArrowRight,
  User,
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

function statusLabel(status?: string): string {
  if (!status) return "Processing";
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
        <div className="space-y-4">
          <div className="h-10 w-64 animate-pulse rounded bg-[#F4F1EA]" />
          <div className="h-32 w-full animate-pulse rounded bg-[#F4F1EA]" />
        </div>
      </AccountLayout>
    );
  }

  if (!loggedIn) return null;

  const recentOrders = orders.slice(0, 3);

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: ShoppingBag,
      href: "/orders",
    },
    {
      label: "Saved Pieces",
      value: wishlistItems.length,
      icon: Heart,
      href: "/wishlist",
    },
    {
      label: "In Bag",
      value: cartItems.reduce((s, i) => s + i.quantity, 0),
      icon: PackageSearch,
      href: "/cart",
    },
    {
      label: "Addresses",
      value: addressCount,
      icon: MapPin,
      href: "/account/addresses",
    },
  ];

  return (
    <AccountLayout activeKey="account">
      {/* Welcome */}
      <div className="mb-8 border-b border-[#E7E3DC] pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
          Private Client Profile
        </p>
        <h1 className="mt-2 font-serif text-3xl font-light text-[#171717] sm:text-4xl">
          Welcome back, {user?.name?.split(" ")[0] || "Client"}
        </h1>
        <p className="mt-1 text-xs text-[#666666]">
          Manage your orders, saved addresses, and curation preferences.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-sm border border-[#E7E3DC] bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF9F6] text-[#2D4A6B]">
                <Icon size={16} />
              </div>
              <p className="font-serif text-2xl font-light text-[#171717]">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                {stat.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <section className="mb-10 rounded-sm border border-[#E7E3DC] bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[#E7E3DC] pb-4">
          <h2 className="font-serif text-lg font-medium text-[#171717]">
            Recent Orders
          </h2>
          {orders.length > 0 && (
            <Link
              href="/orders"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#2D4A6B] hover:underline"
            >
              View All ({orders.length})
              <ChevronRight size={13} />
            </Link>
          )}
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            <div className="h-16 w-full animate-pulse bg-[#F4F1EA]" />
            <div className="h-16 w-full animate-pulse bg-[#F4F1EA]" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-10 text-center">
            <PackageSearch size={32} className="mx-auto mb-3 text-[#999999]" />
            <p className="text-xs text-[#666666]">
              You haven&apos;t placed any orders yet.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center gap-2 bg-[#171717] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#2D4A6B]"
            >
              Explore Collection
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Link
                key={order.orderId}
                href={`/orders/${encodeURIComponent(order.orderId)}`}
                className="flex flex-col justify-between gap-4 border-b border-[#E7E3DC] pb-4 transition-colors last:border-b-0 last:pb-0 hover:bg-[#FAF9F6] sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-xs font-semibold text-[#171717]">
                      {order.orderId}
                    </p>
                    <span className="rounded bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#2D4A6B]">
                      {statusLabel(order.orderStatus)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#666666]">
                    {formatDate(order.createdAt)} · {order.items.length} item(s)
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  {typeof order.total === "number" && (
                    <p className="text-sm font-semibold text-[#171717]">
                      {inr(order.total)}
                    </p>
                  )}
                  <span className="flex items-center text-xs font-medium text-[#666666]">
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/account/addresses"
          className="rounded-sm border border-[#E7E3DC] bg-white p-6 transition-shadow hover:shadow-sm"
        >
          <MapPin size={20} className="text-[#2D4A6B]" />
          <h3 className="mt-3 font-serif text-base font-medium text-[#171717]">
            Saved Addresses
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#666666]">
            Add or edit primary shipping destinations for frictionless checkout.
          </p>
        </Link>
        <Link
          href="/account/settings"
          className="rounded-sm border border-[#E7E3DC] bg-white p-6 transition-shadow hover:shadow-sm"
        >
          <User size={20} className="text-[#2D4A6B]" />
          <h3 className="mt-3 font-serif text-base font-medium text-[#171717]">
            Profile Preferences
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#666666]">
            Update your registered name, phone number, and security credentials.
          </p>
        </Link>
      </div>
    </AccountLayout>
  );
}
