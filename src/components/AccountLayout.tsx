"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface AccountLayoutProps {
  children: React.ReactNode;
  activeKey: string;
}

const NAV_ITEMS = [
  { key: "account", label: "My Account", icon: User, href: "/account" },
  { key: "orders", label: "Orders", icon: ShoppingBag, href: "/orders" },
  { key: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist" },
  { key: "addresses", label: "Addresses", icon: MapPin, href: "/account/addresses" },
  { key: "settings", label: "Settings", icon: Settings, href: "/account/settings" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AccountLayout({ children, activeKey }: AccountLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      {/* Mobile horizontal tabs */}
      <div className="mb-6 lg:hidden">
        <div className="flex items-center gap-3 pb-4">
          {user && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-sm font-bold text-white">
              {getInitials(user.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name || "Account"}</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2 pb-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-primary)]/30"
                      : "border border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:border-[var(--color-primary-light)]/30 hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 lg:gap-8">
        {/* Desktop sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden w-64 shrink-0 lg:block"
        >
          <div className="glass-card sticky top-24 overflow-hidden">
            {/* User header */}
            <div className="border-b border-[var(--color-border)] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-base font-bold text-white shadow-lg shadow-[var(--color-primary)]/30">
                  {user ? getInitials(user.name) : "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user?.name || "Guest"}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {user?.phone || user?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/15 text-[var(--color-primary-light)] shadow-sm"
                        : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-[var(--color-border)]" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-secondary)]/10 hover:text-[var(--color-secondary)]"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </div>
        </motion.aside>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-w-0 flex-1"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
