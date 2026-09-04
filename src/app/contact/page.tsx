"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  MessageSquare,
  Heart,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const ease = [0.22, 1, 0.36, 1] as const;

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping within India takes 5-7 business days. Express shipping delivers within 2-3 business days. International orders typically arrive within 10-15 business days depending on your location.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a hassle-free 15-day return policy. Items must be unworn, unwashed, with original tags attached. Simply reach out to our support team and we'll arrange a pickup at no extra cost.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, and popular wallets. All transactions are secured with 256-bit SSL encryption for your safety.",
  },
  {
    q: "How do I find my size?",
    a: "Each product page includes a detailed size guide with measurements in both inches and centimeters. If you're between sizes, we recommend sizing up for a comfortable fit. Our support team is always happy to help with sizing advice.",
  },
  {
    q: "Are the products handmade?",
    a: "Many of our pieces feature handcrafted elements by skilled Indian artisans. Each product listing specifies the level of handwork involved. We're committed to preserving traditional craftsmanship while creating modern designs.",
  },
];

const INFO_CARDS = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@vrindav.com",
    gradient: "from-violet-500/20 to-purple-600/20",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+91 98765 43210",
    gradient: "from-pink-500/20 to-rose-600/20",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Vrindavan, Uttar Pradesh",
    gradient: "from-amber-500/20 to-orange-600/20",
  },
];

/* ------------------------------------------------------------------ */
/* FadeIn                                                               */
/* ------------------------------------------------------------------ */

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact Form                                                         */
/* ------------------------------------------------------------------ */

function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    if (
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      errs.email = "Please enter a valid email";
    if (!form.subject.trim() || form.subject.trim().length < 3)
      errs.subject = "Subject must be at least 3 characters";
    if (!form.message.trim() || form.message.trim().length < 10)
      errs.message = "Message must be at least 10 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ name: "", email: "", subject: "", message: "" });
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card flex flex-col items-center px-8 py-16 text-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--color-text)]">
          Message sent successfully
        </h3>
        <p className="mt-3 max-w-sm text-sm text-[var(--color-text-muted)]">
          Thank you for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="btn mt-8"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 outline-none transition-all duration-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:bg-white/[0.06]";

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
          <MessageSquare size={20} className="text-[var(--color-primary-light)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">
            Send a Message
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            We&apos;d love to hear from you
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
          )}
        </div>
        <div>
          <input
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
          />
          {errors.subject && (
            <p className="mt-1.5 text-xs text-red-400">{errors.subject}</p>
          )}
        </div>
        <div>
          <textarea
            placeholder="Your message (min 10 characters)"
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={`${inputClass} resize-none`}
          />
          {errors.message && (
            <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary mt-6 w-full"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={16} />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Info Cards                                                           */
/* ------------------------------------------------------------------ */

function InfoCards() {
  return (
    <div className="space-y-4">
      {INFO_CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <FadeIn key={card.title} delay={i * 0.1}>
            <div className="glass-card group relative overflow-hidden px-6 py-5">
              <div
                className={`absolute inset-0 rounded-[1.25rem] bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-secondary)]/15 border border-white/10 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={20}
                    className="text-[var(--color-primary-light)]"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {card.title}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                  */
/* ------------------------------------------------------------------ */

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <FadeIn key={i} delay={i * 0.06}>
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-sm font-semibold text-[var(--color-text)] sm:text-base">
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: open === i ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="ml-4 flex-shrink-0"
              >
                <ChevronDown
                  size={18}
                  className="text-[var(--color-text-muted)]"
                />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/[0.06] px-6 pb-5 pt-4">
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {faq.a}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Social Icons                                                         */
/* ------------------------------------------------------------------ */

function SocialIcons() {
  const socials = [
    { name: "Instagram", href: "#", path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" },
    { name: "Twitter", href: "#", path: "M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17a4.92 4.92 0 0 0-8.39 4.48A13.94 13.94 0 0 1 1.64 4.15a4.93 4.93 0 0 0 1.52 6.57 4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 4.9 4.9 0 0 1-2.22.08 4.93 4.93 0 0 0 4.6 3.42A9.87 9.87 0 0 1 0 21.54a13.94 13.94 0 0 0 7.55 2.21c9.05 0 14-7.5 14-14v-.64A9.94 9.94 0 0 0 24 4.56a9.87 9.87 0 0 1-2.83.77z" },
    { name: "Facebook", href: "#", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  ];

  return (
    <div className="flex items-center gap-3">
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.href}
          aria-label={s.name}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-28 pb-16 text-center">
        <div className="pointer-events-none absolute left-1/3 top-0 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 bottom-0 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.14),transparent_60%)] blur-3xl" />

        <FadeIn className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-[var(--color-primary-light)] backdrop-blur-md">
            <Heart size={13} />
            GET IN TOUCH
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Let&apos;s{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              Connect
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-light text-[var(--color-text-muted)] sm:text-lg">
            Have a question, suggestion, or just want to say hello?
            We&apos;d love to hear from you.
          </p>
        </FadeIn>
      </section>

      {/* Main content */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <InfoCards />
            <FadeIn delay={0.3}>
              <div className="glass-card p-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  Follow Us
                </p>
                <SocialIcons />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <FadeIn className="mb-10 text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-primary-light)]">
            <MessageSquare size={14} />
            FAQ
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </FadeIn>
        <FaqAccordion />
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-primary)]/10 to-[var(--color-bg)]" />
        <FadeIn className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Ready to explore?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base font-light text-[var(--color-text-muted)]">
            Browse our divine collection and find pieces that speak to your soul.
          </p>
          <Link
            href="/shop"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8)] transition-shadow duration-300 hover:shadow-[0_14px_40px_-6px_rgba(236,72,153,0.8)]"
          >
            Shop Collection
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
