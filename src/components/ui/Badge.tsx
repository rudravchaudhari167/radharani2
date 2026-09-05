"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "new" | "sale" | "bestseller" | "out-of-stock" | "accent" | "gold" | "success" | "warning" | "error";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", dot = false, className, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center gap-1.5 font-medium rounded-full";

    const variantClasses = {
      default: "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
      new: "bg-[var(--color-accent-muted)] text-[var(--color-accent)]",
      sale: "bg-[var(--color-error-light)] text-[var(--color-error)]",
      bestseller: "bg-[var(--color-gold-muted)] text-[var(--color-gold)]",
      "out-of-stock": "bg-[var(--color-bg-muted)] text-[var(--color-text-subtle)] border border-[var(--color-border)]",
      accent: "bg-[var(--color-accent)] text-[var(--color-text-inverse)]",
      gold: "bg-[var(--color-gold)] text-[var(--color-text)]",
      success: "bg-[var(--color-success-light)] text-[var(--color-success)]",
      warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
      error: "bg-[var(--color-error-light)] text-[var(--color-error)]",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs gap-1",
      md: "px-3 py-1 text-sm gap-1.5",
    };

    return (
      <span
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";