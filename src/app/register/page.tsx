"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User as UserIcon,
  LoaderCircle,
} from "lucide-react";
import { useAuthStore, type User } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useToastStore } from "@/lib/toast-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.name !== "string" || typeof u.email !== "string") return null;
  return {
    id: String(u._id ?? u.userId ?? u.id ?? u.email),
    name: u.name,
    email: u.email,
    phone: typeof u.phone === "string" ? u.phone : "",
    role: u.role === "ADMIN" ? "ADMIN" : "USER",
  };
}

function BrandPanel({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative hidden w-[44%] overflow-hidden bg-[#1D3048] p-12 lg:flex lg:flex-col lg:justify-between">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#FAF9F6 1px, transparent 1px), linear-gradient(90deg, #FAF9F6 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow orb */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2D4A6B]/30 blur-3xl" />

      {/* Top Brand */}
      <div className="relative z-10">
        <Link href="/" className="inline-block">
          <span className="font-serif text-2xl font-normal tracking-[0.3em] text-white">
            VRINDAV
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-[#B8965A]">
            Atelier de Dévotion
          </p>
        </Link>
      </div>

      {/* Middle Copy */}
      <div className="relative z-10 max-w-sm">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FAF9F6]">
          <Sparkles size={12} className="text-[#B8965A]" />
          New Client
        </span>
        <h1 className="font-serif text-3xl font-light leading-snug tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-xs font-light leading-relaxed text-white/75">
          {subtitle}
        </p>
      </div>

      {/* Bottom Quote */}
      <div className="relative z-10 border-t border-white/10 pt-6">
        <p className="font-serif italic text-xs text-white/70">
          &ldquo;Divine Style. Eternal Bond.&rdquo;
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B8965A] hover:underline"
        >
          Already registered? Sign in
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);

  const setUser = useAuthStore((s) => s.setUser);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const rawError = searchParams.get("error_description") || searchParams.get("error");
    let msg = rawError ? decodeURIComponent(rawError) : "";

    if (!msg && typeof window !== "undefined" && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hErr = hash.get("error_description") || hash.get("error");
      if (hErr) {
        msg = decodeURIComponent(hErr);
      }
    }

    if (msg) {
      if (msg.includes("Unable to exchange external code")) {
        setFormError(
          "Google sign-up could not be completed (OAuth exchange failed). Please register with your email & password or verify the Google credentials in Supabase."
        );
      } else {
        setFormError(msg);
      }
    }
  }, [searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      setFieldErrors({});

      const errors: Record<string, string> = {};

      const trimmedName = name.trim();
      if (!trimmedName) {
        errors.name = "Full name is required";
      } else if (trimmedName.length < 2) {
        errors.name = "Name must be at least 2 characters";
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        errors.email = "Email is required";
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        errors.email = "Please enter a valid email address";
      }

      const digits = phone.replace(/\D/g, "");
      if (!phone.trim()) {
        errors.phone = "Phone number is required";
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        errors.phone = "Enter a valid 10-digit Indian phone number";
      }

      if (!password) {
        errors.password = "Password is required";
      } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (!confirm) {
        errors.confirm = "Please confirm your password";
      } else if (confirm !== password) {
        errors.confirm = "Passwords do not match";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            phone: phone.trim(),
            password,
            confirmPassword: confirm,
          }),
        });

        const data = (await res.json()) as {
          user?: unknown;
          error?: string;
          fields?: Record<string, string>;
        };

        if (!res.ok) {
          setFormError(data.error || "Could not create account. Please try again.");
          if (data.fields) setFieldErrors(data.fields);
          return;
        }

        setUser(normalizeUser(data.user));
        await Promise.all([fetchCart(), fetchWishlist()]);
        addToast("Welcome to VRINDAV", "success");
        router.push("/account");
        router.refresh();
      } catch {
        setFormError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [
      name,
      email,
      phone,
      password,
      confirm,
      setUser,
      fetchCart,
      fetchWishlist,
      addToast,
      router,
    ],
  );

  const handleGoogleSignup = useCallback(async () => {
    setOauthLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/auth/supabase/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFormError(data.error || "Could not start Google registration");
        return;
      }
      window.location.href = data.url;
    } catch {
      setFormError("Could not start Google registration. Please try again.");
    } finally {
      setOauthLoading(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-[#FAF9F6]">
      {/* Brand panel */}
      <BrandPanel
        title="Begin your journey into divine sartorial elegance"
        subtitle="Create an account to preserve favorite garments, track bespoke orders, and enjoy tailored client services."
      />

      {/* Form panel */}
      <div className="relative flex w-full items-center justify-center px-4 py-16 sm:px-8 lg:w-[56%]">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-sm border border-[#E7E3DC] bg-white p-8 sm:p-10 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
              Membership Registration
            </p>
            <h1 className="mt-2 font-serif text-2xl font-light text-[#171717] sm:text-3xl">
              Create Your Account
            </h1>
            <p className="mt-1 text-xs text-[#666666]">
              Enter your details to create your private VRINDAV profile.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Radhika Sharma"
                    autoComplete="name"
                    className="w-full rounded-sm border border-[#E7E3DC] bg-white py-2.5 pl-10 pr-3 text-xs text-[#171717] placeholder:text-[#999999] focus:border-[#171717] focus:outline-none"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full rounded-sm border border-[#E7E3DC] bg-white py-2.5 pl-10 pr-3 text-xs text-[#171717] placeholder:text-[#999999] focus:border-[#171717] focus:outline-none"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#666666]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="98765 43210"
                    autoComplete="tel"
                    className="w-full rounded-sm border border-[#E7E3DC] bg-white py-2.5 pl-12 pr-3 text-xs text-[#171717] placeholder:text-[#999999] focus:border-[#171717] focus:outline-none"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                  Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]"
                  />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-sm border border-[#E7E3DC] bg-white py-2.5 pl-10 pr-10 text-xs text-[#171717] placeholder:text-[#999999] focus:border-[#171717] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#171717]"
                  >
                    {passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]"
                  />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-sm border border-[#E7E3DC] bg-white py-2.5 pl-10 pr-3 text-xs text-[#171717] placeholder:text-[#999999] focus:border-[#171717] focus:outline-none"
                  />
                </div>
                {fieldErrors.confirm && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.confirm}
                  </p>
                )}
              </div>

              {formError && (
                <p className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 bg-[#171717] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#2D4A6B] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Creating Profile…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#E7E3DC]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                  or
                </span>
                <span className="h-px flex-1 bg-[#E7E3DC]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={oauthLoading}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-sm border border-[#E7E3DC] bg-white text-xs font-semibold uppercase tracking-wider text-[#171717] transition-colors hover:border-[#171717] disabled:opacity-60"
              >
                {oauthLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {oauthLoading ? "Connecting…" : "Sign up with Google"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#666666]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#171717] underline hover:text-[#2D4A6B]"
              >
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          <LoaderCircle size={32} className="animate-spin text-[#2D4A6B]" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
