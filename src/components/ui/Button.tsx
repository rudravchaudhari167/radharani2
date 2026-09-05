"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type ElementType } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      asChild = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      primary: "bg-[var(--color-accent)] text-[var(--color-text-inverse)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] hover:border-[var(--color-accent-light)] active:bg-[var(--color-accent)]",
      secondary: "bg-transparent text-[var(--color-accent)] border border-[var(--color-border)] hover:bg-[var(--color-accent-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
      ghost: "bg-transparent text-[var(--color-text-muted)] border-none hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]",
      gold: "bg-[var(--color-gold)] text-[var(--color-text)] border border-[var(--color-gold)] hover:bg-[var(--color-gold-light)] hover:border-[var(--color-gold-light)]",
    };

    const sizeClasses = {
      sm: "px-4 py-2 text-sm gap-1.5",
      md: "px-6 py-3 text-sm gap-2",
      lg: "px-8 py-4 text-base gap-2",
    };

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";