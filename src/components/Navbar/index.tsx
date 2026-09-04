"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import SearchOverlay from "@/components/SearchOverlay";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  {
    label: "Categories",
    children: [
      { href: "/category/men", label: "Men" },
      { href: "/category/women", label: "Women" },
      { href: "/category/unisex", label: "Unisex" },
      { href: "/category/kids", label: "Kids" },
      { href: "/category/accessories", label: "Accessories" },
    ],
  },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Badge({ count }: { count: number }) {
  return count > 0 ? (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] px-1 text-[10px] font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  ) : null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.totalItems);
  const wishlistCount = useWishlistStore((s) => s.totalItems);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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

  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed left-0 right-0 top-0 z-50 border-x-0 border-t-0 transition-all duration-500 ${
          scrolled
            ? "border-b border-[var(--color-border)] bg-[var(--color-bg)]/70 shadow-lg shadow-black/20 backdrop-blur-2xl"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="Radha Rani home"
          >
            <span
              className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-lg font-bold tracking-[0.25em] text-transparent transition-all duration-300 group-hover:tracking-[0.3em]"
            >
              Radha Rani
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              if (link.children) {
                const isOpen = activeDropdown === link.label;
                const hasActiveChild = link.children.some((c) =>
                  isActive(c.href),
                );

                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(link.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        hasActiveChild
                          ? "bg-white/10 text-[var(--color-primary-light)]"
                          : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 shadow-2xl backdrop-blur-xl"
                        >
                          <div className="p-1.5">
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setActiveDropdown(null)}
                                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                  isActive(child.href)
                                    ? "bg-white/10 text-[var(--color-primary-light)]"
                                    : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-white/10 text-[var(--color-primary-light)]"
                      : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>

            <Link
              href={user ? "/account" : "/login"}
              className="hidden rounded-full p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)] sm:block"
              aria-label={user ? "My account" : "Log in"}
            >
              <User size={20} />
            </Link>

            <Link
              href="/wishlist"
              className="relative rounded-full p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
              aria-label={`Wishlist, ${wishlistCount} items`}
            >
              <Heart size={20} />
              <Badge count={wishlistCount} />
            </Link>

            <Link
              href="/cart"
              className="relative rounded-full p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingBag size={20} />
              <Badge count={cartCount} />
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => logout()}
                className="hidden rounded-full p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-secondary)] sm:block"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-full p-2.5 text-[var(--color-text)] transition-colors hover:bg-white/5 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-80 max-w-[85vw] border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl lg:hidden"
            >
              <div className="flex h-full flex-col overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                  <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-base font-bold tracking-[0.2em] text-transparent">
                    Radha Rani
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 space-y-1 p-4">
                  {NAV_LINKS.map((link) => {
                    if (link.children) {
                      return (
                        <div key={link.label}>
                          <div className="px-3 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                            {link.label}
                          </div>
                          <div className="space-y-0.5 pl-2">
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                                  isActive(child.href)
                                    ? "bg-white/10 text-[var(--color-primary-light)]"
                                    : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                          isActive(link.href)
                            ? "bg-white/10 text-[var(--color-primary-light)]"
                            : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--color-border)] p-4">
                  {user ? (
                    <div className="space-y-2">
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-white/5"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-xs font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{user.name}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-secondary)]"
                      >
                        <LogOut size={18} />
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="btn btn-ghost w-full"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="btn btn-primary w-full"
                      >
                        Join Free
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
