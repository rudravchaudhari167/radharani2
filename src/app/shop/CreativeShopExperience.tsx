"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Check,
  Feather,
  Flower2,
  Crown,
  Scroll,
} from "lucide-react";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";

/* ------------------------------------------------------------------ */
/* Couture Silhouettes Cards                                          */
/* ------------------------------------------------------------------ */
const SILHOUETTES = [
  {
    title: "The Banarasi & Kanjivaram Saree",
    desc: "Six yards of woven poetry with beaten zari pallus and sacred floral buttas.",
    craft: "Jacquard Pit Loom • Varanasi",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    tag: "Saree",
    href: "/shop?search=saree",
  },
  {
    title: "The Kalidar Anarkali Suit",
    desc: "Voluminous 48-kali silhouette tailored for effortless twirling and graceful posture.",
    craft: "Hand Pleated • Pure Silk Mulmul",
    image:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
    tag: "Anarkali",
    href: "/shop?search=anarkali",
  },
  {
    title: "The Heirloom Devotional Lehenga",
    desc: "Intricately hand-embroidered with peacock motifs and sacred flute symbology.",
    craft: "Master Zardozi Needlecraft",
    image:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=800&auto=format&fit=crop",
    tag: "Lehenga",
    href: "/shop?search=lehenga",
  },
  {
    title: "The Chanderi & Tussar Kurti",
    desc: "Daily artisanal elegance with sheer gossamer texture and hand-block gold accents.",
    craft: "Hand-Spun Wild Silk Weave",
    image:
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=800&auto=format&fit=crop",
    tag: "Kurti",
    href: "/shop?search=kurti",
  },
];

/* ------------------------------------------------------------------ */
/* Interactive Ensemble Matcher Options                                */
/* ------------------------------------------------------------------ */
const OCCASIONS = [
  { id: "aarti", label: "Morning Temple Aarti", note: "Pure serene ivory & auspicious vermilion" },
  { id: "festive", label: "Janmashtami & Festive Sangeet", note: "Luminous peacock tones & swirling kalis" },
  { id: "wedding", label: "Sacred Wedding Vivaha", note: "Opulent Banarasi zari & royal crimson" },
  { id: "devotion", label: "Daily Devotional Grace", note: "Featherweight Chanderi & wild Tussar" },
];

const FABRICS = [
  { id: "katan", label: "Banarasi Katan Silk", icon: Crown },
  { id: "chanderi", label: "Featherweight Chanderi", icon: Feather },
  { id: "organza", label: "Botanical Silk Organza", icon: Flower2 },
  { id: "tussar", label: "Raw Ahimsa Tussar", icon: Scroll },
];

