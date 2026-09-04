"use client";

import { useEffect, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  type LucideProps,
} from "lucide-react";
import { useToastStore, type Toast, type ToastType } from "@/lib/toast-store";

const ICONS: Record<ToastType, ComponentType<LucideProps>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENT: Record<ToastType, string> = {
  success: "#4ade80",
  error: "#fb7185",
  info: "#a78bfa",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[toast.type];
  const accent = ACCENT[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-card pointer-events-auto relative flex items-start gap-3 p-4"
      style={{
        boxShadow: `0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px ${accent}40`,
      }}
      role="status"
      aria-live="polite"
    >
      <span
        className="pointer-events-none absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <Icon size={20} color={accent} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm leading-relaxed text-[var(--color-text)]">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
      >
        <X size={16} className="text-[var(--color-text-muted)]" />
      </button>
    </motion.div>
  );
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}