"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Eye,
  Heart,
  ShoppingBag,
  Compass,
  Check,
  Feather,
  Flower2,
  Crown,
  Scroll,
  Shirt,
} from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { useToastStore } from "@/lib/toast-store";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";

/* ------------------------------------------------------------------ */
/* Lookbook Editions Data                                             */
/* ------------------------------------------------------------------ */
interface LookbookEdition {
  id: string;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  story: string;
  heroImage: string;
  palette: { name: string; hex: string }[];
  fabricNote: string;
  featuredKeyword: string;
  badge: string;
}

const LOOKBOOK_EDITIONS: LookbookEdition[] = [
  {
    id: "sacred-raas",
    number: "01",
    tag: "Sharad Purnima Moonlight",
    title: "Sacred Raas",
    subtitle: "The Dance of Celestial Ecstasy",
    story:
      "Inspired by the mystical autumn midnight when Radha and Krishna dance under the Vrindavan stars. Flowing kalidar drapes, midnight blues, and luminous gold zari that catches the ambient temple lanterns.",
    heroImage:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    palette: [
      { name: "Yamuna Twilight", hex: "#0f2b48" },
      { name: "Temple Gold", hex: "#d4a574" },
      { name: "Peacock Royal", hex: "#0c4a6e" },
      { name: "Chandra Silver", hex: "#e2e8f0" },
    ],
    fabricNote: "Pure Banarasi Katan Silk with hand-loomed gold zari",
    featuredKeyword: "Anarkali",
    badge: "Limited Seasonal Edit",
  },
  {
    id: "temple-darshan",
    number: "02",
    tag: "Morning Aarti Sanctum",
    title: "Temple Darshan",
    subtitle: "Sanctum of Peace & Sacred Grace",
    story:
      "Garments woven for morning prayers and peaceful meditation. Pure unbleached kora silks, auspicious vermilion borders, and sandalwood hues crafted to evoke quiet spiritual serenity.",
    heroImage:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    palette: [
      { name: "Vermilion Sindoor", hex: "#be123c" },
      { name: "Kora Ivory", hex: "#fef3c7" },
      { name: "Sandalwood", hex: "#d97706" },
      { name: "Haldi Ochre", hex: "#eab308" },
    ],
    fabricNote: "Raw Tussar & Chanderi woven with temple borders",
    featuredKeyword: "Saree",
    badge: "Sanctum Series",
  },
  {
    id: "royal-bridal",
    number: "03",
    tag: "Heirloom Devotional Haute Couture",
    title: "Royal Bridal Heritage",
    subtitle: "The Eternal Radha Bridal Trove",
    story:
      "Centuries of artisanal legacy captured in heirloom lehengas. Months of meticulous zardozi needlework, beaten gold thread, and opulent brocades created for sacred marital vows.",
    heroImage:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=1200&auto=format&fit=crop",
    palette: [
      { name: "Imperial Crimson", hex: "#881337" },
      { name: "Antique Zari", hex: "#b45309" },
      { name: "Rani Rose", hex: "#be185d" },
      { name: "Emerald Velvet", hex: "#064e3b" },
    ],
    fabricNote: "Heavy Mulberry Brocade with Hand Zardozi Embroidery",
    featuredKeyword: "Lehenga",
    badge: "Masterpiece Heirloom",
  },
  {
    id: "vrinda-petals",
    number: "04",
    tag: "Sacred Yamuna Groves",
    title: "Vrinda Petals",
    subtitle: "Whispers of the Sacred Groves",
    story:
      "Ethereal featherweight organzas and botanical dyes infused with natural temple rose petals and fresh tulsi leaves. Light, breathable luxury for joyful festive celebrations.",
    heroImage:
      "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1200&auto=format&fit=crop",
    palette: [
      { name: "Lotus Blush", hex: "#f472b6" },
      { name: "Sacred Tulsi", hex: "#15803d" },
      { name: "Dawn Amber", hex: "#fed7aa" },
      { name: "Kasturi Mist", hex: "#fdf2f8" },
    ],
    fabricNote: "Handwoven Organza & Tissue Silk with Scalloped Gota",
    featuredKeyword: "Kurti",
    badge: "Botanical Essence",
  },
];

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
  { id: "festive", label: "Janmashtami & Holi Sangeet", note: "Luminous peacock tones & swirling kalis" },
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
  const [activeEdition, setActiveEdition] = useState<LookbookEdition>(LOOKBOOK_EDITIONS[0]);
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0].id);
  const [selectedFabric, setSelectedFabric] = useState(FABRICS[0].id);
  const [allProducts, setAllProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Load curated garments for the interactive showcases
  useEffect(() => {
    let cancelled = false;
    async function loadCouture() {
      try {
        const res = await fetch("/api/products?limit=16&category=WOMEN");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.products) {
          setAllProducts(data.products);
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

  // Filter garments that match the active edition's aesthetic
  const editionProducts = allProducts.filter((p) => {
    const text = `${p.name} ${p.description || ""}`.toLowerCase();
    return (
      text.includes(activeEdition.featuredKeyword.toLowerCase()) ||
      text.includes(activeEdition.title.toLowerCase())
    );
  });

  const displayedProducts =
    editionProducts.length > 0 ? editionProducts.slice(0, 4) : allProducts.slice(0, 4);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-bg)] pb-24 pt-28">
      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--color-primary)]/10 via-[var(--color-secondary)]/5 to-transparent blur-[120px]" />

      {/* ============================================================ */}
      {/* HERO SECTION: Editorial Atelier Statement                     */}
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
            Radha Rani Lookbook &amp; Atelier
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg"
          >
            An interactive boutique gallery of sacred weaves, royal bridal heritage, and timeless
            Vrindavan couture. Explore curations designed by mood, occasion, and artisanal provenance.
          </motion.p>

          {/* Quick Bridge to Technical Women's Catalogue */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#lookbooks"
              className="btn btn-primary shadow-lg shadow-[var(--color-primary)]/25"
            >
              <Compass size={16} />
              Explore Curated Lookbooks
            </a>
            <Link
              href="/shop?view=catalogue"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]/60 hover:bg-white/10"
            >
              <span>Browse Full Atelier Catalogue (Filters &amp; Sizes)</span>
              <ArrowRight size={14} className="text-[var(--color-accent)]" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 1: The Curated Lookbook Editions                      */}
      {/* ============================================================ */}
      <section id="lookbooks" className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Curated Style Edits
            </span>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--color-text)] sm:text-4xl">
              The Four Sacred Editions
            </h2>
          </div>
          <p className="max-w-md text-xs text-[var(--color-text-muted)]">
            Select an edition to immerse yourself in its narrative, curated color palette, and
            harmonious couture ensembles.
          </p>
        </div>

        {/* Edition Tabs */}
        <div className="no-scrollbar mb-10 flex gap-3 overflow-x-auto pb-2">
          {LOOKBOOK_EDITIONS.map((edition) => {
            const isSelected = activeEdition.id === edition.id;
            return (
              <button
                key={edition.id}
                type="button"
                onClick={() => setActiveEdition(edition)}
                className={`group relative flex shrink-0 items-center gap-3 rounded-2xl border px-5 py-3.5 text-left transition-all ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/15 shadow-md shadow-[var(--color-primary)]/10"
                    : "border-[var(--color-border)] bg-white/5 hover:border-[var(--color-border)]/80 hover:bg-white/10"
                }`}
              >
                <span
                  className={`font-mono text-xs font-bold ${
                    isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {edition.number}
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold tracking-wide ${
                      isSelected ? "text-white" : "text-[var(--color-text)]"
                    }`}
                  >
                    {edition.title}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{edition.tag}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Lookbook Editorial Hero Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeEdition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Editorial Narrative (7 cols) */}
              <div className="flex flex-col justify-between p-8 sm:p-12 lg:col-span-7">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                      {activeEdition.badge}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Edition #{activeEdition.number}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--color-accent)]">
                      {activeEdition.tag}
                    </p>
                    <h3 className="mt-1 font-serif text-3xl font-normal text-[var(--color-text)] sm:text-5xl">
                      {activeEdition.subtitle}
                    </h3>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                    &ldquo;{activeEdition.story}&rdquo;
                  </p>

                  {/* Sacred Color Swatches */}
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Sacred Harmony Palette
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {activeEdition.palette.map((swatch) => (
                        <div
                          key={swatch.name}
                          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-1.5"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span className="text-xs font-medium text-white/90">{swatch.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fabric Provenance Note */}
                  <div className="rounded-2xl border border-[var(--color-border)]/60 bg-white/5 p-4 text-xs text-[var(--color-text-muted)]">
                    <span className="font-semibold text-white">Weave &amp; Provenance: </span>
                    {activeEdition.fabricNote}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] pt-6">
                  <Link
                    href={`/shop?search=${encodeURIComponent(activeEdition.featuredKeyword)}`}
                    className="btn btn-primary"
                  >
                    <span>Explore All {activeEdition.title} Pieces</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/shop?view=catalogue"
                    className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-white"
                  >
                    View in Full Catalogue &rarr;
                  </Link>
                </div>
              </div>

              {/* Right Lookbook Imagery (5 cols) */}
              <div className="relative min-h-[380px] lg:col-span-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeEdition.heroImage}
                  alt={activeEdition.title}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 lg:bg-gradient-to-r lg:from-[var(--color-bg-elevated)] lg:via-transparent lg:to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    Atelier Spotlight
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Exclusive handloom cut for {activeEdition.title}
                  </p>
                  <p className="text-xs text-white/70">Hand-blessed in Vrindavan atelier</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Garments in this Lookbook Style Edit */}
        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
              <Sparkles size={16} className="text-[var(--color-accent)]" />
              Featured Couture in this Edition
            </h4>
            <Link
              href={`/shop?search=${encodeURIComponent(activeEdition.featuredKeyword)}`}
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              See all in catalogue &rarr;
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
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {displayedProducts.map((p, idx) => (
                <ProductCard key={p._id} product={p} index={idx} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              Couture garments currently being catalogued for this season.
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: Couture Silhouette Architectural Showcase          */}
      {/* ============================================================ */}
      <section className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Architectural Forms
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--color-text)] sm:text-4xl">
            The Women&apos;s Couture Silhouettes
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