export default function CreativeShopExperience() {
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0].id);
  const [selectedFabric, setSelectedFabric] = useState(FABRICS[0].id);
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Load curated garments for the interactive showcase
  useEffect(() => {
    let cancelled = false;
    async function loadCouture() {
      try {
        const res = await fetch("/api/products?limit=8&category=WOMEN");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.products) {
          setProducts(data.products);
        }
      } catch {
        // graceful fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCouture();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-bg)] pb-24 pt-28">
      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--color-primary)]/10 via-[var(--color-secondary)]/5 to-transparent blur-[120px]" />

      {/* ============================================================ */}
      {/* HERO SECTION: Editorial Statement                           */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-[84rem] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)] backdrop-blur-md"
          >
            <Sparkles size={13} />
            L&apos;Atelier de Dévotion
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 font-serif text-4xl font-normal tracking-tight text-[var(--color-text)] sm:text-6xl lg:text-7xl"
          >
            Radha Rani Atelier &amp; Boutique
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg"
          >
            Handcrafted devotional couture, heritage Banarasi silks, and ethereal silhouettes
            inspired by the timeless grace of Sri Radha. Explore by architectural silhouette,
            fabric weave, or curated occasions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#silhouettes"
              className="btn btn-primary shadow-lg shadow-[var(--color-primary)]/25"
            >
              <Compass size={16} />
              Explore Silhouettes
            </a>
            <Link
              href="/shop?view=catalogue"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]/60 hover:bg-white/10"
            >
              <span>Browse Full Catalogue with Filters</span>
              <ArrowRight size={14} className="text-[var(--color-accent)]" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 1: Couture Silhouette Architectural Showcase          */}
      {/* ============================================================ */}
      <section id="silhouettes" className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Architectural Forms
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--color-text)] sm:text-4xl">
            Couture Silhouettes
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs text-[var(--color-text-muted)]">
            Each silhouette is an homage to sacred iconography — constructed to drape flatteringly
            with effortless devotional comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SILHOUETTES.map((sil, i) => (
            <motion.div
              key={sil.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-all duration-300 hover:border-[var(--color-accent)]/50 hover:shadow-xl hover:shadow-[var(--color-primary)]/10"
            >
              {/* Image with zoom on hover */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sil.image}
                  alt={sil.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    {sil.craft}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="font-serif text-lg font-normal text-white">{sil.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {sil.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-border)]/50">
                  <Link
                    href={sil.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] transition-transform group-hover:translate-x-1"
                  >
                    <span>View {sil.tag}s in Catalogue</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: Featured Atelier Pieces                            */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Curated Masterpieces
            </span>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--color-text)] sm:text-4xl">
              Featured Atelier Garments
            </h2>
          </div>
          <Link
            href="/shop?view=catalogue"
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            Open full catalogue with filters &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <div className="skeleton aspect-[4/5] rounded-none" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, idx) => (
              <ProductCard key={p._id} product={p} index={idx} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            Couture garments are currently being prepared.
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: Interactive Darshan Ensemble Matcher              */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/15 via-[var(--color-bg-elevated)] to-black/80 p-8 sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />

          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Interactive Stylist
            </span>
            <h2 className="mt-1 font-serif text-3xl font-normal text-white sm:text-4xl">
              Curate Your Darshan Ensemble
            </h2>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Select your divine occasion and preferred weave to discover the ideal harmonized look.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Controls (7 cols) */}
            <div className="space-y-8 lg:col-span-7">
              {/* 1. Occasion */}
              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Step 1: Choose Your Sacred Occasion
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {OCCASIONS.map((occ) => {
                    const isSelected = selectedOccasion === occ.id;
                    return (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setSelectedOccasion(occ.id)}
                        className={`rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white"
                            : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold">{occ.label}</p>
                          {isSelected && <Check size={14} className="text-[var(--color-accent)]" />}
                        </div>
                        <p className="mt-1 text-[11px] opacity-75">{occ.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Fabric Weave */}
              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Step 2: Choose Your Fabric Weave
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {FABRICS.map((fab) => {
                    const isSelected = selectedFabric === fab.id;
                    const Icon = fab.icon;
                    return (
                      <button
                        key={fab.id}
                        type="button"
                        onClick={() => setSelectedFabric(fab.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white"
                            : "border-[var(--color-border)] bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon size={18} className={isSelected ? "text-[var(--color-accent)]" : ""} />
                        <span className="text-[11px] font-semibold">{fab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stylist Recommendation Card (5 cols) */}
            <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-accent)]/40 bg-black/40 p-6 backdrop-blur-md lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[var(--color-accent)]/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    Atelier Recommendation
                  </span>
                  <Sparkles size={16} className="text-[var(--color-accent)]" />
                </div>

                <h4 className="mt-4 font-serif text-xl font-normal text-white">
                  {OCCASIONS.find((o) => o.id === selectedOccasion)?.label} Edit
                </h4>

                <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  For this devotional setting, we recommend pairing our{" "}
                  <strong className="text-white">
                    {FABRICS.find((f) => f.id === selectedFabric)?.label}
                  </strong>{" "}
                  with antique brass jhumkas, a lotus blossom in the hair, and our scalloped zardozi
                  dupatta drape.
                </p>

                <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white/90">
                  <div className="flex justify-between">
                    <span className="text-white/60">Drape Style:</span>
                    <span className="font-semibold">Traditional Seedha Pallu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Recommended Footwear:</span>
                    <span className="font-semibold">Hand-embroidered Mojaris</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Fragrance Accord:</span>
                    <span className="font-semibold">Natural Kasturi &amp; Sandal</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <Link
                  href="/shop?view=catalogue"
                  className="btn btn-primary w-full justify-center text-xs"
                >
                  <span>Shop Matching Atelier Garments</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4: Artisan Provenance & Ethical Pillars               */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
              <Scroll size={22} />
            </div>
            <h3 className="mt-5 font-serif text-xl font-normal text-white">
              Varanasi Master Pit-Looms
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              Every saree and brocade panel takes our 4th-generation master weavers anywhere from 18 to
              45 days to weave by hand using Jacquard punch-cards.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
              <Flower2 size={22} />
            </div>
            <h3 className="mt-5 font-serif text-xl font-normal text-white">
              Sacred Botanical Alchemy
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              Dyed with repurposed temple rose petals, dried marigold garlands from Bankey Bihari
              temple, and natural madder root — respectful to Mother Earth.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
              <Feather size={22} />
            </div>
            <h3 className="mt-5 font-serif text-xl font-normal text-white">
              Ahimsa Non-Violent Silks
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              Harvested only after the silkworm naturally emerges into a moth. Devotion in action,
              ensuring sacred purity in every thread worn before deities.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5: Elegant Footer Banner Bridge to Catalogue         */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-[84rem] px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-[var(--color-border)] bg-gradient-to-r from-black/80 via-white/5 to-black/80 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-serif text-2xl font-normal text-white">
              Ready to filter by Size, Price &amp; Color?
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Explore the full Radha Rani Couture Catalogue with live filters, stock status, and
              instant checkout.
            </p>
          </div>
          <Link
            href="/shop?view=catalogue"
            className="btn btn-primary shrink-0 shadow-lg shadow-[var(--color-primary)]/20"
          >
            <span>Open Full Catalogue</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
