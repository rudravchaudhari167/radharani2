"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* Brand panel                                                         */
/* ------------------------------------------------------------------ */

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[44%]">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-gold)]" />
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

      <span
        className="animate-petal-fall pointer-events-none absolute right-10 top-28 h-6 w-6 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #f9a8d4, #ec4899 60%, #be185d)",
          animationDuration: "12s",
        }}
      />
      <span
        className="animate-petal-fall pointer-events-none absolute left-1/2 top-4 h-4 w-4 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #fde68a, #d4a574 60%, #b8865e)",
          animationDelay: "2.6s",
          animationDuration: "14s",
        }}
      />

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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative z-10 max-w-md"
      >
        <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Reset your password
        </h1>
        <p className="mt-5 text-base font-light leading-relaxed text-white/85">
          We&apos;ll send you a secure link to set a new password and get back to
          your divine collection.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10"
      >
        <p className="text-sm font-semibold italic text-white/80">
          &ldquo;Divine Style. Eternal Bond.&rdquo;
        </p>
      </motion.div>
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

export default function ForgotPasswordPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const trimmed = email.trim();
      if (!trimmed) {
        setError("Email is required");
        return;
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        setError("Please enter a valid email");
        return;
      }

      setLoading(true);
      try {
        // Intentionally try to POST; if no endpoint exists we still show the
        // generic message so we never reveal whether an account exists.
        try {
          await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          });
        } catch {
          // Suppress network errors — generic success either way.
        }
        setSubmitted(true);
        addToast(
          "If an account exists, recovery instructions have been sent.",
          "success",
        );
      } finally {
        setLoading(false);
      }
    },
    [email, addToast],
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Brand panel */}
      <BrandPanel />

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
              <Mail size={13} />
              Recovery
            </p>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Enter the email you registered with and we&apos;ll send you
              instructions to reset your password.
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 space-y-6"
              >
                <div className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <Mail size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                  <p className="text-sm leading-relaxed text-emerald-200">
                    If an account exists, recovery instructions have been sent.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="btn btn-primary inline-flex w-full items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5 noValidate">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                      <Mail size={17} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={Boolean(error)}
                      className={`w-full rounded-xl border bg-white/5 py-3 pl-11 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 ${
                        error
                          ? "border-[var(--color-secondary)]/60 focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/40"
                          : "border-[var(--color-border)] focus:border-[var(--color-primary-light)] focus:ring-[var(--color-primary-light)]/40"
                      }`}
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-[var(--color-secondary)]">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-12 w-full rounded-2xl text-base font-bold disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <LoaderIcon />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send instructions
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-[var(--color-text-muted)]">
                  Remembered your password?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-secondary)]"
                  >
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
