"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import SearchOverlay from "@/components/SearchOverlay";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop/women", label: "Women" },
  { href: "/collections", label: "Collections" },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.totalItems);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const wishlistCount = useWishlistStore((s) => s.totalItems);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/shop") return pathname === "/shop";
    if (href !== "/" && href !== "/shop" && pathname.startsWith(href)) return true;
    return false;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 shadow-xs backdrop-blur-md"
            : "h-20 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/85 backdrop-blur-xs"
        }`}
      >
        <div className="mx-auto flex h-full w-full max-w-[80rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ======================================================== */}
          {/* DESKTOP LEFT: Navigation Links                             */}
          {/* ======================================================== */}
          <nav className="hidden flex-1 items-center gap-6 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link, idx) => (
              <Link
                key={`${link.label}-${idx}`}
                href={link.href}
                className={`text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-[var(--color-accent)] font-semibold"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ======================================================== */}
          {/* MOBILE LEFT: Hamburger Menu                              */}
          {/* ======================================================== */}
          <div className="flex flex-1 items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center -ml-2 text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]"
              aria-label="Open mobile menu"
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>
          </div>

          {/* ======================================================== */}
          {/* CENTER: RADHA RANI Logo                                  */}
          {/* ======================================================== */}
          <div className="flex shrink-0 items-center justify-center">
            <Link
              href="/"
              className="group flex flex-col items-center justify-center text-center"
              aria-label="Radha Rani home"
            >
              <span className="font-serif text-xl sm:text-2xl font-normal tracking-[0.22em] text-[var(--color-text)] transition-opacity group-hover:opacity-90">
                RADHA RANI
              </span>
              <span className="text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)] font-medium -mt-0.5">
                Atelier de Dévotion
              </span>
            </Link>
          </div>

          {/* ======================================================== */}
          {/* DESKTOP RIGHT: Search, Account, Wishlist, Cart           */}
          {/* ======================================================== */}
          <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label="Search collection"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>

            <Link
              href={user ? "/account" : "/login"}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label={user ? "My account" : "Log in"}
            >
              <User size={18} strokeWidth={1.75} />
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-full border border-[var(--color-primary-light)]/40 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)] transition-all hover:bg-[var(--color-primary)] hover:text-white lg:inline-flex"
                aria-label="Admin Panel"
              >
                <ShieldCheck size={13} />
                <span>Admin</span>
              </Link>
            )}

            <Link
              href="/wishlist"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                wishlistCount > 0
                  ? "text-red-500 hover:text-red-600"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              aria-label={`Wishlist (${wishlistCount})`}
            >
              <Heart
                size={18}
                strokeWidth={1.75}
                className={wishlistCount > 0 ? "fill-red-500 text-red-500" : ""}
              />
              <Badge count={wishlistCount} />
            </Link>

            <button
              type="button"
              onClick={() => openCartDrawer()}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label={`Shopping bag (${cartCount})`}
            >
              <ShoppingBag size={18} strokeWidth={1.75} />
              <Badge count={cartCount} />
            </button>
          </div>

          {/* ======================================================== */}
          {/* MOBILE RIGHT: Search + Cart                              */}
          {/* ======================================================== */}
          <div className="flex flex-1 items-center justify-end gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label="Search"
            >
              <Search size={20} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => openCartDrawer()}
              className="relative flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label={`Cart (${cartCount})`}
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              <Badge count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for sticky header */}
      <div className="h-20" aria-hidden="true" />

      {/* ======================================================== */}
      {/* MOBILE DRAWER (Left Slide-Over)                           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative z-10 flex h-full w-4/5 max-w-sm flex-col bg-[var(--color-bg)] border-r border-[var(--color-border)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col"
                >
                  <span className="font-serif text-lg tracking-[0.2em] font-normal text-[var(--color-text)]">
                    RADHA RANI
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-[var(--color-accent)] font-medium">
                    Atelier de Dévotion
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)]"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <nav className="flex flex-col space-y-4">
                  {NAV_LINKS.map((link, idx) => (
                    <Link
                      key={`${link.label}-${idx}`}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`text-sm tracking-[0.14em] uppercase py-2 transition-colors ${
                        isActive(link.href)
                          ? "text-[var(--color-accent)] font-semibold"
                          : "text-[var(--color-text)] hover:text-[var(--color-accent)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <Link
                      href="/wishlist"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between py-2 text-sm tracking-[0.14em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      <span>Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="text-xs text-[var(--color-accent)] font-semibold">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm tracking-[0.14em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Brand Story
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm tracking-[0.14em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Contact & Help
                    </Link>
                  </div>
                </nav>
              </div>

              <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 text-sm font-medium text-[var(--color-text)]"
                    >
                      <User size={18} className="text-[var(--color-accent)]" />
                      <span className="truncate">{user.name}</span>
                    </Link>
                    {user?.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-light)]"
                      >
                        <ShieldCheck size={16} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 text-xs tracking-wider uppercase text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center rounded-full border border-[var(--color-border)] py-2.5 text-xs font-medium uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center rounded-full bg-[var(--color-accent)] py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--color-accent-light)]"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}