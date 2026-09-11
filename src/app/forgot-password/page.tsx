"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, Sparkles, LoaderCircle } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-[#1A2530] p-12 lg:flex lg:w-[44%] text-white">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2D4A6B]/30 blur-3xl" />

      <div className="relative z-10">
        <Link href="/" className="inline-block">
          <span className="font-serif text-2xl font-normal tracking-[0.3em] text-white">
            RADHA RANI
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-[#B8965A]">
            Atelier de Dévotion
          </p>
        </Link>
      </div>

      <div className="relative z-10 max-w-sm">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FAF9F6]">
          <Sparkles size={12} className="text-[#B8965A]" />
          Account Security
        </span>
        <h1 className="font-serif text-3xl font-light leading-snug tracking-tight text-white sm:text-4xl">
          Recover Your Client Profile
        </h1>
        <p className="mt-4 text-xs font-light leading-relaxed text-white/75">
          We will transmit private instructions to your registered email to
          restore access to your saved garments and order history.
        </p>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-6">
        <p className="font-serif italic text-xs text-white/70">
          &ldquo;Divine Style. Eternal Bond.&rdquo;
        </p>
      </div>
    </div>
  );
}

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
        setError("Email address is required");
        return;
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        setError("Please enter a valid email address");
        return;
      }

      setLoading(true);
      try {
        try {
          await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          });
        } catch {
          // Suppress network errors
        }
        setSubmitted(true);
        addToast("Instructions sent if account exists", "success");
      } finally {
        setLoading(false);
      }
    },
    [email, addToast],
  );

  return (
    <div className="flex min-h-screen w-full bg-[#FAF9F6]">
      <BrandPanel />

      <div className="relative flex w-full items-center justify-center px-4 py-16 sm:px-8 lg:w-[56%]">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-sm border border-[#E7E3DC] bg-white p-8 sm:p-10 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
              Password Assistance
            </p>
            <h1 className="mt-2 font-serif text-2xl font-light text-[#171717] sm:text-3xl">
              Forgot Password
            </h1>
            <p className="mt-1 text-xs text-[#666666]">
              Enter the email address registered with your account.
            </p>

            {submitted ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                  If an account exists under this address, reset instructions
                  have been dispatched.
                </div>
                <Link
                  href="/login"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#171717] text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#2D4A6B]"
                >
                  <ArrowLeft size={14} />
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 bg-[#171717] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#2D4A6B] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Sending Link…
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <p className="pt-2 text-center text-xs text-[#666666]">
                  Remember your credentials?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[#171717] underline hover:text-[#2D4A6B]"
                  >
                    Sign In
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
