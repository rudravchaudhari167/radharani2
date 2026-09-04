"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  active: string;
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { key: "products", label: "Products", icon: Package, href: "/admin/products" },
  { key: "orders", label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
  { key: "users", label: "Users", icon: Users, href: "/admin/users" },
  { key: "coupons", label: "Coupons", icon: Ticket, href: "/admin/coupons" },
  { key: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
];

interface AdminUser {
  name: string;
  email: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function SidebarContent({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-6 pb-6 pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-lg font-black text-white shadow-lg shadow-[var(--color-primary)]/40">
            V
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-[0.18em] text-[var(--color-text)]">
              Radha Rani
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-primary-light)]">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "text-white"
                  : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/30"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary-light)]/40 hover:text-[var(--color-text)]"
        >
          <ExternalLink size={14} />
          View Store
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children, active }: AdminLayoutProps) {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include" });
        const data = (await res.json()) as {
          admin?: AdminUser;
          authenticated?: boolean;
        };
        if (cancelled) return;
        if (!res.ok || !data.authenticated || !data.admin) {
          router.replace("/admin/login");
          return;
        }
        setAdmin(data.admin);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore network errors, still redirect
    } finally {
      setLoggingOut(false);
      router.replace("/admin/login");
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <LoaderCircle size={40} className="animate-spin text-[var(--color-primary-light)]" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]/70 backdrop-blur-xl lg:block">
        <SidebarContent active={active} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] lg:hidden"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="absolute right-4 top-5 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]"
              >
                <X size={20} />
              </button>
              <SidebarContent
                active={active}
                onNavigate={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-xl border border-[var(--color-border)] bg-white/5 p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="hidden items-center gap-2 text-sm text-[var(--color-text-muted)] lg:flex">
            <span className="font-bold uppercase tracking-[0.25em] text-[var(--color-primary-light)]">
              RADHA RANI ADMIN
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline-flex"
            >
              <ExternalLink size={14} />
              View Store
            </Link>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 py-1.5 pl-1.5 pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-xs font-bold text-white">
                {getInitials(admin.name)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[120px] truncate text-xs font-semibold">
                  {admin.name}
                </p>
                <p className="max-w-[140px] truncate text-[10px] text-[var(--color-text-muted)]">
                  {admin.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white/5 px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)] disabled:opacity-50"
            >
              {loggingOut ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
