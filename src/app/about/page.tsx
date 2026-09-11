"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Compass,
  Feather,
  Gem,
  Globe,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 pt-20 text-[#171717]">
      {/* Editorial Hero */}
      <section className="relative overflow-hidden border-b border-[#E7E3DC] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E7E3DC] bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2D4A6B]">
              <Sparkles size={12} className="text-[#B8965A]" />
              The Story of Radha Rani
            </span>
            <h1 className="mt-4 font-serif text-4xl font-light leading-[1.15] tracking-tight text-[#171717] sm:text-6xl lg:text-7xl">
              Where eternal devotion meets{" "}
              <span className="italic font-normal">modern sartorial grace</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm font-light leading-relaxed text-[#666666] sm:text-base">
              Radha Rani was founded on the belief that sacred inspiration and high
              fashion can coexist in pure harmony. Every garment is conceived as
              a testament to love, craft, and understated elegance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Chapter 1: Our Inspiration */}
      <section className="border-b border-[#E7E3DC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#F4F1EA]">
              <Image
                src="/hero-bg.png"
                alt="Radha Rani atelier inspiration"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E7E3DC]">
                  Chapter I
                </p>
                <p className="mt-1 font-serif text-xl font-light">
                  The Sacred Groves & Eternal Bond
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2D4A6B]">
                Our Inspiration
              </p>
              <h2 className="font-serif text-3xl font-light tracking-tight text-[#171717] sm:text-4xl">
                Radha, Krishna & The Spirit of Vrindavan
              </h2>
              <p className="text-sm font-light leading-relaxed text-[#666666]">
                For centuries, the love story of Radha and Krishna has stood as
                the highest emblem of selfless devotion, transcendent beauty,
                and spiritual grace. In the sacred atmosphere of Vrindavan, where
                every breeze carries whispers of classical poetry and timeless
                melodies, our creative journey begins.
              </p>
              <p className="text-sm font-light leading-relaxed text-[#666666]">
                Rather than literal iconography, we translate this devotion into
                subtle details: the gentle curvature of a peacock plume
                embroidered in tonal silk thread, the tranquil hue of Yamuna blue,
                the sacred warmth of chandan ivory, and the quiet dignity of pure
                lotus motifs.
              </p>
              <div className="border-l-2 border-[#171717] pl-4 italic text-xs text-[#666666]">
                &ldquo;Devotion is not merely a practice—it is an aesthetic of
                purity, reverence, and unconditional love.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2: The Four Pillars */}
      <section className="border-b border-[#E7E3DC] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2D4A6B]">
              Foundations
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-[#171717] sm:text-4xl">
              The Four Pillars of Radha Rani
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-7 transition-shadow hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-white">
                <Compass size={18} />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                1. Spiritual Elegance
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#666666]">
                Every silhouette balances modesty, grandeur, and minimalism. We
                craft clothing that empowers the wearer with a sense of peace,
                poise, and transcendent identity.
              </p>
            </div>

            <div className="rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-7 transition-shadow hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#2D4A6B] text-white">
                <Feather size={18} />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                2. Master Textile Craft
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#666666]">
                We honor India’s historic weavers: handloom organic cottons,
                breathable mulmul, gossamer Chanderi silks, and soft Maheshwari
                weaves tailored for modern comfort.
              </p>
            </div>

            <div className="rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-7 transition-shadow hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#2A5C5A] text-white">
                <Gem size={18} />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                3. Quiet Luxury Detail
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#666666]">
                Our embellishments are refined: antique zari piping, mother-of-pearl
                fastenings, tonal hand-guided stitches, and hand-rolled hems that
                whisper quality without loud logos.
              </p>
            </div>

            <div className="rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-7 transition-shadow hover:shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-white">
                <Globe size={18} />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                4. Global Renaissance
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#666666]">
                Bringing authentic Indian storytelling and spiritual heritage to
                the international runway, setting a standard for mindful luxury
                worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: Our Craft & Presentation */}
      <section className="border-b border-[#E7E3DC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 space-y-6 lg:order-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2D4A6B]">
                Atelier Standards
              </p>
              <h2 className="font-serif text-3xl font-light tracking-tight text-[#171717] sm:text-4xl">
                The Uncompromising Art of Craft
              </h2>
              <p className="text-sm font-light leading-relaxed text-[#666666]">
                From first pattern to final stitch, each piece undergoes a
                meticulous tailoring protocol. We work closely with master
                karigars whose families have honed weaving and embroidery for
                generations.
              </p>
              <p className="text-sm font-light leading-relaxed text-[#666666]">
                Every order arrives in our signature keepsake box: wrapped in
                scented mulberry tissue, accompanied by an authentication card
                detailing the craftspeople behind the garment, and sealed with a
                gold-embossed Radha Rani crest.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#171717] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2D4A6B]"
                >
                  Explore Current Atelier
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="order-1 grid grid-cols-2 gap-4 lg:order-2">
              <div className="aspect-[3/4] rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-6 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                  Textile Sourcing
                </span>
                <div>
                  <p className="font-serif text-2xl font-light text-[#171717]">
                    100%
                  </p>
                  <p className="mt-1 text-xs text-[#666666]">
                    Natural & Biodegradable Fibers
                  </p>
                </div>
              </div>
              <div className="aspect-[3/4] rounded-sm border border-[#E7E3DC] bg-[#FAF9F6] p-6 flex flex-col justify-between mt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                  Artisanal Hours
                </span>
                <div>
                  <p className="font-serif text-2xl font-light text-[#171717]">
                    18–45 hrs
                  </p>
                  <p className="mt-1 text-xs text-[#666666]">
                    Handwork per Heritage Garment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Statement CTA */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="font-serif italic text-2xl font-light text-[#171717] sm:text-3xl">
            &ldquo;Divine Style. Eternal Bond.&rdquo;
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#666666]">
            Wear your devotion with pride.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#171717] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2D4A6B]"
            >
              Shop The Collection
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
