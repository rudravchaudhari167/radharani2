"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  { key: "account", label: "Overview", icon: User, href: "/account" },
  { key: "orders", label: "My Orders", icon: ShoppingBag, href: "/orders" },
  { key: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist" },
  { key: "addresses", label: "Saved Addresses", icon: MapPin, href: "/account/addresses" },
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
    <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-24 text-[#171717]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile horizontal tabs */}
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-3 border-b border-[#E7E3DC] pb-4">
            {user && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-xs font-bold text-white">
                {getInitials(user.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#171717]">
                {user?.name || "Client"}
              </p>
              <p className="truncate text-xs text-[#666666]">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pt-3">
            <div className="flex gap-2 pb-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-1.5 rounded-sm px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                      active
                        ? "bg-[#171717] text-white"
                        : "border border-[#E7E3DC] bg-white text-[#666666] hover:text-[#171717]"
                    }`}
                  >
                    <Icon size={13} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[#E7E3DC] bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#666666] hover:text-red-600"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-28 rounded-sm border border-[#E7E3DC] bg-white p-5">
              {/* User header */}
              <div className="border-b border-[#E7E3DC] pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171717] text-sm font-bold text-white">
                    {user ? getInitials(user.name) : "V"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#171717]">
                      {user?.name || "Member"}
                    </p>
                    <p className="truncate text-xs text-[#666666]">
                      {user?.phone || user?.email || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nav links */}
              <nav className="space-y-1 pt-4">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeKey === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                        active
                          ? "bg-[#FAF9F6] text-[#171717] font-semibold"
                          : "text-[#666666] hover:bg-[#FAF9F6] hover:text-[#171717]"
                      }`}
                    >
                      <Icon size={15} />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-3 border-t border-[#E7E3DC]" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-sm px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-[#666666] transition-colors hover:text-red-600"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
