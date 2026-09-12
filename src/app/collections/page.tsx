"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Gem, Compass, Feather } from "lucide-react";

interface CollectionChapter {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  palette: string[];
  href: string;
  highlights: string[];
}

const CHAPTERS: CollectionChapter[] = [
  {
    id: "radha-couture",
    chapter: "CHAPTER I",
    title: "Radha Rani Couture",
    subtitle: "Sacred Grace & Fluid Silhouettes",
    description:
      "Hand-spun silks, featherlight chanderi borders, and graceful pastel drapes capturing the eternal devotion, tenderness, and divine beauty of Sri Radha.",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    palette: ["#FAF7F2", "#E8D8C8", "#D4A574", "#B8965A"],
    href: "/shop?search=saree",
    highlights: ["Hand-embroidered Zardozi", "Pure Mulberry Silks", "Featherlight Drapes"],
  },
  {
    id: "vrindavan-anarkalis",
    chapter: "CHAPTER II",
    title: "Vrindavan Anarkalis & Festive Ensembles",
    subtitle: "Regal Flairs & Sacred Zardozi",
    description:
      "Floor-sweeping anarkalis, dupioni silk flared lehengas, and layered ethnic silhouettes in deep peacock indigos, lotus pinks, and midnight hues.",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1200&auto=format&fit=crop",
    palette: ["#1D3048", "#2D4A6B", "#D4AF37", "#6D1A7A"],
    href: "/shop?search=anarkali",
    highlights: ["Intricate Bodice Zardozi", "Pure Mulberry Silks & Chiffon", "Graceful Twirls & Drapes"],
  },
  {
    id: "contemporary-drapes",
    chapter: "CHAPTER III",
    title: "Contemporary Drapes & Co-ord Sets",
    subtitle: "Breezy Mul-Mul & Liquid Satins",
    description:
      "Modern slip dresses, fluted satin midis, and relaxed two-piece palazzo co-ord sets designed for effortless feminine grace and everyday luxury.",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
    palette: ["#C5A059", "#EFEFE8", "#2E5E3D", "#997B66"],
    href: "/shop?search=dress",
    highlights: ["Pure Mul Mul Cottons", "Hand-painted Lotus Motifs", "Fluid Satin Touch"],
  },
  {
    id: "ceremonial-edition",
    chapter: "CHAPTER IV",
    title: "The Festive & Ceremonial Edition",
    subtitle: "Royal Brocades & Golden Zari",
    description:
      "Exclusive celebratory garments weaving gold zari yarns with jewel-toned textiles—crimson, emerald, and turmeric gold—crafted for sanctified occasions.",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop",
    palette: ["#800020", "#004D40", "#D4AF37", "#4A0E17"],
    href: "/shop?search=lehenga",
    highlights: ["Banarasi Zari Weaves", "Occasion Wear Elegance", "Limited Seasonal Runs"],
  },
];

export default function CollectionsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Editorial Lookbook Header */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]/70 py-20 sm:py-28">
        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)]/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-[var(--color-accent)]"
            >
              <Sparkles size={12} />
              <span>EDITORIAL LOOKBOOK</span>
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[var(--color-text)] tracking-tight"
            >
              Curated Collections
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mx-auto mt-4 max-w-xl text-sm sm:text-base font-light leading-relaxed text-[var(--color-text-muted)]"
            >
              Each collection is a thematic chapter shaped by timeless Indian devotion, delicate handloom textures, and contemporary silhouette architecture.
            </motion.p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-transform hover:scale-[1.02]"
              >
                <span>Browse All Products</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters Breakdown */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
          {CHAPTERS.map((col, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <motion.article
                key={col.id}
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7 }}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center ${
                  isEven ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Visual Lookbook Image */}
                <div
                  className={`lg:col-span-7 ${
                    isEven ? "lg:col-start-6" : "lg:col-start-1"
                  }`}
                >
                  <Link
                    href={col.href}
                    className="group relative block aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-muted)] shadow-sm"
                  >
                    <Image
                      src={col.image}
                      alt={col.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white sm:bottom-6 sm:left-6 sm:right-6">
                      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium text-white/90">
                        {col.subtitle}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)] group-hover:translate-x-1 transition-transform">
                        Explore Chapter <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Editorial Content */}
                <div
                  className={`lg:col-span-5 space-y-6 ${
                    isEven ? "lg:col-start-1" : "lg:col-start-8"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
                      {col.chapter}
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-text)]">
                      {col.title}
                    </h2>
                    <p className="font-serif italic text-base text-[var(--color-accent)]">
                      {col.subtitle}
                    </p>
                  </div>

                  <p className="text-sm font-light leading-relaxed text-[var(--color-text-muted)]">
                    {col.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2 pt-2 border-t border-[var(--color-border)]/60">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                      Collection Signature
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {col.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1 text-xs font-normal text-[var(--color-text)]"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Color Palette Preview */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mr-2">
                      Palette
                    </span>
                    {col.palette.map((c, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={col.href}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
                    >
                      <span>Discover {col.title}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Atelier Craftsmanship Note */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]/60 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Feather size={28} className="mx-auto text-[var(--color-accent)]" />
          <h3 className="mt-4 font-serif text-2xl sm:text-3xl font-normal text-[var(--color-text)]">
            Bespoke Atelier Inquiries
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-relaxed text-[var(--color-text-muted)]">
            Seeking custom bridal or ceremonial ensembles tailored to your personal measurements? Our Radha Rani master artisans offer bespoke tailoring.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[var(--color-accent-light)] transition-colors"
            >
              <span>Consult Atelier</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-8 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
            >
              <span>View All Creations</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
