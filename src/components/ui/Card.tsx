"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", hover = false, className, children, ...props }, ref) => {
    const baseClasses = "rounded-xl bg-[var(--color-bg-elevated)] transition-all duration-200";

    const variantClasses = {
      default: "border border-[var(--color-border)] shadow-sm hover:shadow-md hover:border-[var(--color-border-strong)]",
      elevated: "border-none shadow-lg",
      bordered: "border-2 border-[var(--color-border)] shadow-none hover:border-[var(--color-border-strong)]",
    };

    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          hover && "hover:shadow-lg hover:-translate-y-0.5",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className="mb-4" {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className="text-lg font-semibold text-[var(--color-text)]" {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className="mt-1 text-sm text-[var(--color-text-muted)]" {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className="mt-4 pt-4 border-t border-[var(--color-border)]" {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";