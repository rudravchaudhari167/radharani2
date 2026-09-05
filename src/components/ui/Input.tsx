"use client";

import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-[var(--color-text)] mb-1.5",
              required && "label-required"
            )}
          >
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-md border bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-all duration-150",
            "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            "focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)]/20",
            "disabled:bg-[var(--color-bg-muted)] disabled:text-[var(--color-text-subtle)] disabled:cursor-not-allowed",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends Omit<InputHTMLAttributes<HTMLTextAreaElement>, "label" | "error" | "hint"> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-[var(--color-text)] mb-1.5",
              required && "label-required"
            )}
          >
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-md border bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-all duration-150 resize-y min-h-[100px]",
            "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            "focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)]/20",
            "disabled:bg-[var(--color-bg-muted)] disabled:text-[var(--color-text-subtle)] disabled:cursor-not-allowed",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, "label" | "error" | "hint"> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-[var(--color-text)] mb-1.5",
              required && "label-required"
            )}
          >
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-md border bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] transition-all duration-150 appearance-none",
            "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            "focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)]/20",
            "disabled:bg-[var(--color-bg-muted)] disabled:text-[var(--color-text-subtle)] disabled:cursor-not-allowed",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, children, className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-sm font-medium text-[var(--color-text)] mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>}
    </label>
  )
);

Label.displayName = "Label";