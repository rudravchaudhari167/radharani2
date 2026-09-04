"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  LoaderCircle,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { useAuthStore, type User } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useToastStore } from "@/lib/toast-store";

type LoginMode = "email" | "phone";

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

/* ------------------------------------------------------------------ */
/* Brand panel                                                         */
/* ------------------------------------------------------------------ */

function BrandPanel({
  title,
  subtitle,
  cta,
}: {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[44%]">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-secondary)]" />
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.28) 1px, transparent 0)",
          backgroundSize: "34px 34px",
        }}
      />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-black/25 blur-3xl" />

      {/* Falling petals */}
      <span
        className="animate-petal-fall pointer-events-none absolute left-10 top-24 h-6 w-6 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #f9a8d4, #ec4899 60%, #be185d)",
          animationDuration: "11s",
        }}
      />
      <span
        className="animate-petal-fall pointer-events-none absolute left-1/2 top-6 h-4 w-4 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #c4b5fd, #8b5cf6 60%, #6d28d9)",
          animationDelay: "2.2s",
          animationDuration: "13s",
        }}
      />
      <span
        className="animate-petal-fall pointer-events-none absolute left-44 right-0 top-40 h-7 w-7 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #fecdd3, #f472b6 60%, #db2777)",
          animationDelay: "4.5s",
          animationDuration: "15s",
        }}
      />

      {/* Top */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm">
          <Sparkles size={22} className="text-white" />
        </span>
        <h2
          className="mt-6 bg-clip-text text-2xl font-black tracking-[0.3em] text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg,#fff,#f5d0fe)" }}
        >
          Radha Rani
        </h2>
      </motion.div>

      {/* Middle */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative z-10 max-w-md"
      >
        <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base font-light leading-relaxed text-white/85">
          {subtitle}
        </p>
      </motion.div>

      {/* Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10"
      >
        <p className="mb-4 text-sm font-semibold italic text-white/80">
          &ldquo;Divine Style. Eternal Bond.&rdquo;
        </p>
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          {cta.label}
          <ArrowRight size={16} />
        </Link>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */

function Field({
  type,
  label,
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  error,
}: {
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  autoComplete?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          {icon}
        </span>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white/5 py-3 pl-11 pr-11 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 ${
            error
              ? "border-[var(--color-secondary)]/60 focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/40"
              : "border-[var(--color-border)] focus:border-[var(--color-primary-light)] focus:ring-[var(--color-primary-light)]/40"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--color-secondary)]">{error}</p>}
    </div>
  );
}

function LoaderIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);

  const setUser = useAuthStore((s) => s.setUser);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const redirectTo = searchParams.get("redirect");

  const oauthError = searchParams.get("error");
  if (oauthError && !formError) {
    setFormError(decodeURIComponent(oauthError));
    // Replace URL to avoid re-triggering on refresh.
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete("error");
    window.history.replaceState({}, "", `${window.location.pathname}?${clean.toString()}`);
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");
      setFieldErrors({});

      const errors: Record<string, string> = {};
      if (mode === "email") {
        if (!email.trim()) {
          errors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(email.trim())) {
          errors.email = "Please enter a valid email";
        }
      } else {
        const digits = phone.replace(/\D/g, "");
        if (!phone.trim()) {
          errors.phone = "Phone number is required";
        } else if (!/^[6-9]\d{9}$/.test(digits)) {
          errors.phone = "Enter a valid 10-digit Indian phone number";
        }
      }
      if (!password) {
        errors.password = "Password is required";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      try {
        const payload =
          mode === "email"
            ? { email: email.trim(), password, loginType: "email" }
            : { phone: phone.trim(), password, loginType: "phone" };

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as {
          user?: unknown;
          error?: string;
          fields?: Record<string, string>;
        };

        if (!res.ok) {
          setFormError(data.error || "Could not log in. Please try again.");
          if (data.fields) setFieldErrors(data.fields);
          return;
        }

        setUser(normalizeUser(data.user));
        await Promise.all([fetchCart(), fetchWishlist()]);
        addToast("Welcome back to Radha Rani", "success");

        const target =
          redirectTo && redirectTo.startsWith("/") ? redirectTo : "/account";
        router.push(target);
        router.refresh();
      } catch {
        setFormError(
          "Network error. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      mode,
      email,
      phone,
      password,
      setUser,
      fetchCart,
      fetchWishlist,
      addToast,
      redirectTo,
      router,
    ],
  );

  const handleGoogleLogin = useCallback(async () => {
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
        setFormError(data.error || "Could not start Google login");
        return;
      }
      window.location.href = data.url;
    } catch {
      setFormError("Could not start Google login. Please try again.");
    } finally {
      setOauthLoading(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      {/* Brand panel */}
      <BrandPanel
        title="Welcome back to your divine wardrobe"
        subtitle="Sign in to unlock your saved styles, track orders and continue your journey with Radha Rani."
        cta={{ label: "Create account", href: "/register" }}
      />

      {/* Form panel */}
      <div className="relative flex w-full items-center justify-center px-4 py-16 sm:px-8 lg:w-[56%]">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-8 sm:p-10"
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
              <LogIn size={13} />
              Welcome
            </p>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
              Log in to Radha Rani
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Enter your credentials to continue your journey.
            </p>

            {/* Mode toggle */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-[var(--color-border)] bg-white/5 p-1">
              {(["email", "phone"] as LoginMode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={active}
                    className={`relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      active ? "text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="login-mode-pill"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {m === "email" ? <Mail size={15} /> : <Phone size={15} />}
                      {m === "email" ? "EMAIL" : "PHONE"}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5 noValidate">
              {mode === "email" ? (
                <Field
                  type="email"
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  icon={<Mail size={17} />}
                  error={fieldErrors.email}
                />
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-muted)]">
                      +91
                    </span>
                    <Phone
                      size={17}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))
                      }
                      placeholder="98765 43210"
                      autoComplete="tel"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      className={`w-full rounded-xl border bg-white/5 py-3 pl-14 pr-12 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 ${
                        fieldErrors.phone
                          ? "border-[var(--color-secondary)]/60 focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/40"
                          : "border-[var(--color-border)] focus:border-[var(--color-primary-light)] focus:ring-[var(--color-primary-light)]/40"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1.5 text-xs text-[var(--color-secondary)]">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Password
                  </span>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    <Lock size={17} />
                  </span>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    className={`w-full rounded-xl border bg-white/5 py-3 pl-11 pr-11 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 ${
                      fieldErrors.password
                        ? "border-[var(--color-secondary)]/60 focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/40"
                        : "border-[var(--color-border)] focus:border-[var(--color-primary-light)] focus:ring-[var(--color-primary-light)]/40"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-[var(--color-secondary)]">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {formError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
                >
                  {formError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary h-12 w-full rounded-2xl text-base font-bold disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderIcon />
                    Signing in…
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  or continue with
                </span>
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={oauthLoading}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-white/5 text-sm font-bold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary-light)]/50 hover:bg-white/10 disabled:opacity-60"
              >
                {oauthLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {oauthLoading ? "Connecting…" : "Continue with Google"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
              >
                Register
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="skeleton h-24 w-24 rounded-2xl" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
