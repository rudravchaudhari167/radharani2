"use client";

import { forwardRef, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
  ariaLabel = "Quantity",
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (!disabled && value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (!disabled && value < max) onChange(value + 1);
  };

  return (
    <div className={cn("flex items-center gap-2", className)} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
          "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]",
          "hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]",
          "disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]/20"
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>

      <span className="w-12 text-center text-sm font-semibold text-[var(--color-text)]" aria-live="polite">
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
          "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]",
          "hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]",
          "disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]/20"
        )}
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}