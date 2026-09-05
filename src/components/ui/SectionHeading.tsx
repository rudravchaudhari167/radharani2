"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
  > {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  id?: string;
}

export const SectionHeading = forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ eyebrow, title, subtitle, id, className, children, ...props }, ref) => {
    const reduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        id={id}
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn("mx-auto mb-10 max-w-2xl text-center sm:mb-14", className)}
        {...props}
      >
        {eyebrow && (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-accent)]"
          >
            {children}
            {eyebrow}
            {children}
          </motion.p>
        )}
        <h2 className="text-3xl font-serif font-medium tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
          {String(title).split(" ").map((word, wi) => (
            <motion.span
              key={wi}
              className="inline-block whitespace-pre"
              initial={reduceMotion ? false : { opacity: 0, y: 24, filter: "blur(6px)", rotateX: 45 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 }}
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
);

SectionHeading.displayName = "SectionHeading";