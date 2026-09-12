"use client";

import Link from "next/link";
import { Send } from "lucide-react";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function PinterestIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="4" x2="12" y2="20" />
      <path d="M8 8a4 4 0 1 1 7.8 1.4c-.6 2.5-2.8 4.6-4.8 5.6" />
      <path d="M9 16c.5 1.5 1.5 3 2.5 4" />
    </svg>
  );
}

const SHOP_LINKS = [
  { href: "/shop", label: "Shop & Lookbook" },
  { href: "/collections", label: "Curated Editions" },
  { href: "/shop?view=catalogue", label: "All Garments" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
];

const HELP_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/faq", label: "FAQ" },
  { href: "/track-order", label: "Track Order" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Login" },
  { href: "/account", label: "My Account" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/orders", label: "Orders" },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram", icon: InstagramIcon },
  { href: "https://facebook.com", label: "Facebook", icon: FacebookIcon },
  { href: "https://pinterest.com", label: "Pinterest", icon: PinterestIcon },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]/50">
      <div className="mx-auto w-full max-w-[80rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="inline-flex flex-col items-start" aria-label="Radha Rani home">
              <span className="text-2xl font-serif tracking-[0.2em] font-normal text-[var(--color-text)]">
                RADHA RANI
              </span>
              <span className="text-[9px] uppercase tracking-[0.32em] text-[var(--color-accent)] font-medium">
                Atelier de Dévotion
              </span>
            </Link>
            <p className="text-sm font-medium tracking-wide text-[var(--color-accent)]">
              Threads of Devotion.
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
              Contemporary fashion inspired by timeless Indian heritage. Divine Style. Eternal Bond.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all duration-200 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] hover:text-[var(--color-accent)]"
                    aria-label={social.label}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
              Shop
            </h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
              Help
            </h3>
            <ul className="space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
              Account
            </h3>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)]">
              Newsletter
            </h3>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              Subscribe for new arrivals and exclusive offers.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="Your email"
                className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)]/20"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-white text-sm font-medium transition-colors hover:bg-[var(--color-accent-light)]"
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
                {["Visa", "Mastercard", "UPI", "Net Banking", "Wallets"].map(
                  (method) => (
                    <span
                      key={method}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)]"
                    >
                      {method}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} Radha Rani. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--color-text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--color-accent)]">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-[var(--color-accent)]">
              Terms of Service
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/shipping" className="hover:text-[var(--color-accent)]">
              Shipping Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/returns" className="hover:text-[var(--color-accent)]">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}