"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

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

function Field({
  type,
  label,
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
}: {
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  autoComplete?: string;
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
          className="w-full rounded-xl border border-[var(--color-border)] bg-white/5 py-3 pl-11 pr-11 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-light)]/40"
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
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setRateLimited(false);

      if (!email.trim() || !password) {
        setError("Invalid admin credentials.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/admin/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (res.status === 401) {
          setError("Invalid admin credentials.");
          return;
        }
        if (res.status === 429) {
          setRateLimited(true);
          return;
        }
        if (!res.ok) {
          setError("Invalid admin credentials.");
          return;
        }

        router.replace("/admin");
        router.refresh();
      } catch {
        setError("Invalid admin credentials.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, router]
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-16 sm:px-8">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-primary)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[var(--color-secondary)]/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative z-10 w-full max-w-md p-8 sm:p-10"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-2xl font-black text-white shadow-xl shadow-[var(--color-primary)]/40">
            V
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] bg-clip-text text-xl font-black tracking-[0.3em] text-transparent">
            RADHA RANI ADMIN
          </h1>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)]">
            Secure Admin Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 noValidate">
          <Field
            type="email"
            label="Admin Email"
            value={email}
            onChange={setEmail}
            placeholder="admin@vrindav.com"
            autoComplete="email"
            icon={<Mail size={17} />}
          />

          <Field
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            icon={<Lock size={17} />}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-3 text-sm text-[var(--color-secondary)]"
            >
              {error}
            </motion.p>
          )}

          {rateLimited && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
            >
              Too many failed attempts. Please try again later.
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
                <ShieldCheck size={17} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-light)]/20 bg-[var(--color-primary)]/5 px-4 py-3">
          <ShieldCheck size={15} className="shrink-0 text-[var(--color-primary-light)]" />
          <p className="text-xs text-[var(--color-text-muted)]">
            Protected area — Authorized personnel only
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary-light)]"
          >
            ← Back to store
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
