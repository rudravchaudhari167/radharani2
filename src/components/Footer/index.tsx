"use client";

import Link from "next/link";
import { AtSign, Camera, Flower2, MessageCircle, Play, Send } from "lucide-react";

const SHOP_LINKS = [
  { href: "/category/men", label: "Men" },
  { href: "/category/women", label: "Women" },
  { href: "/category/unisex", label: "Unisex" },
  { href: "/category/kids", label: "Kids" },
  { href: "/category/accessories", label: "Accessories" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/careers", label: "Careers" },
];

const SUPPORT_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram", icon: Camera },
  { href: "https://twitter.com", label: "Twitter", icon: MessageCircle },
  { href: "https://youtube.com", label: "YouTube", icon: Play },
  { href: "https://facebook.com", label: "Facebook", icon: AtSign },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-primary), var(--color-secondary), var(--color-primary), transparent)",
        }}
      />

      <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-3">
              <Link href="/" className="inline-flex items-center gap-2">
                <Flower2 size={22} style={{ color: "var(--color-secondary)" }} />
                <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-lg font-bold tracking-[0.25em] text-transparent">
                  Radha Rani
                </span>
              </Link>
              <p className="text-sm font-medium text-[var(--color-primary-light)]">
                Threads of Devotion
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-[var(--color-text-muted)]">
                Divine style, eternal bond. Curated ethnic fashion and
                handcrafted treasures inspired by timeless devotion.
              </p>
              <div className="flex items-center gap-3 pt-1">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary-light)]"
                      aria-label={social.label}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
                Shop
              </h3>
              <ul className="space-y-2.5">
                {SHOP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
                Company
              </h3>
              <ul className="space-y-2.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
                Support
              </h3>
              <ul className="space-y-2.5">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
                Newsletter
              </h3>
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                Join our divine circle for exclusive offers and new arrivals.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2"
              >
                <input
                  type="email"
                  placeholder="Your email"
                  className="min-w-0 flex-1 rounded-full border border-[var(--color-border)] bg-white/5 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-white transition-shadow hover:shadow-lg hover:shadow-[var(--color-primary)]/30"
                  aria-label="Subscribe to newsletter"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                  We Accept
                </p>
                <div className="flex items-center gap-2">
                  {["Visa", "Mastercard", "UPI", "PayTM", "GPay"].map(
                    (method) => (
                      <span
                        key={method}
                        className="rounded-md border border-[var(--color-border)] bg-white/5 px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)]"
                      >
                        {method}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row">
            <p className="text-xs text-[var(--color-text-muted)]">
              &copy; 2024 Radha Rani. All rights reserved.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Crafted with{" "}
              <span style={{ color: "var(--color-secondary)" }}>&hearts;</span>{" "}
              for every soul.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
