"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Gem,
  Leaf,
  Star,
  Heart,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const ease = [0.22, 1, 0.36, 1] as const;

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20 text-center">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.2),transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.15),transparent_60%)] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold tracking-[0.25em] text-[var(--color-primary-light)] backdrop-blur-md"
        >
          <Sparkles size={13} />
          OUR STORY
          <Sparkles size={13} />
        </motion.div>

        <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          <span className="block text-white drop-shadow-[0_2px_20px_rgba(124,58,237,0.3)]">
            Born from the
          </span>
          <span className="mt-2 block bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            timeless beauty
          </span>
          <span className="mt-2 block text-white drop-shadow-[0_2px_20px_rgba(124,58,237,0.3)]">
            of Vrindavan
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text-muted)] sm:text-xl"
        >
          Radha Rani blends Indian inspiration with modern fashion. Every thread
          carries the spirit of devotion, every design tells a story of eternal
          love.
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[var(--color-text-muted)]"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em]">
          Scroll
        </span>
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-white/25 p-1.5"
        >
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : { y: [0, 12, 0], opacity: [1, 0.2, 1] }
            }
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1 rounded-full bg-current"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Story                                                                */
/* ------------------------------------------------------------------ */

function Story() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-secondary)]/40 py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14),transparent_60%)] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Text */}
          <FadeIn>
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-secondary)]">
              <Heart size={14} />
              Threads of Devotion
            </p>
            <h2 className="text-3xl font-bold leading-snug tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
              Where the divine meets{" "}
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
                modern design
              </span>
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              In the sacred groves of Vrindavan, the eternal love of Radha and
              Krishna has inspired artists, poets, and dreamers for millennia.
              That same spirit of devotion and beauty is woven into every piece
              we create at Radha Rani.
            </p>
            <p className="mt-4 text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              We believe fashion is more than fabric &mdash; it is a form of
              expression, a bridge between the ancient and the contemporary. Our
              artisans blend traditional Indian craftsmanship with cutting-edge
              design to create pieces that resonate with the modern soul while
              honoring centuries of heritage.
            </p>
          </FadeIn>

          {/* Visual card */}
          <FadeIn delay={0.15}>
            <div className="glass-card relative overflow-hidden p-1">
              <div className="absolute inset-0 rounded-[1.2rem] bg-gradient-to-br from-[var(--color-primary)]/30 via-transparent to-[var(--color-secondary)]/30" />
              <div className="relative flex flex-col items-center justify-center rounded-[1.1rem] bg-[var(--color-bg)]/90 px-8 py-16 text-center backdrop-blur-md">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
                  <span className="text-4xl" role="img" aria-label="flute">
                    &#x1F3BB;
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                  The Flute of Krishna
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Just as Krishna&apos;s flute called every soul to devotion, our
                  designs call to the beauty within you &mdash; timeless,
                  graceful, and eternally resonant.
                </p>
                <div className="mt-6 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-amber-400"
                      fill="currentColor"
                    />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Values                                                               */
/* ------------------------------------------------------------------ */

const VALUES = [
  {
    icon: Gem,
    title: "Craftsmanship",
    desc: "Every stitch is placed with intention by artisans who pour their hearts into each creation.",
    gradient: "from-violet-500/20 to-purple-600/20",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    desc: "Mindful sourcing and ethical production ensure our beauty respects the earth that inspires it.",
    gradient: "from-emerald-500/20 to-teal-600/20",
  },
  {
    icon: Heart,
    title: "Heritage",
    desc: "Rooted in centuries of Indian artistry, our designs honor traditions that time cannot erode.",
    gradient: "from-pink-500/20 to-rose-600/20",
  },
  {
    icon: Sparkles,
    title: "Modern Design",
    desc: "Contemporary silhouettes meet timeless motifs, creating pieces for today's global citizen.",
    gradient: "from-amber-500/20 to-orange-600/20",
  },
];

function Values() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
          <Star size={14} />
          What We Stand For
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
          Our Values
        </h2>
        <p className="mt-4 text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          The principles that guide every thread we weave.
        </p>
      </FadeIn>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((v, i) => {
          const Icon = v.icon;
          return (
            <FadeIn key={v.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="glass-card group relative h-full overflow-hidden p-6 sm:p-8"
              >
                <div
                  className={`absolute inset-0 rounded-[1.25rem] bg-gradient-to-br ${v.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />
                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-secondary)]/15 border border-white/10 transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={26}
                      className="text-[var(--color-primary-light)]"
                    />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {v.desc}
                  </p>
                </div>
              </motion.div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                                */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: "30+", label: "Products" },
  { value: "10k+", label: "Customers" },
  { value: "4.9", label: "Rating" },
  { value: "100%", label: "Authentic" },
];

function Stats() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-secondary)]/40 py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12),transparent_60%)] blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-secondary)]">
            <Sparkles size={14} />
            By the Numbers
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Our Journey in Numbers
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div className="glass-card relative overflow-hidden px-6 py-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 to-transparent" />
                <p className="relative text-4xl font-black tracking-tight bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent sm:text-5xl">
                  {s.value}
                </p>
                <p className="relative mt-2 text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {s.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The Collection panel                                                 */
/* ------------------------------------------------------------------ */

function CollectionPanel() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <FadeIn>
        <div className="glass-card relative overflow-hidden p-[2px]">
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-[1.3rem] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-gold)] opacity-60" />

          <div className="relative flex flex-col items-center gap-8 rounded-[1.2rem] bg-[var(--color-bg)]/95 px-8 py-14 text-center backdrop-blur-md sm:px-16 sm:py-20 lg:flex-row lg:text-left">
            {/* Decorative peacock feather */}
            <div className="flex-shrink-0">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-secondary)]/15 border border-white/10">
                <span className="text-5xl" role="img" aria-label="peacock">
                  &#x1F99A;
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
                The Collection
              </h2>
              <p className="mt-4 text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                Each piece in the Radha Rani collection is a chapter in our story
                &mdash; from the whisper of silk that recalls moonlit nights in
                Vrindavan, to the bold geometry of patterns inspired by temple
                architecture. Our collection spans everyday wear to statement
                pieces, all united by a commitment to beauty and devotion.
              </p>
              <Link
                href="/shop"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8)] transition-shadow duration-300 hover:shadow-[0_14px_40px_-6px_rgba(236,72,153,0.8)]"
              >
                Explore the Collection
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA                                                                  */
/* ------------------------------------------------------------------ */

function Cta() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-primary)]/10 to-[var(--color-bg)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.2),transparent_60%)] blur-3xl" />

      <FadeIn className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Wear the{" "}
          <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            devotion
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base font-light text-[var(--color-text-muted)] sm:text-lg">
          Step into a world where every piece carries a story of love,
          grace, and timeless elegance.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8)] transition-shadow duration-300 hover:shadow-[0_14px_40px_-6px_rgba(236,72,153,0.8)]"
          >
            Explore the Collection
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold tracking-wide text-[var(--color-text)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-primary-light)] hover:bg-white/10"
          >
            SHOP NOW
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <>
      <Hero />
      <Story />
      <Values />
      <Stats />
      <CollectionPanel />
      <Cta />
    </>
  );
}
