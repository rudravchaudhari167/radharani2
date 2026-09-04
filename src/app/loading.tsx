"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Loading() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="flex flex-col items-center"
      >
        {/* Logo with pulse */}
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-secondary)]/30 blur-2xl"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 border border-white/10 backdrop-blur-md">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              V
            </span>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-sm font-semibold tracking-[0.3em] text-[var(--color-text-muted)] uppercase"
        >
          Radha Rani
        </motion.p>

        {/* Shimmer loading bar */}
        <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="mt-4 text-xs text-[var(--color-text-muted)]"
        >
          Loading...
        </motion.p>
      </motion.div>
    </section>
  );
}
