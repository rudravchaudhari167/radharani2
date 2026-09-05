"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  side?: "left" | "right";
  size?: "sm" | "md" | "lg" | "full";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = "right",
  size = "md",
  closeOnOverlayClick = true,
  showCloseButton = true,
}: DrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      contentRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") trapFocus(e);
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const trapFocus = (e: KeyboardEvent) => {
    const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const sizeClasses = {
    sm: "w-72 max-w-[85vw]",
    md: "w-96 max-w-[90vw]",
    lg: "w-[32rem] max-w-[95vw]",
    full: "w-full max-w-[100vw]",
  };

  const sideClasses = {
    left: "left-0",
    right: "right-0",
  };

  const animationVariants = {
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 200 }}
            className="fixed inset-0 z-50"
            onClick={() => closeOnOverlayClick && onClose()}
            aria-hidden="true"
          >
            <div className="fixed inset-0 bg-[var(--color-overlay)]" />
          </motion.div>
          <motion.div
            ref={contentRef}
            variants={animationVariants[side]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-0 bottom-0 z-50 flex flex-col bg-[var(--color-bg-elevated)] shadow-xl border-y border-[var(--color-border)]",
              sideClasses[side],
              sizeClasses[size]
            )}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] transition-colors"
                    aria-label="Close drawer"
                  >
                    {side === "left" ? <ChevronLeft size={20} /> : <X size={20} />}
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}