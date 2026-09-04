"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Baby,
  ChevronDown,
  Feather,
  Gem,
  Infinity as InfinityIcon,
  Quote,
  Shirt,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import Image from "next/image";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";

/* ------------------------------------------------------------------ */
/* Data fetching                                                        */
/* ------------------------------------------------------------------ */

async function fetchProducts(params: string): Promise<ProductCardProduct[]> {
  try {
    const res = await fetch(`/api/products${params}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: ProductCardProduct[] };
    return data.products || [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Scroll progress bar                                                  */
/* ------------------------------------------------------------------ */

function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]"
      style={{ scaleX }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scroll-parallax dot field (decorative)                               */
/* ------------------------------------------------------------------ */

function ParallaxField() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -140]);

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ y }}
    >
      {Array.from({ length: 18 }).map((_, i) => {
        const left = (i * 93) % 100;
        const top = (i * 47) % 100;
        const size = 2 + (i % 4);
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background:
                i % 3 === 0
                  ? "rgba(56,189,248,0.5)"
                  : i % 3 === 1
                    ? "rgba(168,85,247,0.5)"
                    : "rgba(251,191,36,0.4)",
              boxShadow: "0 0 8px rgba(56,189,248,0.6)",
              opacity: 0.35,
            }}
          />
        );
      })}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                      */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={
        reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
    >
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]"
      >
        <Feather size={14} />
        {eyebrow}
        <Feather size={14} />
      </motion.p>
      <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
        {String(title).split(" ").map((word, wi) => (
          <motion.span
            key={wi}
            className="inline-block whitespace-pre"
            initial={reduceMotion ? false : { opacity: 0, y: 24, filter: "blur(6px)", rotateX: 45 }}
            whileInView={
              reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 }
            }
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              delay: 0.1 + wi * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {wi < title.split(" ").length - 1 ? " " : ""}
          </motion.span>
        ))}
      </h2>
      {subtitle && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16">
      {/* Hero background image */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 will-change-transform"
        style={reduceMotion ? undefined : { y: bgY, scale: bgScale }}
      >
        <Image
          src="/hero-bg.png"
          alt="Radha Rani — divine Radha Krishna fashion"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Neon gradient tints (kept subtle so the image stays clear) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(56,189,248,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(168,85,247,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_65%,rgba(251,191,36,0.05),transparent_55%)]" />
      </motion.div>

      {/* Cinematic vignette overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-bg)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,8,20,0.5)_100%)]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={
          reduceMotion
            ? undefined
            : { y: contentY, opacity: contentOpacity }
        }
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-[var(--color-primary-light)] backdrop-blur-md"
        >
          <Sparkles size={13} />
          RADHA RANI &mdash; THREADS OF DEVOTION
          <Sparkles size={13} />
        </motion.div>

        <h1 className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          <motion.span
            className="block font-bold text-white drop-shadow-[0_2px_20px_rgba(56,189,248,0.45)]"
            animate={
              reduceMotion
                ? undefined
                : { textShadow: [
                    "0 2px 20px rgba(56,189,248,0.45)",
                    "0 2px 34px rgba(168,85,247,0.6)",
                    "0 2px 20px rgba(56,189,248,0.45)",
                  ] }
            }
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            DIVINE STYLE
          </motion.span>
          <motion.span
            className="block font-bold bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent"
            animate={
              reduceMotion
                ? undefined
                : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
            }
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            ETERNAL BOND
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mx-auto mt-6 max-w-xl text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg"
        >
          Modern fashion inspired by the timeless love of Radha &amp; Krishna.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          <MagneticButton href="/shop">
            <ShoppingBagGlyph />
            SHOP COLLECTION
            <ArrowRight size={16} />
          </MagneticButton>
          <a
            href="/new-arrivals"
            className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold tracking-wide text-[var(--color-text)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-primary-light)] hover:bg-white/10 hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)]"
          >
            EXPLORE NEW ARRIVALS
            <Sparkles
              size={15}
              className="text-[var(--color-primary-light)] transition-transform duration-300 group-hover:rotate-12"
            />
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#new-arrivals"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-white"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em]">Scroll</span>
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-white/25 p-1.5"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1 rounded-full bg-current"
          />
        </motion.div>
      </motion.a>
    </section>
  );
}

function ShoppingBagGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MagneticButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8)] transition-shadow duration-300 hover:shadow-[0_14px_40px_-6px_rgba(236,72,153,0.8)]"
    >
      {children}
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/* Product grid section (shared)                                        */
/* ------------------------------------------------------------------ */

function ProductSection({
  id,
  eyebrow,
  title,
  subtitle,
  params,
  max = 4,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  params: string;
  max?: number;
}) {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchProducts(params).then((data) => {
      if (!active) return;
      setProducts(data.slice(0, max));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params, max]);

  const count = products.length || max;

  return (
    <section
      id={id}
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      {loading ? (
        <LoadingSkeleton count={count} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} index={i} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center"
      >
        <Link
          href={id === "featured" ? "/shop" : "/new-arrivals"}
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-[var(--color-primary-light)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
        >
          View all
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                           */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    name: "MEN",
    tagline: "Regal & refined",
    icon: Shirt,
    href: "/category/men",
    gradient: "from-indigo-600/80 to-purple-700/80",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "WOMEN",
    tagline: "Graceful silhouettes",
    icon: User,
    href: "/category/women",
    gradient: "from-pink-600/80 to-rose-600/80",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "UNISEX",
    tagline: "Made for every soul",
    icon: InfinityIcon,
    href: "/category/unisex",
    gradient: "from-violet-600/80 to-fuchsia-600/80",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "KIDS",
    tagline: "Little miracles",
    icon: Baby,
    href: "/category/kids",
    gradient: "from-amber-500/80 to-pink-500/80",
    image:
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "ACCESSORIES",
    tagline: "Finishing divine touches",
    icon: Gem,
    href: "/category/accessories",
    gradient: "from-cyan-500/80 to-purple-600/80",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=700&auto=format&fit=crop",
  },
];

function Categories() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <SectionHeading
        eyebrow="Explore"
        title="Shop by Category"
        subtitle="From everyday elegance to festive grandeur — find what speaks to your soul."
      />

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 40, rotateX: -12, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformPerspective: 900 }}
                className="col-span-1"
              >
              <Link
                href={cat.href}
                className={`group relative flex aspect-[3/4] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${cat.gradient} p-5 text-center shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(168,85,247,0.6)]`}
              >
                {/* Category photo */}
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 20vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
                {/* Dark overlay for text legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20 transition-opacity duration-500" />

                {/* hover shine */}
                <div className="pointer-events-none absolute inset-0 z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/30 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                    <Icon size={26} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{cat.name}</h3>
                  <p className="text-xs font-medium text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{cat.tagline}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                    Shop now <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Brand story                                                          */
/* ------------------------------------------------------------------ */

function BrandStory() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.4, 1, 0.4]);

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-secondary)]/50 py-20 sm:py-28">
      {/* ambient glow with parallax */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.22),transparent_60%)] blur-3xl"
        style={
          reduceMotion ? undefined : { y: glowY, opacity: glowOpacity }
        }
      />
      <motion.div
        className="pointer-events-none absolute -bottom-20 -right-20 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_60%)] blur-3xl"
        style={reduceMotion ? undefined : { y: glowY }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <p className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-secondary)]">
          <Feather size={14} /> Our Story <Feather size={14} />
        </p>
        <h2 className="text-2xl font-bold leading-snug text-[var(--color-text)] sm:text-3xl lg:text-4xl">
          Born from the timeless beauty of{" "}
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            Vrindavan
          </span>
        </h2>
        <p className="mt-6 text-base font-light leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          Where the sacred waterways whisper tales of devotion and the gentle
          strains of a flute float upon the breeze, our story begins. Radha Rani is
          more than fashion &mdash; it is a tribute to the eternal bond between
          Radha and Krishna, translated into modern threads that carry ancient
          grace. Every garment is thoughtfully crafted to let you wear a piece
          of heaven, weaving devotion, love, and timeless elegance into the
          fabric of everyday life.
        </p>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonial / quote                                                  */
/* ------------------------------------------------------------------ */

function Testimonial() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <motion.figure
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative px-6 py-10 text-center sm:px-14 sm:py-14"
      >
        <Quote
          className="absolute left-6 top-6 text-[var(--color-primary)]/30"
          size={40}
        />

        <div className="mb-5 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={16} className="text-amber-400" fill="currentColor" />
          ))}
        </div>

        <blockquote className="text-xl font-light leading-relaxed text-[var(--color-text)] sm:text-2xl">
          &ldquo;The sound of your flute, Radha replied, was worth a thousand
          sorrows &mdash; and in every thread of Radha Rani, I hear that same
          promise of love, beauty, and an eternal bond.&rdquo;
        </blockquote>

        <figcaption className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-[var(--color-primary-light)]">
          In the Spirit of Vrindavan
        </figcaption>

        <motion.div
          animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent"
        />
      </motion.figure>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA                                                                  */
/* ------------------------------------------------------------------ */

function Cta() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-primary)]/15 to-[var(--color-bg)]" />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.22),transparent_60%)] blur-3xl"
        style={reduceMotion ? undefined : { y: orbY }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Ready to wear{" "}
          <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            divine?
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base font-light text-[var(--color-text-muted)] sm:text-lg">
          Step into a world where every piece carries a story of devotion.
          Embrace the eternal bond, one thread at a time.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MagneticButton href="/shop">
            <ShoppingBagGlyph />
            SHOP NOW
            <ArrowRight size={16} />
          </MagneticButton>
          <a
            href="/new-arrivals"
            className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold tracking-wide text-[var(--color-text)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-primary-light)] hover:bg-white/10"
          >
            NEW ARRIVALS
            <ChevronDown size={15} className="transition-transform duration-300 group-hover:translate-y-0.5" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <ParallaxField />
      <div className="relative">
        <Hero />

        <div className="relative">
          <ProductSection
            id="new-arrivals"
            eyebrow="Just landed"
            title="New Arrivals"
            subtitle="Fresh drops hand-picked with love, straight from the heart of Vrindavan."
            params="?isNewArrival=true&sort=newest&limit=8"
            max={4}
          />

          <Categories />

          <ProductSection
            id="featured"
            eyebrow="Curated for you"
            title="Featured Products"
            subtitle="Our most-loved divine treasures, worn and adored by our community."
            params="?featured=true&sort=popular&limit=8"
            max={8}
          />
        </div>

      </div>

      <BrandStory />
      <Testimonial />
      <Cta />
    </>
  );
}
