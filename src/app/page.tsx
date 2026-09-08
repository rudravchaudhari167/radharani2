"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw, Feather } from "lucide-react";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";

/* ------------------------------------------------------------------ */
/* Collections Data with Valid Fashion Images                         */
/* ------------------------------------------------------------------ */

const COLLECTIONS = [
  {
    name: "KURTIS & ANARKALIS",
    eyebrow: "Sacred Radha Grace",
    description: "Flowing georgette kurti sets and floor-sweeping anarkalis with delicate zardozi detailing.",
    href: "/shop/women",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "SAREES & LEHENGAS",
    eyebrow: "Royal Weaves & Festive Couture",
    description: "Handwoven art-silks, heritage Banarasi borders, and opulent ceremonial lehengas.",
    href: "/shop/women",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "CONTEMPORARY DRESSES",
    eyebrow: "Fluid Modern Silhouettes",
    description: "Liquid satin midi dresses, breezy mul-mul palazzo co-ords, and everyday elegance.",
    href: "/shop/women",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop",
  },
];

/* ------------------------------------------------------------------ */
/* Hero Component                                                     */
/* ------------------------------------------------------------------ */

function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative -mt-20 flex min-h-[92vh] flex-col items-center justify-center overflow-hidden">
      {/* Editorial Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Radha Rani — Divine Style. Eternal Bond."
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Editorial Gradients for Light Luxury Aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/40 to-transparent" />
        <div className="absolute inset-0 bg-[var(--color-bg)]/25" />
      </div>

      {/* Editorial Hero Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 text-center sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg)]/80 px-4 py-1.5 text-[11px] font-medium tracking-[0.25em] uppercase text-[var(--color-accent)] backdrop-blur-md"
        >
          <span>THREADS OF DEVOTION</span>
        </motion.div>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-neutral-950"
        >
          <span className="block tracking-[0.08em] font-extrabold text-black">RADHA RANI</span>
          <span className="block font-serif italic font-bold text-2xl sm:text-4xl md:text-5xl mt-2 text-neutral-900">
            Divine Style. Eternal Bond.
          </span>
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-6 max-w-lg text-base sm:text-lg font-bold leading-relaxed text-neutral-950"
        >
          Contemporary women&apos;s fashion inspired by timeless Indian heritage.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-[var(--color-accent-light)] active:scale-100"
          >
            <span>SHOP CATALOG</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text)] backdrop-blur-xs transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            EXPLORE STORE
          </Link>
        </motion.div>
      </div>

      {/* Subtle Bottom Scroll Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          SCROLL TO EXPLORE
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured Collections Component                                     */
/* ------------------------------------------------------------------ */

function FeaturedCollections() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="collections" className="py-20 sm:py-28 bg-[var(--color-bg)] scroll-mt-24">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-accent)]">
            CURATED EDITIONS
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text)]">
            Featured Collections
          </h2>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Graceful ethnic silhouettes and contemporary feminine forms shaped by timeless devotion.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((col, idx) => (
            <motion.div
              key={col.name}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group relative overflow-hidden rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-muted)]"
            >
              <Link href={col.href} className="block aspect-[3/4] relative w-full overflow-hidden">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent transition-opacity group-hover:from-black/70" />

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white flex flex-col">
                  <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-white/80">
                    {col.eyebrow}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide mt-1">
                    {col.name}
                  </h3>
                  <p className="text-xs text-white/90 font-light mt-1.5 leading-relaxed">
                    {col.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white opacity-90 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    <span>Explore Collection</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bestsellers Component                                              */
/* ------------------------------------------------------------------ */

function BestsellersSection() {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products?featured=true&limit=8", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-bg-muted)]/40 border-y border-[var(--color-border)]/60">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-accent)]">
              MOST COVETED
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-text)]">
              Bestsellers
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)] hover:underline"
          >
            <span>View All Bestsellers</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <div className="aspect-[3/4] w-full rounded-md skeleton" />
                <div className="h-4 w-3/4 skeleton rounded" />
                <div className="h-3 w-1/3 skeleton rounded" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, 8).map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} eager={idx < 4} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            Products are arriving soon.
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Editorial Campaign / Brand Story Component                         */
/* ------------------------------------------------------------------ */

function BrandStoryTeaser() {
  return (
    <section className="py-24 sm:py-32 bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Editorial Image */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-muted)]">
            <Image
              src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1000&auto=format&fit=crop"
              alt="The Craft of Radha Rani"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          {/* Editorial Text */}
          <div className="flex flex-col space-y-6 lg:pl-6">
            <span className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-accent)]">
              OUR INSPIRATION
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.15] text-[var(--color-text)]">
              Devotion woven into modern silhouettes.
            </h2>
            <p className="text-sm sm:text-base font-light leading-relaxed text-[var(--color-text-muted)]">
              Radha Rani is born from the desire to bridge timeless Indian iconography—the rhythm of Krishna&apos;s flute, the fluid grace of Radha, the iridescent shimmer of peacock plumage—with minimalist contemporary tailoring.
            </p>
            <p className="text-sm sm:text-base font-light leading-relaxed text-[var(--color-text-muted)]">
              Rather than loud prints, we communicate heritage through architectural cuts, subtle placket embroidery, natural linen textures, and refined jewel tones. Clothing meant to feel quiet, noble, and deeply personal.
            </p>
            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-accent)]"
              >
                <span>Read The Radha Rani Story</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* New Arrivals Section                                               */
/* ------------------------------------------------------------------ */

function NewArrivalsSection() {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products?newArrival=true&limit=4", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-bg)] border-t border-[var(--color-border)]/60">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-accent)]">
              FRESH SILHOUETTES
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-text)]">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)] hover:underline"
          >
            <span>Explore All New</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <div className="aspect-[3/4] w-full rounded-md skeleton" />
                <div className="h-4 w-3/4 skeleton rounded" />
                <div className="h-3 w-1/3 skeleton rounded" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust & Heritage Pillars                                           */
/* ------------------------------------------------------------------ */

function BrandPillars() {
  const pillars = [
    {
      icon: Truck,
      title: "Complimentary Delivery",
      description: "On all domestic orders above ₹1,999 across India.",
    },
    {
      icon: Feather,
      title: "Handcrafted Heritage",
      description: "Carefully finished by master Indian artisans with premium fabrics.",
    },
    {
      icon: ShieldCheck,
      title: "Authentic Quality",
      description: "Certified materials, meticulous tailoring, and timeless cuts.",
    },
    {
      icon: RefreshCw,
      title: "Seamless Exchanges",
      description: "7-day effortless return and exchange policy for total peace of mind.",
    },
  ];

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]/30 py-16">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-accent)] mb-4 shadow-xs">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-base font-medium text-[var(--color-text)]">
                  {pillar.title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page Export                                                   */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <FeaturedCollections />
      <BestsellersSection />
      <BrandStoryTeaser />
      <NewArrivalsSection />
      <BrandPillars />
    </div>
  );
}