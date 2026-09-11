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
  ShieldCheck,
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
    <div className="flex h-full flex-col bg-white text-[#171717]">
      {/* Logo */}
      <div className="border-b border-[#E7E3DC] px-6 pb-6 pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#171717] text-sm font-semibold tracking-wider text-white">
            R
          </div>
          <div className="min-w-0">
            <p className="font-serif text-sm font-normal tracking-[0.25em] text-[#171717]">
              RADHA RANI
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#2D4A6B]">
              Executive Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-[#FAF9F6] text-[#171717] font-semibold border-l-2 border-[#171717]"
                  : "text-[#666666] hover:bg-[#FAF9F6] hover:text-[#171717]"
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E7E3DC] p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-[#666666] transition-colors hover:border-[#171717] hover:text-[#171717]"
        >
          <ExternalLink size={13} />
          View Storefront
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
      // ignore
    } finally {
      setLoggingOut(false);
      router.replace("/admin/login");
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#FAF9F6]">
        <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#FAF9F6] text-[#171717]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[#E7E3DC] bg-white lg:block">
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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[#E7E3DC] bg-white lg:hidden"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="absolute right-4 top-5 rounded p-1 text-[#666666] hover:text-[#171717]"
              >
                <X size={18} />
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#E7E3DC] bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded border border-[#E7E3DC] p-2 text-[#666666] hover:text-[#171717] lg:hidden"
          >
            <Menu size={16} />
          </button>

          <div className="hidden items-center gap-2 text-xs text-[#666666] lg:flex">
            <ShieldCheck size={14} className="text-[#2D4A6B]" />
            <span className="font-semibold uppercase tracking-[0.25em] text-[#171717]">
              RADHA RANI ATELIER CONTROL
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-sm border border-[#E7E3DC] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#666666] transition-colors hover:text-[#171717] sm:inline-flex"
            >
              <ExternalLink size={13} />
              Storefront
            </Link>

            <div className="flex items-center gap-2 rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] py-1 pl-1 pr-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#171717] text-[10px] font-bold text-white">
                {getInitials(admin.name)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[120px] truncate text-xs font-semibold text-[#171717]">
                  {admin.name}
                </p>
                <p className="max-w-[140px] truncate text-[9px] text-[#666666]">
                  {admin.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#E7E3DC] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#666666] transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              {loggingOut ? (
                <LoaderCircle size={13} className="animate-spin" />
              ) : (
                <LogOut size={13} />
              )}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
