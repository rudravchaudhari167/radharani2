"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const PETALS = [
  { startX: -280, driftA: -350, driftB: 120 },
  { startX: -90, driftA: 200, driftB: -180 },
  { startX: 170, driftA: -60, driftB: 300 },
  { startX: -200, driftA: 280, driftB: -100 },
  { startX: 60, driftA: -320, driftB: 250 },
  { startX: 310, driftA: 50, driftB: -270 },
];

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.14),transparent_60%)] blur-3xl" />

      {/* Rose petal decorations */}
      {PETALS.map((petal, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute"
          initial={{
            x: petal.startX,
            y: -50,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            y: [-(50 + i * 20), 800],
            rotate: [0, 180 + i * 60],
            opacity: [0, 0.6, 0.6, 0],
            x: [petal.driftA, petal.driftB],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear",
          }}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{
              background:
                i % 2 === 0
                  ? "linear-gradient(135deg, var(--color-primary), var(--color-secondary))"
                  : "linear-gradient(135deg, var(--color-secondary), var(--color-gold))",
              opacity: 0.4 + (i % 3) * 0.15,
            }}
          />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="relative z-10"
      >
        <h1 className="text-[8rem] font-black leading-none tracking-tighter text-white sm:text-[12rem]">
          <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            4
          </span>
          <span className="mx-2 text-white/10">0</span>
          <span className="bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-gold)] to-[var(--color-primary)] bg-clip-text text-transparent">
            4
          </span>
        </h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mx-auto my-6 h-px w-48 bg-gradient-to-r from-transparent via-[var(--color-primary-light)]/50 to-transparent"
        />

        <p className="mx-auto max-w-md text-lg font-light leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          The page you&apos;re looking for has floated away like a petal in the wind.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8)] transition-shadow duration-300 hover:shadow-[0_14px_40px_-6px_rgba(236,72,153,0.8)]"
          >
            Back to Home
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold tracking-wide text-[var(--color-text)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-primary-light)] hover:bg-white/10"
          >
            Explore Shop
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
